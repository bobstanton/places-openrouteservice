import { IPlaceExtensionSettings } from "places-shared/settings";
import { OrsCompatibleRoutingProfile, OrsCompatibleSnapServiceBase } from "places-shared/services";
import { OrsClient } from "./OrsClient";

export class OrsSnapService extends OrsCompatibleSnapServiceBase {
  private readonly client: OrsClient;

  constructor(extensionSettings: IPlaceExtensionSettings) {
    super(extensionSettings);
    this.client = new OrsClient(extensionSettings);
  }

  getProviderName(): string {
    return "openrouteservice";
  }

  protected getSnapPath(profile: OrsCompatibleRoutingProfile): string {
    return `/v2/snap/${profile}`;
  }

  protected async callOrsCompatibleJson(operation: string, path: string, body: unknown, requestSummary?: string): Promise<unknown> {
    return this.client.postJson(operation, path, body, requestSummary);
  }
}
