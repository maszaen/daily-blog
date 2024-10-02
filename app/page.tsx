// app/page.tsx (Home Page)
'use client'
import { useState, useEffect } from 'react';
import { Login } from './api/export';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem(process.env.JWT_SECRET as string);
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);
  return (
    <div style={{ padding: '20px' }}>
      {isAuthenticated ? (
        <div>
          <h1>Welcome, you're logged in!</h1>
          <button
            onClick={() => {
              localStorage.removeItem(process.env.JWT_SECRET as string);
              setIsAuthenticated(false);
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <Login/>
      )}
    </div>
  );
}
