import { App, Plugin } from "obsidian";
import { IPlaceExtensionSettings, IPlacesExtensionHostSettings } from "places-shared/settings";
import { IPlacePluginExtension, IPlacePluginExtensionExports, registerPlaceExtensionLifecycle, settingsOnlyExports, PLACES_EXTENSION_API_VERSION, type ExtensionSettingsGroup } from "places-shared/obsidian/services";
import { scalarToString, Utilities, configureRequestLogging } from "places-shared/utils";
import { apiKeySettingItem, countrySettingItem, settingsPageStatus } from "places-shared/obsidian/ui";
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
      ...settingsPageStatus(() => Boolean(settings.apiKey?.trim())),
      reloadOn: ["apiKey"],
      items: [
        apiKeySettingItem("openrouteservice", "API key from openrouteservice.org (free tier available)"),
        {
          name: "Base URL",
          desc: "openrouteservice API endpoint. Change it to use a self-hosted service.",
          control: { type: "text", key: "baseUrl", defaultValue: DEFAULT_ORS_BASE_URL },
        },
        countrySettingItem(),
      ],
      setValue: (key, value) => {
        const text = scalarToString(value);

        settings[key] = key === "baseUrl" ? text || DEFAULT_ORS_BASE_URL : text;
      },
    };
  }
}
