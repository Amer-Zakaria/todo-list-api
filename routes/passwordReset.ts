import express from "express";
import prisma from "./../prisma/client";
import validateReq from "../middleware/validateReq";
import { expiresAt } from "../schemas/user";
import {
  validateRequestPasswordReset,
  validateResetPassword,
} from "../schemas/passReset";
import generateRandomCode from "./../utils/GenerateRandomCode";
import { transporter } from "..";
import bcrypt from "bcrypt";
import Config from "config";

const router = express.Router();

router.post(
  "/request-password-reset",
  validateReq(validateRequestPasswordReset, "body"),
  async (req, res) => {
    //fetish the user
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
      include: { emailVerification: true },
    });

    //check if user exists
    if (!user)
      return res
        .status(404)
        .json({ email: `There's no user with this email: ${req.body.email}` });
    if (!user.emailVerification) throw new Error();

    //check if it's not verified
    if (!user.emailVerification.isVerified)
      return res.status(403).json({
        message: "The user is not verified",
      });

    //create the rerset password request
    const code = generateRandomCode();
    await prisma.resetPasswordRequest.create({
      data: {
        email: user.email,
        code,
        expiresAt: expiresAt(),
      },
    });

    //send an email with the code
    await transporter.sendMail({
      from: Config.get("mailer.email"),
      to: req.body.email,
      subject: "Reset Password Code",
      html: `
        <p>
          Your reset password code is: <strong>${code}</strong>.
          <br />
          Note: it's only valid for 2 hours.
        </p>`,
    });

    res.json();
  }
);

router.post(
  "/",
  validateReq(validateResetPassword, "body"),
  async (req, res) => {
    //fetish the reset passwrod request
    const { code, newPassword } = req.body;
    const resetPasswordRequest = await prisma.resetPasswordRequest.findUnique({
      where: { code },
    });

    //check if it's valid
    if (
      !resetPasswordRequest ||
      Date.parse(resetPasswordRequest.expiresAt.toString()) - Date.now() <= 0
    ) {
      return res
        .status(400)
        .json({ code: "Invalid or expired reset password code." });
    }

    //Hashing the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    //updating the password
    await prisma.user.update({
      where: { email: resetPasswordRequest.email },
      data: { password: hashedPassword },
    });

    //removing the request
    await prisma.resetPasswordRequest.delete({ where: { code } });

    res.json();
  }
);

export default router;
