import { User, EmailVerification } from "@prisma/client";

export default interface IUserWithVerification extends User {
  emailVerification: EmailVerification;
}
