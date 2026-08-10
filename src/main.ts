import { App, Plugin } from "obsidian";
import { IPlaceExtensionSettings, IPlacesExtensionHostSettings } from "places-shared/settings";
import { IPlacePluginExtension, IPlacePluginExtensionExports, registerPlaceExtensionLifecycle, settingsOnlyExports, PLACES_EXTENSION_API_VERSION, type ExtensionSettingsGroup } from "places-shared/services";
import { scalarToString, Utilities , configureRequestLogging } from "places-shared/utils";
import { apiKeySettingItem, countrySettingItem } from "places-shared/ui";
import { OrsApiService } from "./OrsApiService";
import { PROVIDER_ICON } from "./provider-icon";
import { OrsElevationService } from "./OrsElevationService";
import { OrsRouteOverlayService } from "./OrsRouteOverlayService";
import { OrsSnapService } from "./OrsSnapService";

export const DEFAULT_ORS_BASE_URL = "https://api.openrouteservice.org";

const DEFAULT_SETTINGS: IPlaceExtensionSettings = {
  baseUrl: DEFAULT_ORS_BASE_URL
};

export default class OpenRouteServicePlugin extends Plugin implements IPlacePluginExtension {

  onload() {
    registerPlaceExtensionLifecycle(this);
  }

  getPlaceExports(_app: App, extensionSettings: IPlaceExtensionSettings, mainSettings: IPlacesExtensionHostSettings): IPlacePluginExtensionExports {
    configureRequestLogging(mainSettings.developerMode);
    Utilities.applyDefaults(extensionSettings, DEFAULT_SETTINGS);

    if (!extensionSettings.apiKey) {
      return settingsOnlyExports(this.settingsGroup(extensionSettings));
    }

    return {
      apiVersion: PLACES_EXTENSION_API_VERSION,
      providers: [
        {
          name: "openrouteservice",
          geocoding: {
            service: new OrsApiService(extensionSettings),
            icon: PROVIDER_ICON
          },
          elevation: new OrsElevationService(extensionSettings),
          routeOverlay: new OrsRouteOverlayService(extensionSettings),
          snap: new OrsSnapService(extensionSettings)
        }
      ],
      settingsGroup: this.settingsGroup(extensionSettings)
    };
  }

  private settingsGroup(settings: IPlaceExtensionSettings): ExtensionSettingsGroup {
    return {
      heading: "openrouteservice",
      items: [
        apiKeySettingItem("openrouteservice", "API key from openrouteservice.org (free tier available)"),
        {
          name: "Base URL",
          desc: `API endpoint. Change this to use a self-hosted openrouteservice instance. Default: ${DEFAULT_ORS_BASE_URL}`,
          control: { type: "text", key: "baseUrl", defaultValue: DEFAULT_ORS_BASE_URL },
        },
        countrySettingItem(),
      ],
      setValue: (key, value) => {
        // Fall back to the public instance on a cleared base URL.
        const text = scalarToString(value);
        settings[key] = key === "baseUrl" ? text || DEFAULT_ORS_BASE_URL : text;
      },
    };
  }
}
