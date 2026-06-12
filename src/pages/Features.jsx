import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import './Features.css';

export default function Features() {
  const { addNotification } = useApp();
  const [todos, setTodos, clearTodos] = useLocalStorage('buildthon-todos', []);
  const [input, setInput] = useState('');

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
    addNotification('Task added!', 'success');
  };

  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id) =>
    setTodos(todos.filter((t) => t.id !== id));

  return (
    <div className="container features-page">
      <h1>Component Showcase</h1>
      <p className="text-muted mb-2">All components and hooks in action</p>

      {/* localStorage todo demo */}
      <Card title="Todo List (persisted via useLocalStorage)" subtitle="Survives page refresh">
        <form onSubmit={addTodo} className="flex gap-2 mb-2">
          <Input id="todo" placeholder="Add a task..." value={input} onChange={(e) => setInput(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
        {todos.length === 0 && <p className="text-muted text-sm">No tasks yet. Add one above.</p>}
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.done ? 'todo-item--done' : ''}`}>
              <label className="flex gap-2 items-center" style={{ cursor: 'pointer', flex: 1 }}>
                <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
                <span>{todo.text}</span>
              </label>
              <button className="todo-delete" onClick={() => remove(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
        {todos.length > 0 && (
          <Button variant="danger" size="sm" onClick={() => { clearTodos(); addNotification('Cleared!'); }} >
            Clear all
          </Button>
        )}
      </Card>

      {/* Notification demo */}
      <Card title="Toast Notifications" subtitle="Global via AppContext" className="mt-4">
        <div className="flex gap-2">
          <Button onClick={() => addNotification('Info message!', 'info')}>Info</Button>
          <Button variant="secondary" onClick={() => addNotification('Success! Great work.', 'success')}>Success</Button>
          <Button variant="danger" onClick={() => addNotification('Something went wrong!', 'error')}>Error</Button>
        </div>
      </Card>

      {/* Button showcase */}
      <Card title="Button Variants" className="mt-4">
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>
    </div>
  );
}
