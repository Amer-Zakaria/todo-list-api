import express from "express";
import validateReq from "../middleware/validateReq";
import { validateUserCredentials } from "../schemas/user";
import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import generateAuthToken from "../utils/generateAuthToken";
import IUserWithVerification from "../interfaces/IUserWithVerification";

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
      res.status(400).json({
        message: "Incorrect Email or Password.",
      });
      return;
    }
    if (!user.password)
      return res.status(400).json({
        message: "This is a Google account, please continue with Google.",
      });
    const isValidePassword = await bcrypt.compare(
      userCredentials.password,
      user.password
    );
    if (!isValidePassword) {
      res.status(400).json({
        message: "Incorrect Email or Password.",
      });
      return;
    }

    //send the token
    const accessToken = generateAuthToken(<IUserWithVerification>user);
    res.header("x-auth-token", accessToken).send(accessToken);
  }

  //validating the password
);

export default router;
