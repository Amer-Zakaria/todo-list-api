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
import Config from "config";
import jwt from "jsonwebtoken";
import getGoogleOAuthTokens from "../utils/getGoogleOAuthTokens";
import constructErrorResponse from "../utils/constructErrorResponse";

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
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        validation: {
          email: `The email you provided "${user.email}" is not unique`,
        },
      })
    );

  //Generate the token
  const accessToken = generateAuthToken(<IUserWithVerification>createdUser);

  res
    .status(201)
    .header("x-auth-token", accessToken)
    .json(viewUser(<IUserWithVerification>createdUser));

  try {
    await transporter.sendMail({
      from: Config.get("mailer.email"),
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

    //This also prevent users who signed-in using Google OAuth from accessing this route
    if (user.emailVerification.isVerified)
      return res
        .status(400)
        .json(
          constructErrorResponse(new Error(), {
            message: "Email is already verified.",
          })
        );

    //conditions
    const doesMatch = req.body.code === user.emailVerification.code;
    const doesExceedExpirationDate =
      Date.parse(user?.emailVerification.expiresAt.toString()) - Date.now() <=
      0;

    //handle invalid cases
    if (doesExceedExpirationDate)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          code: "The verification code is expired. Please, generate a new one.",
        })
      );
    if (!doesMatch)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          validation: { code: "The verification code is incorrect." },
        })
      );

    //change is valide
    await prisma.emailVerification.update({
      where: { id: user.emailVerification.id },
      data: { isVerified: true },
    });

    //resonse with new JWT
    const accessToken = generateAuthToken({
      ...user,
      emailVerification: { ...user.emailVerification, isVerified: true },
    });

    res.header("x-auth-token", accessToken).json();
  }
);

router.post("/regenerate-code", authz, async (req, res) => {
  const emailVerification = await prisma.emailVerification.findUnique({
    where: { userId: res.locals.user.id },
  });

  //This also prevent users who signed-in using Google OAuth from accessing this route
  if (emailVerification?.isVerified)
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        message: "Email is already verified.",
      })
    );

  const code = generateRandomCode();
  await prisma.emailVerification.update({
    where: { userId: res.locals.user.id },
    data: { code, expiresAt: expiresAt() },
  });

  await transporter.sendMail({
    from: Config.get("mailer.email"),
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

router.get("/oauth/google", async (req, res) => {
  // get the code from qs
  const code = req.query.code as string;

  try {
    // get the id and access token with the code
    const { id_token } = await getGoogleOAuthTokens({ code });

    // get user with tokens
    // I'm getting the token from google, so I gurntee that It have been signed by Google, I can decode immediatly
    const {
      email,
      name,
      verified_email: isVerifedGoogleEmail,
    } = jwt.decode(id_token) as jwt.JwtPayload;

    if (isVerifedGoogleEmail) {
      return res.status(403).send(
        constructErrorResponse(new Error(), {
          message: "Google account is not verified",
        })
      );
    }

    // upsert the user
    const result = await prisma.user.upsert({
      where: {
        email, //insert if it doesn't exist
      } /* the client maybe logged through the Todo-list app mechanism so the client info will be updated,
      but the cilent still have his password and he can sign-in the way he likes
    */,
      update: {
        name,
        emailVerification: { update: { isVerified: true } }, //weather the client logged in through the app or Google, his email now verified
      },
      create: {
        name,
        email,
        emailVerification: {
          create: { isVerified: true, expiresAt: new Date(), code: "" },
        },
      }, //weather the client logged in through the app or Google, his email now verified
      include: { emailVerification: true },
    });

    //Generate token
    const accessToken = generateAuthToken(<IUserWithVerification>result);

    // redirect back to client
    res.redirect(`${Config.get("origin")}?token=${accessToken}`);
  } catch (error: any) {
    logger.error(error);
    res.redirect(`${Config.get("origin")}/google-error`);
  }
});

export default router;
