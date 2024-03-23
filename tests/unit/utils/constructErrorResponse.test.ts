import Config from "config";
import constructErrorResponse from "../../../utils/constructErrorResponse";

jest.mock("config", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockReturnValue(false), //is error with stack
  },
}));

describe("constructErrorREsponse", () => {
  const result = constructErrorResponse(new Error(), { message: "a" });

  it("Should return the errors provided", () => {
    expect(result).toMatchObject({ message: "a" });
  });

  it("Shouldn't return the stack if it's allowed", () => {
    expect(result).not.toHaveProperty("stack");
  });

  it("Should return the stack if it's allowed", () => {
    Config.get = jest.fn().mockReturnValue(true);

    const result = constructErrorResponse(new Error(), { message: "a" });

    expect(result).toMatchObject({ message: "a" });
    expect(result).toHaveProperty("stack");
  });
});
