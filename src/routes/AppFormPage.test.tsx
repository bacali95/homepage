import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";

import { renderApp } from "../test/render";
import { AppFormPage } from "./AppFormPage";

vi.mock("@/lib/api", async () => ({
  api: (await import("../test/api-mock")).apiMock,
}));

function Location() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderForm(route: string) {
  return renderApp(
    <>
      <Routes>
        <Route path="/" element={<Location />} />
        <Route path="/:app/*" element={<AppFormPage />} />
      </Routes>
    </>,
    route
  );
}

beforeEach(() => {
  vi.mocked(api.app.getAllCategories).mockResolvedValue([
    "Media",
    "Infrastructure",
  ] as never);
  vi.mocked(api.app.create).mockResolvedValue({ id: 9 } as never);
});

describe("AppFormPage", () => {
  it("shows inline errors for required fields and does not submit", async () => {
    const user = userEvent.setup();
    renderForm("/new");

    await user.click(screen.getByRole("button", { name: "Add App" }));

    expect(await screen.findByText("App name is required.")).toBeVisible();
    expect(api.app.create).not.toHaveBeenCalled();
  });

  it("flags a malformed URL inline", async () => {
    const user = userEvent.setup();
    renderForm("/new");

    await user.type(screen.getByLabelText(/^App name/), "Plex");
    await user.type(screen.getByLabelText(/^Category/), "Media");
    await user.type(screen.getByLabelText(/^App URL/), "not a url");
    await user.click(screen.getByRole("button", { name: "Add App" }));

    expect(
      await screen.findByText(/Enter a valid URL, including https/)
    ).toBeVisible();
    expect(api.app.create).not.toHaveBeenCalled();
  });

  it("creates the app and returns to the list", async () => {
    const user = userEvent.setup();
    renderForm("/new");

    await user.type(screen.getByLabelText(/^App name/), "Plex");
    await user.type(screen.getByLabelText(/^Category/), "Media");
    await user.click(screen.getByRole("button", { name: "Add App" }));

    await waitFor(() =>
      expect(api.app.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Plex", category: "Media" })
      )
    );
    expect(await screen.findByLabelText("Current path")).toHaveTextContent("/");
  });

  it("marks unsaved changes once a field is edited", async () => {
    const user = userEvent.setup();
    renderForm("/new");
    await user.type(screen.getByLabelText(/^App name/), "P");
    expect(screen.getByText("You have unsaved changes.")).toBeInTheDocument();
  });

  it("goes back to the list from the save bar", async () => {
    const user = userEvent.setup();
    renderForm("/new");
    await user.click(screen.getByRole("link", { name: "Back to apps" }));
    expect(await screen.findByLabelText("Current path")).toHaveTextContent("/");
  });

  it("marks the current section and switches with the side navigation", async () => {
    const user = userEvent.setup();
    renderForm("/new");
    expect(
      screen.getByRole("link", { name: "Basic information" })
    ).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Notifications" })).toBeNull();

    await user.click(screen.getByRole("link", { name: "Ping monitoring" }));
    expect(
      screen.getByRole("link", { name: "Ping monitoring" })
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Basic information" })
    ).not.toHaveAttribute("aria-current");
  });

  it("toggles ping monitoring with Space and reveals its settings", async () => {
    const user = userEvent.setup();
    renderForm("/new/ping");

    const toggle = screen.getByRole("switch", {
      name: "Enable ping monitoring",
    });
    expect(toggle).not.toBeChecked();
    expect(screen.queryByLabelText(/Ping URL/)).toBeNull();

    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).toBeChecked();
    expect(await screen.findByLabelText(/Ping URL/)).toBeVisible();

    const ignoreSsl = screen.getByRole("switch", {
      name: "Ignore SSL certificate errors",
    });
    ignoreSsl.focus();
    await user.keyboard(" ");
    expect(ignoreSsl).toBeChecked();
  });

  it("toggles version checking with Space and shows the source selector", async () => {
    const user = userEvent.setup();
    renderForm("/new/version");

    const toggle = screen.getByRole("switch", {
      name: "Enable version checking",
    });
    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).toBeChecked();
    expect(
      await screen.findByRole("combobox", { name: /Source type/ })
    ).toHaveTextContent("GitHub Releases");
    expect(screen.getByLabelText(/GitHub releases/)).toBeVisible();
  });
});

describe("agent access", () => {
  it("lets an agent find and fill every basic field", async () => {
    const agent = createAgent();
    renderForm("/new");

    const components = agent
      .snapshot()
      .filter((entry) => !entry.offPage && entry.component !== "more");
    for (const entry of components) {
      expect(
        entry.label,
        `${entry.component} ${entry.ref} has no name`
      ).toBeTruthy();
    }
    const labels = components.map((entry) => entry.label);
    for (const label of ["App name", "Category", "App URL", "Icon URL"]) {
      expect(labels).toContainEqual(expect.stringContaining(label));
    }

    const result = await agent.act({
      steps: [
        { ref: "App name", action: "setValue", args: ["Grafana"] },
        { ref: "Category", action: "setValue", args: ["Infrastructure"] },
        { ref: "App URL", action: "setValue", args: ["https://grafana.lan"] },
      ],
    });
    expect(result.error?.message).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>(/^App name/).value).toBe(
      "Grafana"
    );
    expect(screen.getByLabelText<HTMLInputElement>(/^App URL/).value).toBe(
      "https://grafana.lan"
    );

    await userEvent.click(screen.getByRole("button", { name: "Add App" }));
    await waitFor(() =>
      expect(api.app.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Grafana",
          category: "Infrastructure",
          url: "https://grafana.lan",
        })
      )
    );
  });

  it("lets an agent turn ping monitoring on and set its fields", async () => {
    const agent = createAgent();
    renderForm("/new/ping");

    const toggled = await agent.act({
      steps: [
        { ref: "Enable ping monitoring", action: "setChecked", args: [true] },
      ],
    });
    expect(toggled.error?.message).toBeUndefined();
    expect(toggled.ok).toBe(true);

    const filled = await agent.act({
      steps: [
        {
          ref: "Ping URL",
          action: "setValue",
          args: ["https://grafana.lan/health"],
        },
        { ref: "Ping frequency (minutes)", action: "setValue", args: [15] },
      ],
    });
    expect(filled.error?.message).toBeUndefined();
    expect(filled.ok).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>(/Ping URL/).value).toBe(
      "https://grafana.lan/health"
    );
  });
});
