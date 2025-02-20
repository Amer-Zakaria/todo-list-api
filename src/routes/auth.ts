import express from "express";
import validateReq from "../middleware/validateReq";
import { validateUserCredentials } from "../schemas/user";
import prisma from "../client";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import constructErrorResponse from "../utils/constructErrorResponse";
import Config from "config";
import jwt from "jsonwebtoken";
import IViewUser from "../interfaces/IViewUser";

const router = express.Router();

router.post(
  "/",
  validateReq(validateUserCredentials, "body"),
  async (req, res) => {
    const userCredentials = req.body;

    //fetching the user
    const user = await prisma.user.findUnique({
      where: { email: userCredentials.email },
      include: { emailVerification: true },
    });

    //validating the email
    if (!user) {
      res.status(400).json(
        constructErrorResponse(new Error(), {
          message: "Incorrect Email or Password.",
        })
      );
      return;
    }
    if (!user.password)
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          message: "This is a Google account, please continue with Google.",
        })
      );
    //validating the password
    const isValidePassword = await bcrypt.compare(
      userCredentials.password,
      user.password
    );
    if (!isValidePassword) {
      res.status(400).json(
        constructErrorResponse(new Error(), {
          message: "Incorrect Email or Password.",
        })
      );
      return;
    }

    //send token
    const accessToken = await generateToken(<IUserWithVerification>user);
    const refreshToken = await generateToken(<IUserWithVerification>user, true);
    res
      .set({
        "x-auth-token": accessToken,
        "x-refresh-token": refreshToken,
      })
      .json(accessToken);
  }
);

router.post("/token", async (req, res) => {
  const sentRefreshToken = req.headers["x-refresh-token"] as string;

  if (!sentRefreshToken) return res.sendStatus(401);

  //check if the refreshToken is not included in the database
  const refreshTokenObject = await prisma.refreshToken.findUnique({
    where: { token: sentRefreshToken },
  });
  const refreshToken = refreshTokenObject?.token;
  if (!refreshToken) return res.sendStatus(403);

  try {
    const decoded = jwt.verify(
      refreshToken,
      Config.get("refreshJwtPrivateKey")
    ) as IViewUser;
    const userId = decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { emailVerification: true },
    });

    const accessToken = await generateToken(<IUserWithVerification>user);
    res.header("x-auth-token", accessToken).json(accessToken);
  } catch (err) {
    return res.sendStatus(403);
  }
});

router.delete("/logout", async (req, res) => {
  const sentRefreshToken = req.headers["x-refresh-token"] as string;

  if (!sentRefreshToken) return res.sendStatus(401);

  await prisma.refreshToken
    .delete({
      where: { token: sentRefreshToken.trim() },
    })
    .catch((err) => {
      if (err.code === "P2025") return; //if refreshToken doesn't exists
      throw err;
    });

  res.sendStatus(204);
});

export default router;
