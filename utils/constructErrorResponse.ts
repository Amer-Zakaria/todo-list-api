import Config from "config";

export default function constructErrorResponse(err: Error, additions: object) {
  return {
    ...additions,
    ...(<boolean>Config.get("stack") && { stack: err.stack }),
  };
}
