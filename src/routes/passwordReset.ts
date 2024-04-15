import express from "express";
import prisma from "../client";
import validateReq from "../middleware/validateReq";
import {
  validateRequestPasswordReset,
  validateResetPassword,
} from "../schemas/passReset";
import { transporter } from "../index";
import bcrypt from "bcrypt";
import Config from "config";
import constructErrorResponse from "../utils/constructErrorResponse";
import generateToken from "../utils/generateToken";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import jwt from "jsonwebtoken";
import { logger } from "../index";

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
      return res.status(404).json(
        constructErrorResponse(new Error(), {
          validation: {
            email: `There's no user with this email: ${req.body.email}`,
          },
        })
      );
    if (!user.emailVerification) throw new Error();

    //check if Google OAuth user
    if (!user.password)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          message: "You've continued using Google, please sign-in with Google.",
        })
      );

    //check if it's not verified
    if (!user.emailVerification.isVerified)
      return res.status(403).json(
        constructErrorResponse(new Error(), {
          message: "The user is not verified",
        })
      );

    //create the rerset password JWT
    const resetPassToken = jwt.sign(
      { userId: user.id },
      Config.get("resetPass.jwtPrivateKey") as string,
      { expiresIn: Config.get("resetPass.tokenTtl") as string }
    );

    //send an email with a reset pass link
    transporter
      .sendMail({
        from: Config.get("mailer.email"),
        to: user.email,
        subject: "Your Reset Password Link",
        html: `
          <p>
            Your reset  password link is: ${Config.get(
              "origin"
            )}/reset-pass?resetPassToken=${resetPassToken}.
            <br />
            Note: it's only valid for ${Config.get("resetPass.tokenTtl")}.
          </p>`,
      })
      .catch((err) => {
        logger.error(err);
      });

    res.json();
  }
);

router.put(
  "/",
  validateReq(validateResetPassword, "body"),
  async (req, res) => {
    const { token, newPassword } = req.body;

    //cechk if the reset pass token is valid
    let userId: number;
    try {
      const decoded = jwt.verify(token, Config.get("resetPass.jwtPrivateKey"));
      userId = (decoded as { userId: number }).userId;
    } catch (err) {
      return res
        .status(400)
        .send(
          constructErrorResponse(err as Error, {
            validation: { token: "Token is invalid" },
          })
        );
    }

    //Hashing the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    //updating the password
    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: { emailVerification: true },
    });

    const accessToken = await generateToken(<IUserWithVerification>user);
    const refreshToken = await generateToken(<IUserWithVerification>user, true);

    res
      .set({ "x-auth-token": accessToken, "x-refresh-token": refreshToken })
      .json();
  }
);

export default router;
