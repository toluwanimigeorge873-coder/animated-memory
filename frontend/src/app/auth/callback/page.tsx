'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('historygpt_token', token);
      router.push('/dashboard');
    } else {
      router.push('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0e0c0a', color: '#e8c97a', fontFamily: "'Playfair Display', serif", fontSize: 18 }}>
      Signing you in...
    </div>
  );
}
