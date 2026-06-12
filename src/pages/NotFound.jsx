import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--border)' }}>404</h1>
      <h2 style={{ marginBottom: '0.5rem' }}>Page not found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This route doesn't exist yet. Build it!</p>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}
