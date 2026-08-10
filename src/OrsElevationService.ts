import { loggedRequestUrl as requestUrl } from "places-shared/utils";
import { Coordinate } from "places-shared/geo";
import { IPlaceExtensionSettings } from "places-shared/settings";
import { LonLatElevationTupleServiceBase, executeRateLimited, formatProviderApiError } from "places-shared/services";
import { DEFAULT_ORS_BASE_URL } from "./main";
import { orsRateLimits } from "./OrsRateLimits";

export class OrsElevationService extends LonLatElevationTupleServiceBase {
  constructor(extensionSettings: IPlaceExtensionSettings) {
    super(extensionSettings);
  }

  protected getBatchSize(): number {
    return 2000;
  }

  protected async fetchLonLatElevationTuples(coordinates: Coordinate[]): Promise<unknown> {
    const baseUrl = (this.extensionSettings.baseUrl || DEFAULT_ORS_BASE_URL).replace(/\/$/, "");

    const response = await executeRateLimited(orsRateLimits, "elevation", () => requestUrl({
      url: `${baseUrl}/elevation/line`,
      method: "POST",
      contentType: "application/json",
      headers: { Authorization: this.extensionSettings.apiKey ?? "" },
      body: JSON.stringify({
        format_in: "polyline",
        format_out: "geojson",
        geometry: coordinates.map((coord) => [coord.longitude, coord.latitude]),
      }),
      throw: false,
    }));

    if (response.status >= 400) {
      throw new Error(formatProviderApiError({
        provider: "openrouteservice",
        operation: "elevation",
        status: response.status,
        json: response.json,
        text: response.text,
      }));
    }

    return (response.json as { geometry?: { coordinates?: unknown } }).geometry?.coordinates;
  }

  getProviderName(): string {
    return "openrouteservice";
  }

  protected getProviderDisplayName(): string {
    return "openrouteservice";
  }
}
