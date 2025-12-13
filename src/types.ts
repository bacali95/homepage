import type { AppGetPayload } from "../generated/client/models";

export type App = AppGetPayload<{
  include: {
    versionPreferences: true;
    pingPreferences: true;
    appNotificationPreferences: true;
  };
}>;
