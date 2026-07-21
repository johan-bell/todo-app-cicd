import { useEffect, useState } from "react";
import "./App.css";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/todos")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setTodos)
      .catch(() => setError("Could not load todos"));
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created: Todo = await res.json();
      // The API lists newest first, so keep that order here too.
      setTodos([created, ...todos]);
      setText("");
      setError(null);
    } catch {
      setError("Could not add todo");
    }
  };

  const toggleTodo = async (todo: Todo) => {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Todo = await res.json();
      setTodos(todos.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch {
      setError("Could not update todo");
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTodos(todos.filter((t) => t.id !== id));
      setError(null);
    } catch {
      setError("Could not delete todo");
    }
  };

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <main id="app">
      <h1>To-Do</h1>

      <form onSubmit={addTodo} className="add-form">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New todo"
        />
        <button type="submit">Add</button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo)}
              />
              <span>{todo.title}</span>
            </label>
            <button
              type="button"
              className="delete"
              onClick={() => deleteTodo(todo.id)}
              aria-label={`Delete "${todo.title}"`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {todos.length > 0 && (
        <p className="status">
          {remaining} of {todos.length} remaining
        </p>
      )}
    </main>
  );
}

export default App;
