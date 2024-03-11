import { isErrorWithStack } from "..";

export default function constructErrorResponse(err: Error, additions: object) {
  return {
    ...additions,
    ...(isErrorWithStack && { stack: err.stack }),
  };
}
