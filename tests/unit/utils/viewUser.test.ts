import IUserWithVerification from "../../../src/interfaces/IUserWithVerification";
import viewUser from "../../../src/utils/viewUser";
import { describe, expect, it } from "@jest/globals";

describe("viewUser", () => {
  it("Should return just allowed user properties to view", () => {
    const user: IUserWithVerification = {
      id: 1,
      name: "a",
      email: "a",
      password: "",
      emailVerification: {
        id: 1,
        isVerified: true,
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
