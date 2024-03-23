import jwt from "jsonwebtoken";
import Config from "config";
import generateAuthToken from "./../../../utils/generateAuthToken";
import IUserWithVerification from "./../../../interfaces/IUserWithVerification";
import viewUser from "../../../utils/viewUser";

const user: IUserWithVerification = {
  id: 1,
  name: "a",
  email: "a",
  password: "",
  emailVerification: {
    id: 1,
    isVerified: true,
    expiresAt: new Date(),
    code: "",
    userId: 1,
  },
};
jest.mock("../../../utils/viewUser", () => ({
  __esModule: true,
  default: () => ({
    id: 1,
    name: "a",
    email: "a",
    emailVerification: {
      isVerified: true,
    },
  }),
}));
jest.mock("config", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));
jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    sign: jest.fn().mockReturnValue("a"),
  },
}));

describe("generateAuthToken", () => {
  beforeEach(() => {
    const configGetMock = jest.spyOn(Config, "get");
    configGetMock.mockReturnValueOnce("secretKey");
    configGetMock.mockReturnValueOnce(3600); // 1 hour
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("JWT sign should be called", () => {
    const configGetMock = jest.spyOn(Config, "get");
    configGetMock.mockReturnValueOnce("secretKey");
    configGetMock.mockReturnValueOnce(3600); // 1 hour

    generateAuthToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(viewUser(user), "secretKey", {
      expiresIn: 3600,
    });
  });

  it("Should return the access token", () => {
    const accessToken = generateAuthToken(user);

    expect(accessToken).toBe("a");
  });
});
