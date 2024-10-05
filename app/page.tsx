// app/page.tsx (Home Page)
'use client'
import { useEffect } from 'react';
import { Auth } from './api/export';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, []);
  return (
    <Auth/>
  );
}
