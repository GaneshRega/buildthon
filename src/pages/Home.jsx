import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useApp } from '../context/AppContext';
import './Home.css';

const FEATURES = [
  { icon: '⚡', title: 'Vite + React', desc: 'Blazing fast dev server and build tool out of the box.' },
  { icon: '🔀', title: 'React Router', desc: 'Client-side routing with nested routes ready to go.' },
  { icon: '🪝', title: 'Custom Hooks', desc: 'useFetch, useLocalStorage, useDebounce — grab and use.' },
  { icon: '🌐', title: 'API Utility', desc: 'Thin fetch wrapper with base URL and error handling.' },
  { icon: '🎨', title: 'Dark Theme UI', desc: 'Clean dark design system with CSS variables.' },
  { icon: '📦', title: 'Context API', desc: 'Global state + toast notifications wired up already.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { addNotification } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addNotification(`Welcome, ${name}! Ready to build! 🚀`, 'success');
    setModalOpen(false);
    setName('');
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__badge">React Hackathon 2026</div>
        <h1 className="hero__title">
          Build fast.<br />
          <span className="hero__gradient">Ship faster.</span>
        </h1>
        <p className="hero__desc">
          A fully wired React starter template — routing, hooks, API utils, context, and a component library ready for you to hack on.
        </p>
        <div className="flex gap-2 justify-center">
          <Button size="lg" onClick={() => setModalOpen(true)}>Get Started</Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/api-demo')}>See API Demo</Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mt-4">
        <h2 className="text-xl font-bold mb-2 text-center">What's included</h2>
        <div className="grid grid-3 gap-3 mt-2">
          {FEATURES.map((f) => (
            <Card key={f.title} hoverable>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="text-sm text-muted mt-1">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Modal demo */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Who's building today?">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Your Name" id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" fullWidth>Let's go!</Button>
        </form>
      </Modal>
    </div>
  );
}
