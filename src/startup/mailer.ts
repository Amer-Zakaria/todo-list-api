import nodemailer from "nodemailer";
import Config from "config";

export default () =>
  nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: Config.get("mailer.email"),
      pass: Config.get("mailer.emailPass"),
    },
  });
