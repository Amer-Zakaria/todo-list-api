import { jest } from "@jest/globals";
import Config from "config";
import constructErrorResponse from "../../../src/utils/constructErrorResponse";

describe("constructErrorResponse", () => {
  (Config.get as jest.Mock) = jest.fn().mockReturnValue(false);

  const result = constructErrorResponse(new Error(), { message: "a" });

  it("Should return the errors provided", () => {
    expect(result).toMatchObject({ message: "a" });
  });

  it("Shouldn't return the stack if it's not allowed", () => {
    expect(result).not.toHaveProperty("stack");
  });

  it("Should return the stack if it's allowed", () => {
    (Config.get as jest.Mock) = jest.fn().mockReturnValue(true);

    const result = constructErrorResponse(new Error(), { message: "a" });

    expect(result).toMatchObject({ message: "a" });
    expect(result).toHaveProperty("stack");
  });
});
