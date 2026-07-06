import { useEffect, useState } from 'react'
import './App.css'

interface Todo {
  id: string
  text: string
  done: boolean
}

const STORAGE_KEY = 'todos'

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  })
  const [text, setText] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos([...todos, { id: crypto.randomUUID(), text: trimmed, done: false }])
    setText('')
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const remaining = todos.filter((t) => !t.done).length

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

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? 'done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
            </label>
            <button
              type="button"
              className="delete"
              onClick={() => deleteTodo(todo.id)}
              aria-label={`Delete "${todo.text}"`}
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
  )
}

export default App
