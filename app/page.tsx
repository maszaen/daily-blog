// app/page.tsx (Home Page)
'use client'
import { useState, useEffect } from 'react';
import { Auth } from './api/export';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (isAuthenticated || token) {
      setIsAuthenticated(true);
      router.push('/dashboard');
    }
  }, []);
  return (
    <Auth/>
  );
}
