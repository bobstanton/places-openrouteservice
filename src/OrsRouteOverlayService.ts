import { type IPlaceExtensionSettings } from "places-shared/settings";
import { type OrsCompatibleRoutingProfile, OrsCompatibleRouteOverlayServiceBase, type RouteWaypoint } from "places-shared/services";
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

  protected async optimizeRoute(route: RouteWaypoint[], profile: OrsCompatibleRoutingProfile): Promise<RouteWaypoint[]> {
    if (route.length <= 2) return route;

    const intermediateWaypoints = route.slice(1, -1);
    const result = await this.callOrsCompatibleJson(
      "optimization",
      "/optimization",
      {
        jobs: intermediateWaypoints.map((point, index) => ({
          id: index + 1,
          location: [point.longitude, point.latitude],
        })),
        vehicles: [{
          id: 1,
          profile,
          start: [route[0].longitude, route[0].latitude],
          end: [route[route.length - 1].longitude, route[route.length - 1].latitude],
        }],
      },
      `${profile}, ${route.length} waypoints`,
    ) as {
      routes?: Array<{ steps?: Array<{ type?: string; job?: number }> }>;
      unassigned?: Array<{ id?: number }>;
    };

    const unassigned = result.unassigned ?? [];
    if (unassigned.length > 0) {
      throw new Error(`openrouteservice optimization could not assign ${unassigned.length} waypoint${unassigned.length === 1 ? "" : "s"}.`);
    }

    const jobIds = (result.routes?.[0]?.steps ?? [])
      .filter((step) => step.type === "job")
      .map((step) => step.job);
    const expectedIds = new Set(intermediateWaypoints.map((_, index) => index + 1));
    if (jobIds.length !== expectedIds.size || jobIds.some((id) => id === undefined || !expectedIds.delete(id)) || expectedIds.size > 0) {
      throw new Error("openrouteservice optimization returned an incomplete or invalid waypoint order.");
    }

    return [
      route[0],
      ...jobIds.map((id) => intermediateWaypoints[id! - 1]),
      route[route.length - 1],
    ];
  }

  protected async callOrsCompatibleJson(operation: string, path: string, body: unknown, requestSummary?: string): Promise<unknown> {
    return this.client.postJson(operation, path, body, requestSummary);
  }
}
