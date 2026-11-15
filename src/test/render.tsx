import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { ThemeProvider } from "@/components/ThemeProvider";
import type { App } from "@/types";

export function renderApp(ui: ReactElement, route = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function makeApp(overrides: Partial<App> & { id: number }): App {
  return {
    name: `App ${overrides.id}`,
    category: "Media",
    url: `https://app-${overrides.id}.example.com`,
    icon: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    versionPreferences: null,
    pingPreferences: null,
    appNotificationPreferences: [],
    ...overrides,
  } as App;
}

export const versionPrefs = (
  overrides: Partial<NonNullable<App["versionPreferences"]>> = {}
): NonNullable<App["versionPreferences"]> => ({
  appId: 0,
  enabled: true,
  sourceType: "GITHUB_RELEASES",
  sourceRepo: "owner/repo",
  runningEnvironment: "KUBERNETES",
  runningConfig: JSON.stringify({
    dockerImage: "owner/repo",
    k8sNamespace: "media",
  }),
  currentVersion: "1.0.0",
  latestVersion: null,
  hasUpdate: false,
  versionExtractionRegex: null,
  ...overrides,
});

export const pingPrefs = (): NonNullable<App["pingPreferences"]> => ({
  appId: 0,
  enabled: true,
  url: "https://example.com",
  frequency: 5,
  ignoreSsl: false,
});
