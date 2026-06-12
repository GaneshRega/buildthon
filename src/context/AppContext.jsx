import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3500);
  };

  return (
    <AppContext.Provider value={{ user, setUser, notifications, addNotification }}>
      {children}
      {notifications.length > 0 && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 500,
              background: n.type === 'error' ? '#ef4444' : n.type === 'success' ? '#10b981' : '#6366f1',
              color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              animation: 'slideUp 0.2s ease',
            }}>
              {n.message}
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
