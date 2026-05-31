'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await register(form.name, form.email, form.password); router.push('/dashboard'); }
    catch (err: any) { setError(err.response?.data?.error || 'Registration failed.'); }
    finally { setLoading(false); }
  };
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const inp = "w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-yellow-600";
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--ink)',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:'420px'}}>
        <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>📜</div>
          <h1 style={{fontFamily:'var(--font-playfair, serif)',fontSize:'2rem',color:'var(--gold-light)',fontWeight:700}}>Join HistoryGPT</h1>
          <p style={{color:'var(--text-2)',fontSize:'0.9rem',marginTop:'0.5rem'}}>Start your historical journey today</p>
        </div>
        <div style={{background:'var(--ink-2)',border:'1px solid var(--border)',borderRadius:'1rem',padding:'2rem'}}>
          <a href={`${API_URL}/api/auth/google`} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.75rem',width:'100%',padding:'0.75rem 1rem',background:'white',color:'#333',borderRadius:'0.75rem',fontWeight:500,fontSize:'0.9rem',textDecoration:'none',marginBottom:'1.5rem'}}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.5 0-14 4.1-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.4C29.5 35.6 26.9 37 24 37c-5.3 0-9.6-3.2-11.3-8.1l-6.6 5C9.7 39.7 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.2 4.5-4.2 6l6.3 5.4C41.4 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
            Sign up with Google
          </a>
          {error && <div style={{background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.4)',color:'#f87171',padding:'0.75rem 1rem',borderRadius:'0.5rem',fontSize:'0.875rem',marginBottom:'1rem'}}>{error}</div>}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {[{key:'name',label:'Name',type:'text'},{key:'email',label:'Email',type:'email'},{key:'password',label:'Password',type:'password'}].map(f=>(
              <div key={f.key}>
                <label style={{display:'block',fontSize:'0.875rem',color:'var(--text-2)',marginBottom:'0.375rem'}}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} required
                  style={{width:'100%',background:'var(--ink-3)',border:'1px solid var(--border-2)',borderRadius:'0.75rem',padding:'0.75rem 1rem',fontSize:'0.875rem',color:'var(--text)',outline:'none'}} />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{width:'100%',padding:'0.75rem',background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)',color:'var(--gold-light)',borderRadius:'0.75rem',fontWeight:500,fontSize:'0.9rem',cursor:'pointer'}}>
              {loading?'Creating account...':'Create Free Account'}
            </button>
          </form>
          <p style={{textAlign:'center',fontSize:'0.875rem',color:'var(--text-3)',marginTop:'1.5rem'}}>Already have an account? <Link href="/login" style={{color:'var(--gold)'}}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
