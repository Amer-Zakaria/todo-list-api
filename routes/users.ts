import express, { Request, Response } from "express";
import prisma from "./../prisma/client";
import validateReq from "../middleware/validateReq";
import validateUser, { expiresAt, validateVerifyEmail } from "../schemas/user";
import bcrypt from "bcrypt";
import generateAuthToken from "../utils/generateAuthToken";
import generateRandomCode from "../utils/GenerateRandomCode";
import { logger, transporter } from "..";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import viewUser from "../utils/viewUser";
import authz from "./../middleware/authz";

const router = express.Router();

router.post("/", validateReq(validateUser, "body"), async (req, res) => {
  const user = req.body;

  //Hashing the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(user.password, salt);
  user.password = hashedPassword;

  //Creating the user & catching the error if the email is not unique
  let isEmailUnique = true;
  const code = generateRandomCode();
  const createdUser = await prisma.user
    .create({
      data: {
        emailVerification: {
          create: {
            //it runs as a transaction alongside the creation of the user
            code,
            expiresAt: expiresAt(), //after two hours from now
          },
        },
        ...req.body,
      },
      include: {
        emailVerification: true,
      },
    })
    .catch((err) => {
      if (err.code === "P2002") isEmailUnique = false;
      else throw err;
    });
  if (!isEmailUnique)
    return res
      .status(400)
      .json({ email: `The email you provided "${user.email}" is not unique` });

  //Generate the token
  const token = generateAuthToken(<IUserWithVerification>createdUser);

  res
    .header("x-auth-token", token)
    .status(201)
    .json(viewUser(<IUserWithVerification>createdUser));

  try {
    await transporter.sendMail({
      from: "amerzkfe1234@gmail.com",
      to: req.body.email,
      subject: "Email Verification",
      html: `
        <p>
          Thank you for choosing our service.
          <br />
          Your verification code is: <strong>${code}</strong>.
          <br />
          Note: it's only valid for 2 hours.
        </p>`,
    });
  } catch (err) {
    logger.error(err);
  }
});

router.post(
  "/verify-email",
  [authz, validateReq(validateVerifyEmail, "body")],
  async (req: Request, res: Response) => {
    //get the user
    const user = await prisma.user.findUnique({
      where: { email: res.locals.user.email },
      include: { emailVerification: true },
    });

    if (!user || !user.emailVerification) throw new Error();

    if (user.emailVerification.isVerified)
      return res.status(400).json({ message: "Email is already verified." });

    //conditions
    const doesMatch = req.body.code === user.emailVerification.code;
    const doesExceedExpirationDate =
      Date.parse(user?.emailVerification.expiresAt.toString()) - Date.now() <=
      0;

    //handle invalid cases
    if (doesExceedExpirationDate)
      return res.status(400).json({
        code: "The verification code is expired. Please, generate a new one.",
      });
    if (!doesMatch)
      return res
        .status(400)
        .json({ code: "The verification code is incorrect." });

    //change is valide
    await prisma.emailVerification.update({
      where: { id: user.emailVerification.id },
      data: { isVerified: true },
    });

    //resonse with new JWT
    const jwt = generateAuthToken({
      ...user,
      emailVerification: { ...user.emailVerification, isVerified: true },
    });
    res.header("x-auth-token", jwt).json();
  }
);

router.post("/regenerate-code", authz, async (req, res) => {
  const emailVerification = await prisma.emailVerification.findUnique({
    where: { userId: res.locals.user.id },
  });

  if (emailVerification?.isVerified)
    return res.status(400).json({ message: "Email is already verified." });

  const code = generateRandomCode();
  await prisma.emailVerification.update({
    where: { userId: res.locals.user.id },
    data: { code, expiresAt: expiresAt() },
  });

  await transporter.sendMail({
    from: "amerzkfe1234@gmail.com",
    to: res.locals.user.email,
    subject: "Email Verification",
    html: `
        <p>
          Thank you for choosing our service.
          <br />
          Your verification code is: <strong>${code}</strong>.
          <br />
          Note: it's only valid for 2 hours.
        </p>`,
  });

  res.json();
});

export default router;
