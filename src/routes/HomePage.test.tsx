import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";
import { api } from "@/lib/api";

import { makeApp, pingPrefs, renderApp, versionPrefs } from "../test/render";
import { HomePage } from "./HomePage";

vi.mock("@/lib/api", async () => ({
  api: (await import("../test/api-mock")).apiMock,
}));

const plex = makeApp({
  id: 1,
  name: "Plex",
  versionPreferences: versionPrefs({ hasUpdate: true, latestVersion: "1.1.0" }),
  pingPreferences: pingPrefs(),
});
const grafana = makeApp({ id: 2, name: "Grafana", category: "Infra" });

const ping = (status: boolean, responseTime: number | null, id = 1) => ({
  id,
  appId: 1,
  status,
  responseTime,
  statusCode: status ? 200 : null,
  errorMessage: null,
  createdAt: new Date(),
});

beforeEach(() => {
  let apps = [plex, grafana];
  vi.mocked(api.app.getAll).mockImplementation((async () => apps) as never);
  vi.mocked(api.app.getAllCategories).mockResolvedValue([] as never);
  vi.mocked(api.app.getPingHistory).mockResolvedValue([
    [ping(true, 42, 2), ping(false, null, 1)],
    2,
  ] as never);
  vi.mocked(api.app.delete).mockImplementation((async ({
    id,
  }: {
    id: number;
  }) => {
    apps = apps.filter((app) => app.id !== id);
  }) as never);
  vi.mocked(api.app.checkUpdates).mockResolvedValue(undefined as never);
});

describe("HomePage", () => {
  it("groups apps by category and summarises their status", async () => {
    renderApp(<HomePage />);

    const media = await screen.findByRole("region", { name: "Media" });
    expect(within(media).getByText("Plex")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Infra" })).toBeInTheDocument();

    const summary = screen.getByRole("region", { name: "Status summary" });
    await waitFor(() => expect(summary).toHaveTextContent(/Up\s*1/));
    expect(summary).toHaveTextContent(/Apps\s*2/);
    expect(summary).toHaveTextContent(/Updates\s*1/);
    expect(within(media).getByText("update → v1.1.0")).toBeInTheDocument();
    expect(within(media).getByText("42ms")).toBeInTheDocument();
  });

  it("opens an app through a real link, separate from its actions menu", async () => {
    renderApp(<HomePage />);
    const link = await screen.findByRole("link", { name: "Plex" });
    expect(link).toHaveAttribute("href", "https://app-1.example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(
      within(link).queryByRole("button", { name: /Actions for Plex/ })
    ).toBeNull();
  });

  it("shows the empty state with an add action when there are no apps", async () => {
    vi.mocked(api.app.getAll).mockResolvedValue([] as never);
    renderApp(<HomePage />);
    expect(
      await screen.findByRole("button", { name: "Add your first app" })
    ).toBeInTheDocument();
  });

  it("keeps the app when delete is cancelled, and returns focus to the actions menu", async () => {
    const user = userEvent.setup();
    renderApp(<HomePage />);

    const trigger = await screen.findByRole("button", {
      name: "Actions for Grafana",
    });
    await user.click(trigger);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog", {
      name: "Delete Grafana?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );
    expect(api.app.delete).not.toHaveBeenCalled();
    expect(screen.getByText("Grafana")).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("deletes the app after confirming in the alert dialog", async () => {
    const user = userEvent.setup();
    renderApp(<HomePage />);

    await user.click(
      await screen.findByRole("button", { name: "Actions for Grafana" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Delete Grafana?",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Delete forever" })
    );

    await waitFor(() => expect(api.app.delete).toHaveBeenCalledWith({ id: 2 }));
    await waitFor(() =>
      expect(screen.queryByText("Grafana")).not.toBeInTheDocument()
    );
  });

  it("opens the ping history dialog from the status button", async () => {
    const user = userEvent.setup();
    renderApp(<HomePage />);
    await user.click(
      await screen.findByRole("button", { name: /ping history for Plex/i })
    );
    const dialog = await screen.findByRole("dialog", { name: "Ping history" });
    expect(await within(dialog).findByText(/Uptime/)).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Close ping history" })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });
});

describe("agent access", () => {
  it("names every control and lets an agent check updates", async () => {
    const agent = createAgent();
    renderApp(
      <>
        <Header />
        <HomePage />
      </>
    );
    await screen.findByText("Plex");

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
    for (const label of [
      "Search apps and actions",
      "Check for updates",
      "Settings",
      "Add app",
      "Actions for Plex",
      "Actions for Grafana",
    ]) {
      expect(labels).toContain(label);
    }

    const result = await agent.act({
      steps: [{ ref: "Check for updates", action: "press" }],
    });
    expect(result.error?.message).toBeUndefined();
    expect(result.ok).toBe(true);
    await waitFor(() => expect(api.app.checkUpdates).toHaveBeenCalled());
  });

  it("refuses an agent's delete until a person approves it", async () => {
    let approve = false;
    const agent = createAgent({ allow: (step) => !step.confirm || approve });
    renderApp(<HomePage />);
    await screen.findByText("Grafana");

    const open = await agent.act({
      steps: [
        { ref: "Actions for Grafana", action: "press", args: ["Delete"] },
      ],
    });
    expect(open.error?.message).toBeUndefined();
    expect(open.ok).toBe(true);

    const remove = {
      steps: [
        {
          ref: "Delete Grafana?",
          action: "press",
          args: ["Delete forever"],
        },
      ],
    };
    expect((await agent.act(remove)).ok).toBe(false);
    expect(api.app.delete).not.toHaveBeenCalled();

    approve = true;
    await agent.act({
      steps: [
        { ref: "Actions for Grafana", action: "press", args: ["Delete"] },
      ],
    });
    const approved = await agent.act(remove);
    expect(approved.error?.message).toBeUndefined();
    expect(approved.ok).toBe(true);
    await waitFor(() => expect(api.app.delete).toHaveBeenCalledWith({ id: 2 }));
  });
});
