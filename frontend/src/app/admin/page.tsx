'use client';
import { useEffect, useState } from 'react';
import { getAdminStats, getAdminUsers } from '@/lib/api';
export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    getAdminStats().then(r=>setStats(r.data)).catch(()=>{});
    getAdminUsers().then(r=>setUsers(r.data)).catch(()=>{});
  }, []);
  const S = {card:{background:'var(--ink-2)',border:'1px solid var(--border)',borderRadius:'0.75rem',padding:'1.25rem'}};
  return (
    <div style={{minHeight:'100vh',background:'var(--ink)',color:'var(--text)',padding:'2rem',fontFamily:'var(--font-dmsans,sans-serif)'}}>
      <h1 style={{fontFamily:'serif',fontSize:'2rem',color:'var(--gold-light)',marginBottom:'2rem'}}>Admin Dashboard</h1>
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'2rem'}}>
          {[['Total Users',stats.totalUsers,'👤'],['Total Chats',stats.totalChats,'💬'],['Total Messages',stats.totalMessages,'📝'],['Tokens Used',stats.totalTokensUsed?.toLocaleString(),'🤖']].map(([l,v,i])=>(
            <div key={l as string} style={S.card}>
              <div style={{fontSize:'1.75rem',marginBottom:'0.5rem'}}>{i}</div>
              <div style={{fontSize:'1.5rem',fontWeight:700,color:'var(--gold-light)'}}>{v}</div>
              <div style={{fontSize:'0.8rem',color:'var(--text-3)',marginTop:'0.25rem'}}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={S.card}>
        <h2 style={{fontFamily:'serif',fontSize:'1.25rem',color:'var(--text)',marginBottom:'1rem'}}>Recent Users</h2>
        <table style={{width:'100%',fontSize:'0.875rem',borderCollapse:'collapse' as const}}>
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Name','Email','Role','Joined'].map(h=><th key={h} style={{padding:'0.5rem',textAlign:'left' as const,color:'var(--text-3)',fontWeight:500}}>{h}</th>)}
          </tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{borderBottom:'1px solid var(--border)'}}>
              <td style={{padding:'0.75rem 0.5rem',color:'var(--text)'}}>{u.name}</td>
              <td style={{padding:'0.75rem 0.5rem',color:'var(--text-2)'}}>{u.email}</td>
              <td style={{padding:'0.75rem 0.5rem'}}><span style={{background:u.role==='admin'?'rgba(201,168,76,0.15)':'var(--ink-3)',border:'1px solid var(--border)',color:u.role==='admin'?'var(--gold)':'var(--text-3)',padding:'2px 8px',borderRadius:'10px',fontSize:'0.75rem'}}>{u.role}</span></td>
              <td style={{padding:'0.75rem 0.5rem',color:'var(--text-3)'}}>{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
