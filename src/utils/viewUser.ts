import IUserWithVerification from "../interfaces/IUserWithVerification";

export default ({
  id,
  name,
  email,
  emailVerification: { isVerified },
}: IUserWithVerification) => ({
  id,
  name,
  email,
  emailVerification: { isVerified },
});
