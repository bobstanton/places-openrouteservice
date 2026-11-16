import { type IPlaceExtensionSettings } from "places-shared/settings";
import { executeRateLimited, formatProviderApiError, tryParseProviderErrorJson } from "places-shared/services";
import { loggedRequestUrl as requestUrl } from "places-shared/utils";
import { DEFAULT_ORS_BASE_URL } from "./main";
import { orsRateLimits } from "./OrsRateLimits";

export class OrsClient {
  constructor(private readonly settings: IPlaceExtensionSettings) {}

  async postJson(operation: string, path: string, body: unknown, requestSummary?: string): Promise<unknown> {
    const baseUrl = (this.settings.baseUrl || DEFAULT_ORS_BASE_URL).replace(/\/$/, "");
    const response = await executeRateLimited(orsRateLimits, operation, () => requestUrl({
      url: `${baseUrl}${path}`,
      method: "POST",
      contentType: "application/json",
      headers: { Authorization: this.settings.apiKey ?? "" },
      body: JSON.stringify(body),
      throw: false,
    }));

    if (response.status >= 400) {
      throw new Error(formatProviderApiError({
        provider: "openrouteservice",
        operation,
        status: response.status,
        json: tryParseProviderErrorJson(response.text),
        text: response.text,
        requestSummary,
      }));
    }

    return response.json;
  }
}
