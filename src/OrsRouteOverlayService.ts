import { type IPlaceExtensionSettings } from "places-shared/settings";
import { type OrsCompatibleRoutingProfile, OrsCompatibleRouteOverlayServiceBase } from "places-shared/services";
import { OrsClient } from "./OrsClient";

export class OrsRouteOverlayService extends OrsCompatibleRouteOverlayServiceBase {
  private readonly client: OrsClient;

  constructor(extensionSettings: IPlaceExtensionSettings) {
    super(extensionSettings);
    this.client = new OrsClient(extensionSettings);
  }

  getProviderName(): string {
    return "openrouteservice";
  }

  protected getDirectionsPath(profile: OrsCompatibleRoutingProfile): string {
    return `/v2/directions/${profile}/geojson`;
  }

  protected getIsochronePath(profile: OrsCompatibleRoutingProfile): string {
    return `/v2/isochrones/${profile}`;
  }

  protected supportsRouteOptimization(): boolean {
    return true;
  }

  protected async callOrsCompatibleJson(operation: string, path: string, body: unknown, requestSummary?: string): Promise<unknown> {
    return this.client.postJson(operation, path, body, requestSummary);
  }
}
