import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a todo and shows it in the list", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 remaining")).toBeInTheDocument();
  });

  it("toggles a todo as done", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("checkbox"));

    expect(screen.getByText("0 of 1 remaining")).toBeInTheDocument();
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
  });
});
