import express, { Request, Response } from "express";
import prisma from "../client";
import validateReq from "../middleware/validateReq";
import validateUser from "../schemas/user";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken";
import { logger } from "../index";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import viewUser from "../utils/viewUser";
import authz from "../middleware/authz";
import Config from "config";
import jwt from "jsonwebtoken";
import getGoogleOAuthTokens from "../utils/getGoogleOAuthTokens";
import constructErrorResponse from "../utils/constructErrorResponse";
import sendEmailVerificationLink from "../utils/sendEmailVerificationLink";
import Joi from "joi";

const router = express.Router();

router.post("/", validateReq(validateUser, "body"), async (req, res) => {
  const user = req.body;

  //Hashing the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(user.password, salt);
  user.password = hashedPassword;

  //Creating the user & catching the error if the email is not unique
  let isEmailUnique = true;
  const createdUser = (await prisma.user
    .create({
      data: {
        emailVerification: {
          create: {
            //it runs as a transaction alongside the creation of the user
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
    })) as IUserWithVerification;
  if (!isEmailUnique)
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        validation: {
          email: `The email you provided "${user.email}" is not unique`,
        },
      })
    );

  //Generate the token
  const accessToken = await generateToken(createdUser);
  const refreshToken = await generateToken(createdUser, true);

  res
    .status(201)
    .set({
      "x-auth-token": accessToken,
      "x-refresh-token": refreshToken,
    })
    .json(viewUser(createdUser));

  // Send an email that contain the email verification link
  sendEmailVerificationLink(createdUser);
});

router.post("/regenerate-link", authz, async (req, res) => {
  const user = (await prisma.user.findUnique({
    where: { id: res.locals.user.id },
    include: { emailVerification: true },
  })) as IUserWithVerification;

  //This also prevent users who signed-in using Google OAuth from accessing this route (gmail email is guaranteed to be verified 'cause I checked it)
  if (user?.emailVerification?.isVerified)
    return res.status(400).json(
      constructErrorResponse(new Error(), {
        message: "Email is already verified.",
      })
    );

  sendEmailVerificationLink(user);

  res.json();
});

router.get("/verify-email", async (req: Request, res: Response) => {
  const emailVerificationToken = req.query.emailVerificationToken as string;

  // Validated the token is it a non-zero length string?
  if (Joi.string().required().validate(emailVerificationToken).error)
    return res.redirect(
      `${Config.get("origin")}/${Config.get(
        "emailVerification.errorPathName"
      )}?message=Invalid link!`
    );

  let userId: number;
  try {
    // Verify the token
    const decoded = jwt.verify(
      emailVerificationToken,
      Config.get("emailVerification.jwtPrivateKey")
    );
    userId = (decoded as { userId: number }).userId;
  } catch (err) {
    return res.redirect(
      `${Config.get("origin")}/${Config.get(
        "emailVerification.errorPathName"
      )}?message=Invalid link!`
    );
  }

  const user = (await prisma.user.findUnique({
    where: { id: userId },
    include: { emailVerification: true },
  })) as IUserWithVerification;

  // verify that the user exist
  if (!user)
    return res.redirect(
      `${Config.get("origin")}/${Config.get(
        "emailVerification.errorPathName"
      )}?message=Invalid link!`
    );

  // verify that the user is not verified
  if (user.emailVerification.isVerified)
    return res.redirect(
      `${Config.get("origin")}/${Config.get(
        "emailVerification.errorPathName"
      )}?message=Email is already verified!`
    );

  // reset the emailVerification
  await prisma.emailVerification.update({
    where: { id: user.emailVerification.id },
    data: { isVerified: true },
  });

  // redirect the user with new access/refresh tokens
  const updatedUser = {
    ...user,
    emailVerification: { isVerified: true },
  } as IUserWithVerification;
  const accessToken = await generateToken(updatedUser);
  const refreshToken = await generateToken(updatedUser, true);
  res.redirect(
    `${Config.get(
      "origin"
    )}?accessToken=${accessToken}&refreshToken=${refreshToken}`
  );
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
          create: { isVerified: true },
        },
      }, //weather the client logged in through the app or Google, his email now verified
      include: { emailVerification: true },
    });

    //Generate token
    const accessToken = await generateToken(<IUserWithVerification>result);
    const refreshToken = await generateToken(
      <IUserWithVerification>result,
      true
    );

    // redirect back to client
    res.redirect(
      `${Config.get(
        "origin"
      )}?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error: any) {
    logger.error(error);
    res.redirect(`${Config.get("origin")}/google-error`);
  }
});

export default router;
