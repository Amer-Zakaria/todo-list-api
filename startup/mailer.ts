import nodemailer from "nodemailer";
import Config from "config";

module.exports = () =>
  nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "amerzkfe1234@gmail.com",
      pass: Config.get("emailPass"),
    },
  });
