import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("calls onAdd when the add button is clicked", async () => {
    const onAdd = vi.fn();
    render(<EmptyState onAdd={onAdd} />);
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
