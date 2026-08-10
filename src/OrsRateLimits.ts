import { ProviderRateLimitTracker } from "places-shared/services";

// openrouteservice enforces quotas per endpoint, and each endpoint gets its own
// bucket. Shared by all ORS services in this plugin.
export const orsRateLimits = new ProviderRateLimitTracker();
