import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";

import { renderApp } from "../test/render";
import { SettingsPage } from "./SettingsPage";

vi.mock("@/lib/api", async () => ({
  api: (await import("../test/api-mock")).apiMock,
}));

const renderSettings = (route: string) =>
  renderApp(
    <Routes>
      <Route path="/settings/*" element={<SettingsPage />} />
    </Routes>,
    route
  );

beforeEach(() => {
  vi.mocked(api.notificationChannel.getAll).mockResolvedValue([
    { channelType: "EMAIL", enabled: false, config: "{}" },
    {
      channelType: "TELEGRAM",
      enabled: true,
      config: JSON.stringify({ chatId: "1", botToken: "t" }),
    },
  ] as never);
  vi.mocked(api.notificationChannel.update).mockResolvedValue({} as never);
  vi.mocked(api.notificationChannel.test).mockResolvedValue({} as never);
});

describe("general settings", () => {
  it("switches theme from the segmented control, by pointer and keyboard", async () => {
    const user = userEvent.setup();
    renderSettings("/settings");

    const group = screen.getByRole("radiogroup", { name: "Theme" });
    expect(within(group).getByRole("radio", { name: "System" })).toBeChecked();

    await user.click(within(group).getByRole("radio", { name: "Dark" }));
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    await user.keyboard("{ArrowLeft}");
    expect(within(group).getByRole("radio", { name: "Light" })).toBeChecked();
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("marks the current section in the settings navigation", async () => {
    const user = userEvent.setup();
    renderSettings("/settings");
    expect(screen.getByRole("link", { name: "General" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await user.click(screen.getByRole("link", { name: "Notifications" }));
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "General" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});

describe("notification settings", () => {
  it("expands a channel, edits it and saves", async () => {
    const user = userEvent.setup();
    renderSettings("/settings/notifications");

    const email = await screen.findByRole("button", { name: /Email/ });
    expect(email).toHaveAttribute("aria-expanded", "false");
    await user.click(email);
    expect(email).toHaveAttribute("aria-expanded", "true");

    await user.type(screen.getByLabelText(/SMTP Host/), "smtp.lan");
    const enable = screen.getByRole("switch", {
      name: "Enable Email notifications",
    });
    expect(enable).not.toBeChecked();
    enable.focus();
    await user.keyboard(" ");
    expect(enable).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(api.notificationChannel.update).toHaveBeenCalledWith({
        channelType: "EMAIL",
        enabled: true,
        config: JSON.stringify({ smtpHost: "smtp.lan" }),
      })
    );
  });

  it("collapses an expanded channel again with the keyboard", async () => {
    const user = userEvent.setup();
    renderSettings("/settings/notifications");
    const email = await screen.findByRole("button", { name: /Email/ });
    email.focus();
    await user.keyboard("{Enter}");
    expect(email).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Enter}");
    expect(email).toHaveAttribute("aria-expanded", "false");
  });

  it("names every control for an agent and lets it fill a channel", async () => {
    const agent = createAgent();
    renderSettings("/settings/notifications");
    await screen.findByRole("button", { name: /Telegram/ });
    await userEvent.click(screen.getByRole("button", { name: /Telegram/ }));

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
      "Enable Email notifications",
      "Enable Telegram notifications",
      "Chat ID",
      "Bot Token",
    ]) {
      expect(labels, `${label} is missing from the snapshot`).toContain(label);
    }

    const result = await agent.act({
      steps: [
        { ref: "Chat ID", action: "setValue", args: ["42"] },
        {
          ref: "Enable Email notifications",
          action: "setChecked",
          args: [true],
        },
      ],
    });
    expect(result.error?.message).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>(/Chat ID/).value).toBe("42");
    expect(
      screen.getByRole("switch", { name: "Enable Email notifications" })
    ).toBeChecked();
  });
});
