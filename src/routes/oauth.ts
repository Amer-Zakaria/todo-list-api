import { logger } from "../index";
import getGoogleOAuthTokens from "../utils/getGoogleOAuthTokens";
import express from "express";
import jwt from "jsonwebtoken";
import Config from "config";
import prisma from "../client";
import generateToken from "../utils/generateToken";
import IUserWithVerification from "../interfaces/IUserWithVerification";

const router = express.Router();

router.get("/google", async (req, res) => {
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
      email_verified: isVerifedGoogleEmail,
    } = jwt.decode(id_token) as jwt.JwtPayload;

    if (!isVerifedGoogleEmail) {
      return res.redirect(
        `${Config.get("origin")}/${Config.get(
          "google.errorPathName"
        )}?message=Your Google account is not verified`
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
    res.redirect(
      `${Config.get("origin")}/${Config.get(
        "google.errorPathName"
      )}?message=Something went wrong while trying to log you in with Google`
    );
  }
});

export default router;
