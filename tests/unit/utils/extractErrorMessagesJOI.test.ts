import Joi from "joi";
import extractErrorMessagesJOI from "../../../src/utils/extractErrorMessagesJOI";
import { describe, expect, it } from "@jest/globals";

const err: Joi.ValidationError = {
  details: [
    { path: ["email"], message: "X", type: "string" },
    { path: ["name"], message: "X", type: "string" },
  ],
  _original: "",
  isJoi: true,
  name: "ValidationError",
  message: "",
  annotate: () => "",
};

describe("extractErrorMessagesJOI", () => {
  it("Should return the extracted errors", () => {
    const extractedErrors = extractErrorMessagesJOI(err);

    expect(extractedErrors).toEqual({ email: "X", name: "X" });
  });
});
