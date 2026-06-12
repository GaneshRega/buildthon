import Card from '../components/Card';

const STACK = [
  { name: 'Vite', desc: 'Build tool & dev server', href: 'https://vitejs.dev' },
  { name: 'React 18', desc: 'UI library', href: 'https://react.dev' },
  { name: 'React Router v6', desc: 'Client-side routing', href: 'https://reactrouter.com' },
];

export default function About() {
  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      <h1>About</h1>
      <p className="text-muted mt-1 mb-4">This starter was built for the React Hyderabad Buildathon 2026.</p>

      <h2 className="mb-2">Stack</h2>
      <div className="grid grid-3 gap-3">
        {STACK.map((s) => (
          <Card key={s.name} hoverable title={s.name} subtitle={s.desc}>
            <a href={s.href} target="_blank" rel="noreferrer" className="text-sm">Docs →</a>
          </Card>
        ))}
      </div>

      <Card title="Folder Structure" className="mt-4">
        <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{`src/
├── components/     # Reusable UI (Button, Card, Modal, Input, Navbar, Loading)
├── context/        # AppContext — global state + toasts
├── hooks/          # useFetch, useLocalStorage, useDebounce
├── pages/          # Route-level components
├── utils/          # api.js, helpers.js
└── styles/         # global.css`}
        </pre>
      </Card>
    </div>
  );
}
