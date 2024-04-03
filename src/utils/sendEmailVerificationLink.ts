import jwt from "jsonwebtoken";
import Config from "config";
import { transporter, logger } from "..";
import IUserWithVerification from "../interfaces/IUserWithVerification";

export default function sendEmailVerificationLink(user: IUserWithVerification) {
  const emailVerificationJwt = jwt.sign(
    { userId: user.id },
    Config.get("emailVerificationJwtPrivateKey") as string,
    { expiresIn: Config.get("emailVerificationTokenTtl") as string }
  );
  transporter
    .sendMail({
      from: Config.get("mailer.email"),
      to: user.email,
      subject: "Email Verification",
      html: `
          <p>
            Thank you <strong>${user.name}</strong> for choosing our service.
            <br />
            Your email verification link is: ${Config.get(
              "apiOrigin"
            )}/api/users/verify-email?emailVerificationToken=${emailVerificationJwt}.
            <br />
            Note: it's only valid for ${Config.get(
              "emailVerificationTokenTtl"
            )}.
          </p>`,
    })
    .catch((err) => {
      logger.error(err);
    });
}
