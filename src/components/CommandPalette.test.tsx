import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";

import { makeApp, renderApp } from "../test/render";
import { Header } from "./Header";

vi.mock("@/lib/api", async () => ({
  api: (await import("../test/api-mock")).apiMock,
}));

function Location() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

const open = vi.fn();

beforeEach(() => {
  vi.stubGlobal("open", open);
  vi.mocked(api.app.getAll).mockResolvedValue([
    makeApp({ id: 1, name: "Plex" }),
    makeApp({ id: 2, name: "Grafana", category: "Infra" }),
    makeApp({ id: 3, name: "Router", url: null }),
  ] as never);
  vi.mocked(api.app.checkUpdates).mockResolvedValue(undefined as never);
});

afterEach(() => {
  open.mockReset();
  vi.unstubAllGlobals();
});

async function openPalette() {
  const user = userEvent.setup();
  renderApp(
    <>
      <Header />
      <Location />
    </>
  );
  await user.keyboard("{Control>}k{/Control}");
  const input = await screen.findByRole("combobox", {
    name: "Search commands",
  });
  return { user, input };
}

describe("command palette", () => {
  it("opens with Ctrl+K, focuses the search and closes with Escape", async () => {
    const { user, input } = await openPalette();
    expect(
      screen.getByRole("dialog", { name: "Command palette" })
    ).toBeVisible();
    expect(input).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Search apps and actions" })
    ).toHaveFocus();
  });

  it("filters apps as you type and opens the chosen app's URL with Enter", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "graf");

    expect(
      await screen.findByRole("option", { name: /Grafana/ })
    ).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Plex/ })).toBeNull();

    await user.keyboard("{Enter}");
    expect(open).toHaveBeenCalledWith(
      "https://app-2.example.com",
      "_blank",
      "noopener,noreferrer"
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("edits an app that has no URL instead of opening a window", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "router");
    await user.click(await screen.findByRole("option", { name: /Router/ }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/3");
  });

  it("runs actions: navigate, check updates and toggle theme", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "add");
    await user.click(await screen.findByRole("option", { name: "Add app" }));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/new");

    await user.keyboard("{Control>}k{/Control}");
    await user.type(
      await screen.findByRole("combobox", { name: "Search commands" }),
      "check all"
    );
    await user.keyboard("{Enter}");
    await waitFor(() => expect(api.app.checkUpdates).toHaveBeenCalled());

    await user.keyboard("{Control>}k{/Control}");
    await user.type(
      await screen.findByRole("combobox", { name: "Search commands" }),
      "theme"
    );
    await user.keyboard("{Enter}");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("explains when nothing matches", async () => {
    const { user, input } = await openPalette();
    await user.type(input, "zzzzzz");
    expect(await screen.findByText("No results found.")).toBeVisible();
  });
});
