import Config from "config";
import axios from "axios";
import QueryString from "qs";
import IGoogleTokensResult from "../interfaces/IGoogleTokensResult";

export default async function getGoogleOAuthTokens({
  code,
}: {
  code: string;
}): Promise<IGoogleTokensResult> {
  const url = "https://oauth2.googleapis.com/token";

  const values = {
    code,
    client_id: Config.get("google.clientId"),
    client_secret: Config.get("google.clientSecret"),
    redirect_uri: Config.get("google.redirectUri"),
    grant_type: "authorization_code",
  };

  try {
    const res = await axios.post<IGoogleTokensResult>(
      url,
      QueryString.stringify(values),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.data;
  } catch (e: any) {
    const isExpectedError = e.response.status >= 400 && e.response.status < 500;
    e.isExpectedError = isExpectedError;
    throw e;
  }
}
