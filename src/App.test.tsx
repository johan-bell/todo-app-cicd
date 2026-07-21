import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// In-memory stand-in for the backend so the components are tested against the
// same request/response shapes the real API uses.
let todos: Todo[];
let nextId: number;

beforeEach(() => {
  todos = [];
  nextId = 1;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url === "/api/todos" && method === "GET") {
        return Response.json([...todos].reverse());
      }
      if (url === "/api/todos" && method === "POST") {
        const { title } = JSON.parse(String(init?.body)) as { title: string };
        const todo = { id: nextId++, title, completed: false };
        todos.push(todo);
        return Response.json(todo, { status: 201 });
      }
      const match = url.match(/^\/api\/todos\/(\d+)$/);
      if (match) {
        const id = Number(match[1]);
        const todo = todos.find((t) => t.id === id);
        if (!todo) return new Response(null, { status: 404 });
        if (method === "PATCH") {
          const body = JSON.parse(String(init?.body)) as {
            completed?: boolean;
          };
          if (typeof body.completed === "boolean") {
            todo.completed = body.completed;
          }
          return Response.json(todo);
        }
        if (method === "DELETE") {
          todos = todos.filter((t) => t.id !== id);
          return new Response(null, { status: 204 });
        }
      }
      return new Response(null, { status: 404 });
    }),
  );
});

describe("App", () => {
  it("adds a todo and shows it in the list", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("1 of 1 remaining")).toBeInTheDocument();
  });

  it("toggles a todo as done", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(await screen.findByRole("checkbox"));

    expect(await screen.findByText("0 of 1 remaining")).toBeInTheDocument();
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(await screen.findByRole("button", { name: /delete/i }));

    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
  });

  it("loads existing todos from the API", async () => {
    todos = [{ id: 1, title: "Existing task", completed: false }];
    nextId = 2;
    render(<App />);

    expect(await screen.findByText("Existing task")).toBeInTheDocument();
  });
});
