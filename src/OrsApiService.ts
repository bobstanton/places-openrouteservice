import { loggedRequestUrl as requestUrl } from "places-shared/utils";
import { Place } from "places-shared/place";
import { Coordinate, PlacesBoundingBox } from "places-shared/geo";
import { IPlaceExtensionSettings } from "places-shared/settings";
import { IPlacesService, executeRateLimited, lookupPlaceWithNearOrInQuery, type PeliasFeature, peliasFeatureBounds, peliasFeatureToPlace } from "places-shared/services";
import { logger } from "places-shared/utils";
import { DEFAULT_ORS_BASE_URL } from "./main";
import { orsRateLimits } from "./OrsRateLimits";

const ATTRIBUTION = "© openrouteservice.org by HeiGIT | OpenStreetMap contributors";

export class OrsApiService implements IPlacesService {
  extensionSettings: IPlaceExtensionSettings;

  constructor(extensionSettings: IPlaceExtensionSettings) {
    this.extensionSettings = extensionSettings;
  }

  async lookupPlace(query: string): Promise<Place[]> {
    return lookupPlaceWithNearOrInQuery(query, {
      search: (searchText, proximity) => this.executeSearch(searchText, proximity),
      geocodeLocation: async (location) => {
        const bounds = await this.geocodeLocationBounds(location);

        return bounds ? { bounds } : null;
      },
      searchInBounds: (searchText, bounds) => this.lookupPlaceInBounds(searchText, bounds),
      filterBoundedResults: true,
    });
  }

  async lookupPlaceInBounds(query: string, bounds: PlacesBoundingBox): Promise<Place[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const features = await this.geocode("/geocode/search", {
        text: query.trim(),
        size: "10",
        layers: "venue,address",
        "boundary.rect.min_lat": String(bounds.minLat),
        "boundary.rect.min_lon": String(bounds.minLng),
        "boundary.rect.max_lat": String(bounds.maxLat),
        "boundary.rect.max_lon": String(bounds.maxLng),
      });

      return features.map((feature) => this.convertToPlace(feature)).filter((p): p is Place => p !== null);
    } catch (error) {
      logger.scope("Places").error("[openrouteservice] lookupPlaceInBounds error:", error);

      throw error;
    }
  }

  async lookupPlaceByCoordinates(coordinate: Coordinate): Promise<Place[]> {
    try {
      const features = await this.geocode("/geocode/reverse", {
        "point.lat": String(coordinate.latitude),
        "point.lon": String(coordinate.longitude),
        size: "5",
      });

      return features.map((feature) => this.convertToPlace(feature)).filter((p): p is Place => p !== null);
    } catch (error) {
      logger.scope("Places").error("[openrouteservice] reverse geocode error:", error);

      throw error;
    }
  }

  private async geocodeLocationBounds(location: string): Promise<PlacesBoundingBox | null> {
    const features = await this.geocode("/geocode/search", {
      text: location,
      size: "1",
      ...(this.extensionSettings.country ? { "boundary.country": this.extensionSettings.country.toUpperCase() } : {}),
    });

    const feature = features[0];

    if (!feature) return null;

    return peliasFeatureBounds(feature);
  }

  private async executeSearch(searchText: string, proximityBias?: { longitude: number; latitude: number }): Promise<Place[]> {
    const features = await this.geocode("/geocode/search", {
      text: searchText,
      size: "10",
      layers: "venue,address",
      ...(this.extensionSettings.country ? { "boundary.country": this.extensionSettings.country.toUpperCase() } : {}),
      ...(proximityBias ? { "focus.point.lat": String(proximityBias.latitude), "focus.point.lon": String(proximityBias.longitude) } : {}),
    });

    return features.map((feature) => this.convertToPlace(feature)).filter((p): p is Place => p !== null);
  }

  private async geocode(path: string, params: Record<string, string>): Promise<PeliasFeature[]> {
    const baseUrl = (this.extensionSettings.baseUrl || DEFAULT_ORS_BASE_URL).replace(/\/$/, "");
    const query = encodeQueryParams(params);

    const response = await executeRateLimited(orsRateLimits, "geocoding", () => requestUrl({
      url: `${baseUrl}${path}?${query}`,
      headers: { Authorization: this.extensionSettings.apiKey ?? "" },
      throw: false,
    }));

    if (response.status >= 400) {
      throw new Error(`openrouteservice geocoding error ${response.status}: ${response.text}`);
    }

    const features = (response.json as { features?: PeliasFeature[] }).features;

    return Array.isArray(features) ? features : [];
  }

  private convertToPlace(feature: PeliasFeature): Place | null {
    return peliasFeatureToPlace(feature, {
      source: "openrouteservice",
      attribution: ATTRIBUTION,
    });
  }
}

function encodeQueryParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}
