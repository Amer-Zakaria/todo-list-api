import IUserWithVerification from "../../../interfaces/IUserWithVerification";
import viewUser from "../../../utils/viewUser";

describe("generateAuthToken", () => {
  it("Should return just allowed user properties to view", () => {
    const user: IUserWithVerification = {
      id: 1,
      name: "a",
      email: "a",
      password: "",
      emailVerification: {
        id: 1,
        isVerified: true,
        code: "",
        expiresAt: new Date(),
        userId: 1,
      },
    };

    const result = viewUser(user);

    expect(result).toEqual({
      id: 1,
      name: "a",
      email: "a",
      emailVerification: { isVerified: true },
    });
  });
});
