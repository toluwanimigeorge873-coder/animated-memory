'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, getChats, createChat, deleteChat, updateChat, sendAIMessage, addMessage, getChat, logout, exportChatPDF } from '@/lib/api';

const TOPICS = [
  {icon:'🏛️',title:'Roman Empire',q:'Tell me about the rise and fall of the Roman Empire'},
  {icon:'👑',title:'Mali Empire',q:'Tell me about the Mali Empire under Mansa Musa'},
  {icon:'⚔️',title:'World War II',q:'Explain the causes and consequences of World War II'},
  {icon:'🌍',title:'African History',q:'Give me an overview of major African civilizations and empires'},
  {icon:'🏰',title:'Medieval Europe',q:'What was life like in Medieval Europe?'},
  {icon:'☢️',title:'Cold War',q:'Explain the Cold War between USA and Soviet Union'},
];

const DAILY_FACTS = [
  {fact:"In 1324, Mansa Musa of Mali embarked on a pilgrimage so lavish it caused severe inflation across Egypt and Arabia for over a decade.",source:"Mali Empire, 14th Century"},
  {fact:"The Library of Alexandria held between 400,000 to 700,000 scrolls before its gradual destruction.",source:"Ancient Egypt, 3rd Century BC"},
  {fact:"The Zulu Kingdom under Shaka built an army of 50,000 warriors that dominated Southern Africa in the early 19th century.",source:"Zulu Kingdom, circa 1816"},
  {fact:"The Mongol Empire at its height was the largest contiguous land empire in history at 24 million square kilometers.",source:"Mongol Empire, 13th Century"},
  {fact:"Haiti's 1804 revolution was the only successful slave revolt in history to result in a nation's founding.",source:"Haitian Revolution, 1791–1804"},
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string|null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat');
  const [detailLevel, setDetailLevel] = useState('standard');
  const [view, setView] = useState<'welcome'|'chat'|'timeline'|'research'|'quiz'>('welcome');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number|null>(null);
  const [timelineEra, setTimelineEra] = useState('ancient');
  const fact = DAILY_FACTS[new Date().getDate() % DAILY_FACTS.length];

  useEffect(() => {
    getMe().then(r => {
      setUser(r.data.user);
      if (!r.data.user) router.push('/login');
    }).catch(() => router.push('/login'));
    getChats().then(r => setChats(r.data)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const startNewChat = async () => {
    const c = await createChat('New Conversation', mode);
    setCurrentChatId(c.data.id);
    setMessages([]);
    setView('chat');
    setChats(prev => [c.data, ...prev]);
  };

  const openChat = async (chatId: string) => {
    const r = await getChat(chatId);
    setCurrentChatId(chatId);
    setMessages(r.data.messages || []);
    setView('chat');
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteChat(id);
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) { setCurrentChatId(null); setMessages([]); setView('welcome'); }
  };

  const handleExport = async () => {
    if (!currentChatId) return;
    const r = await exportChatPDF(currentChatId);
    const url = URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'historygpt-chat.pdf'; a.click();
  };

  const send = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    let chatId = currentChatId;
    if (!chatId) {
      const c = await createChat(q.slice(0, 80), mode);
      chatId = c.data.id;
      setCurrentChatId(chatId);
      setChats(prev => [c.data, ...prev]);
    }
    setView('chat');
    const userMsg = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    await addMessage(chatId, 'user', q);
    setLoading(true);
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    try {
      const r = await sendAIMessage(history, detailLevel, mode);
      const aiMsg = { role: 'assistant', content: r.data.content };
      setMessages(prev => [...prev, aiMsg]);
      await addMessage(chatId, 'assistant', r.data.content);
      // Update chat title after first message
      if (messages.length === 0) {
        await updateChat(chatId, { title: q.slice(0, 80) });
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: q.slice(0, 80) } : c));
      }
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, AI request failed. Please try again.' }]); }
    finally { setLoading(false); }
  };

  const QUIZ = [
    {q:'Which African empire was likely the wealthiest in the 14th century?',opts:['Ethiopian Empire','Mali Empire','Songhai Empire','Great Zimbabwe'],correct:1,exp:'The Mali Empire under Mansa Musa controlled the world\'s largest gold deposits. Mansa Musa is often cited as the wealthiest individual in human history.'},
    {q:'What sparked the French Revolution in 1789?',opts:['Tennis Court Oath','Storming of the Bastille','Marie Antoinette\'s trial','Napoleon\'s coup'],correct:1,exp:'The Storming of the Bastille on July 14, 1789 is the symbolic start of the French Revolution. Parisians stormed the fortress seeking weapons and to free prisoners.'},
    {q:'Which civilization built the world\'s first legal code?',opts:['Ancient Egypt','Babylon under Hammurabi','Sumer','Ancient Greece'],correct:1,exp:'The Code of Hammurabi (circa 1754 BC) from ancient Babylon is one of the oldest deciphered writings, containing 282 laws.'},
    {q:'The Haitian Revolution was historically unique because:',opts:['It was the first Caribbean revolt','It was the only successful slave revolution creating a nation','Napoleon supported it','Haiti became a French protectorate'],correct:1,exp:'The Haitian Revolution (1791–1804) was the only successful slave revolt in history resulting in a new nation, establishing the first Black republic in the world.'},
  ];

  const TIMELINE: Record<string, any[]> = {
    ancient: [
      {year:'3100 BC',title:'Unification of Egypt',desc:'Pharaoh Narmer unifies Upper and Lower Egypt, founding one of history\'s greatest civilizations.',tags:['Africa','Political']},
      {year:'550 BC',title:'Persian Empire',desc:'Cyrus the Great establishes the Achaemenid Empire, the largest empire the world had yet seen.',tags:['Asia','Political']},
      {year:'44 BC',title:'Assassination of Caesar',desc:'Julius Caesar is assassinated on the Ides of March, triggering the fall of the Roman Republic.',tags:['Europe']},
    ],
    medieval: [
      {year:'632 AD',title:'Islamic Golden Age',desc:'Following Muhammad\'s death, the Caliphate expands rapidly, ushering in centuries of scientific achievement.',tags:['Global','Cultural']},
      {year:'1235',title:'Mali Empire Founded',desc:'Sundiata Keita establishes the Mali Empire after the Battle of Kirina, creating Africa\'s wealthiest kingdom.',tags:['Africa','Political']},
      {year:'1346',title:'Black Death',desc:'The bubonic plague devastates Europe, killing 30–60% of the population.',tags:['Europe','Global']},
    ],
    modern: [
      {year:'1492',title:'Columbus & the Americas',desc:'Christopher Columbus reaches the Caribbean, beginning European colonization of the Americas.',tags:['Americas']},
      {year:'1789',title:'French Revolution',desc:'The French Revolution dismantles monarchy, spreading ideals of liberty and equality worldwide.',tags:['Europe','Political']},
      {year:'1994',title:'End of Apartheid',desc:'Nelson Mandela becomes South Africa\'s first Black president, ending the apartheid system.',tags:['Africa','Political']},
    ],
  };

  const S = {
    sidebar:{width:260,flexShrink:0,background:'var(--ink-2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column' as const,height:'100vh',overflow:'hidden'},
    main:{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden'},
    header:{padding:'1rem 1.5rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'1rem',background:'var(--ink-2)',flexShrink:0},
    chatArea:{flex:1,overflowY:'auto' as const,padding:'2rem 0',scrollBehavior:'smooth' as const},
    inputArea:{padding:'1rem 1.5rem 1.25rem',borderTop:'1px solid var(--border)',background:'var(--ink-2)',flexShrink:0},
    navBtn:{display:'flex',alignItems:'center',gap:'0.625rem',padding:'0.5rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',border:'none',background:'none',color:'var(--text-2)',width:'100%',textAlign:'left' as const,fontSize:'0.875rem',transition:'all 0.15s'},
    pill:{padding:'0.375rem 0.875rem',borderRadius:'20px',border:'1px solid var(--border-2)',background:'none',color:'var(--text-2)',fontSize:'0.75rem',cursor:'pointer'},
    pillActive:{background:'rgba(201,168,76,0.12)',borderColor:'rgba(201,168,76,0.3)',color:'var(--gold-light)'},
  };

  const modes = [{id:'chat',icon:'💬',label:'AI Chat'},{id:'timeline',icon:'🗓',label:'Timeline'},{id:'research',icon:'🔬',label:'Research'},{id:'quiz',icon:'📝',label:'Quiz'}];
  const levels = ['simple','standard','academic'];

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--ink)',color:'var(--text)',fontFamily:'var(--font-dmsans, sans-serif)'}}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={{padding:'1.25rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'0.625rem'}}>
          <span style={{fontSize:'1.5rem'}}>📜</span>
          <span style={{fontFamily:'serif',fontSize:'1.1rem',fontWeight:700,color:'var(--gold-light)'}}>HistoryGPT</span>
          {user && <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:80}}>{user.name}</span>}
        </div>
        <div style={{padding:'0.75rem 0.5rem 0'}}>
          <button onClick={startNewChat} style={{display:'flex',alignItems:'center',gap:'0.5rem',width:'100%',padding:'0.625rem 0.75rem',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'0.5rem',color:'var(--gold-light)',cursor:'pointer',fontSize:'0.875rem'}}>
            ✦ New Conversation
          </button>
        </div>
        <div style={{padding:'0.5rem',overflowY:'auto',flex:1}}>
          <div style={{fontSize:'0.625rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--text-3)',padding:'0.75rem 0.5rem 0.375rem',marginTop:'0.5rem'}}>Modes</div>
          {modes.map(m => (
            <button key={m.id} onClick={() => { setView(m.id as any); setMode(m.id); }} style={{...S.navBtn,...(view===m.id?{background:'rgba(201,168,76,0.1)',color:'var(--gold-light)'}:{})}}>
              <span>{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
          <div style={{fontSize:'0.625rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--text-3)',padding:'0.75rem 0.5rem 0.375rem',marginTop:'0.5rem'}}>Recent Chats</div>
          {chats.slice(0,8).map(c => (
            <div key={c.id} onClick={() => openChat(c.id)} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 0.625rem',borderRadius:'0.5rem',cursor:'pointer',background: c.id===currentChatId?'var(--ink-3)':'none'}}>
              <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--border-2)',flexShrink:0}}></span>
              <span style={{flex:1,fontSize:'0.8rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color: c.id===currentChatId?'var(--gold)':'var(--text-3)'}}>{c.title}</span>
              <button onClick={(e) => handleDeleteChat(e, c.id)} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:'0.7rem',padding:'2px 4px',borderRadius:'3px',opacity:0.6}}>✕</button>
            </div>
          ))}
        </div>
        <div style={{padding:'0.75rem',borderTop:'1px solid var(--border)'}}>
          <button onClick={handleLogout} style={{...S.navBtn,color:'var(--text-3)'}}>
            <span>↩</span><span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        {/* Header */}
        <div style={S.header}>
          <div style={{flex:1,fontFamily:'serif',fontSize:'1rem',color:'var(--text)'}}>
            {view==='chat'?'AI History Assistant':view==='timeline'?'Timeline Visualizer':view==='research'?'Research Mode':'History Quiz'}
          </div>
          {view==='chat' && (
            <div style={{display:'flex',gap:'0.375rem'}}>
              {levels.map(l => (
                <button key={l} onClick={() => setDetailLevel(l)} style={{...S.pill,...(detailLevel===l?S.pillActive:{}),textTransform:'capitalize' as const}}>{l}</button>
              ))}
            </div>
          )}
          {view==='chat' && currentChatId && (
            <button onClick={handleExport} style={{...S.pill,marginLeft:'0.5rem'}}>⬇ PDF</button>
          )}
          <span style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',color:'var(--gold)',fontSize:'0.7rem',padding:'0.25rem 0.625rem',borderRadius:'20px',textTransform:'capitalize' as const}}>{view} mode</span>
        </div>

        {/* Content */}
        <div style={S.chatArea}>
          {/* WELCOME */}
          {view==='welcome' && (
            <div style={{maxWidth:700,margin:'0 auto',padding:'0 1.5rem'}}>
              <div style={{background:'linear-gradient(135deg,rgba(50,35,8,0.8),rgba(30,20,5,0.9))',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'0.75rem',padding:'1.25rem',marginBottom:'2rem'}}>
                <div style={{fontSize:'0.625rem',textTransform:'uppercase',letterSpacing:'2px',color:'var(--gold)',marginBottom:'0.5rem'}}>📅 Historical Fact of the Day</div>
                <div style={{fontFamily:'serif',fontSize:'1rem',fontStyle:'italic',lineHeight:1.6}}>{fact.fact}</div>
                <div style={{fontSize:'0.75rem',color:'var(--text-3)',marginTop:'0.5rem'}}>— {fact.source}</div>
              </div>
              <h1 style={{fontFamily:'serif',fontSize:'2.25rem',fontWeight:700,color:'var(--gold-light)',lineHeight:1.15,marginBottom:'0.75rem'}}>
                Explore <em style={{fontStyle:'italic',color:'var(--gold-bright)'}}>all of history</em><br/>with your AI guide.
              </h1>
              <p style={{fontSize:'1rem',color:'var(--text-2)',marginBottom:'2rem',lineHeight:1.6}}>Ask anything about world history — from ancient civilizations to modern events.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                {TOPICS.map(t => (
                  <div key={t.title} onClick={() => send(t.q)} style={{background:'var(--ink-3)',border:'1px solid var(--border)',borderRadius:'0.75rem',padding:'1rem',cursor:'pointer',display:'flex',gap:'0.75rem',transition:'all 0.2s'}}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(201,168,76,0.35)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
                    <span style={{fontSize:'1.5rem'}}>{t.icon}</span>
                    <div><div style={{fontSize:'0.875rem',fontWeight:500,color:'var(--text)'}}>{t.title}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}
          {view==='chat' && (
            <div style={{maxWidth:720,margin:'0 auto',padding:'0 1.5rem'}}>
              {messages.map((m, i) => (
                <div key={i} style={{display:'flex',gap:'0.875rem',marginBottom:'1.75rem',flexDirection:m.role==='user'?'row-reverse':'row',animation:'fadeUp 0.3s ease'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.875rem',background:m.role==='ai'?'linear-gradient(135deg,#3d2e0a,#8b6020)':'var(--ink-3)',border:m.role==='user'?'1px solid var(--border-2)':'none'}}>
                    {m.role==='user'?'👤':'📜'}
                  </div>
                  <div style={{maxWidth:'82%'}}>
                    <div style={{padding:'0.875rem 1.125rem',borderRadius:'1rem',fontSize:'0.875rem',lineHeight:1.75,background:m.role==='user'?'rgba(201,168,76,0.1)':'var(--ink-3)',border:`1px solid ${m.role==='user'?'rgba(201,168,76,0.2)':'var(--border)'}`,borderTopRightRadius:m.role==='user'?'4px':'1rem',borderTopLeftRadius:m.role==='assistant'?'4px':'1rem'}}
                      dangerouslySetInnerHTML={{__html:m.content.replace(/\*\*(.*?)\*\*/g,'<strong style="color:var(--gold-light)">$1</strong>').replace(/\n/g,'<br/>')}} />
                    <div style={{fontSize:'0.7rem',color:'var(--text-3)',marginTop:'0.375rem',padding:'0 0.25rem',textAlign:m.role==='user'?'right':'left'}}>{m.role==='user'?'You':'HistoryGPT'}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{display:'flex',gap:'0.875rem',marginBottom:'1.75rem'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#3d2e0a,#8b6020)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.875rem',flexShrink:0}}>📜</div>
                  <div style={{display:'flex',gap:'5px',padding:'0.875rem 1.125rem',background:'var(--ink-3)',border:'1px solid var(--border)',borderRadius:'1rem',borderTopLeftRadius:'4px',alignItems:'center'}}>
                    {[0,0.2,0.4].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'var(--text-3)',animation:`bounce 1.4s ease ${d}s infinite`}}/>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {view==='timeline' && (
            <div style={{maxWidth:720,margin:'0 auto',padding:'0 1.5rem'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
                <h2 style={{fontFamily:'serif',fontSize:'1.5rem',color:'var(--gold-light)'}}>Historical Timeline</h2>
                <div style={{display:'flex',gap:'0.375rem'}}>
                  {['ancient','medieval','modern'].map(e=>(
                    <button key={e} onClick={()=>setTimelineEra(e)} style={{...S.pill,...(timelineEra===e?S.pillActive:{}),textTransform:'capitalize' as const}}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{position:'relative',paddingLeft:'2rem'}}>
                <div style={{position:'absolute',left:'0.75rem',top:0,bottom:0,width:'2px',background:'var(--border-2)'}}/>
                {TIMELINE[timelineEra].map((ev,i) => (
                  <div key={i} onClick={()=>send(`Tell me about ${ev.title} in detail — its causes, key events, and historical impact`)} style={{position:'relative',marginBottom:'1.75rem',cursor:'pointer'}}>
                    <div style={{position:'absolute',left:'-1.625rem',top:'1rem',width:'14px',height:'14px',borderRadius:'50%',background:'var(--ink-2)',border:'2px solid var(--border-2)',transition:'all 0.2s'}}/>
                    <div style={{background:'var(--ink-3)',border:'1px solid var(--border)',borderRadius:'0.75rem',padding:'1rem',transition:'all 0.2s'}}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(201,168,76,0.3)')} onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
                      <div style={{fontSize:'0.7rem',color:'var(--gold)',fontWeight:500,letterSpacing:'1px',marginBottom:'0.25rem'}}>{ev.year}</div>
                      <div style={{fontFamily:'serif',fontSize:'1rem',color:'var(--text)',marginBottom:'0.375rem'}}>{ev.title}</div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-2)',lineHeight:1.55}}>{ev.desc}</div>
                      <div style={{display:'flex',gap:'0.375rem',marginTop:'0.625rem',flexWrap:'wrap' as const}}>
                        {ev.tags.map((t:string)=><span key={t} style={{background:'var(--ink-2)',border:'1px solid var(--border)',color:'var(--text-3)',fontSize:'0.7rem',padding:'2px 8px',borderRadius:'10px'}}>{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESEARCH */}
          {view==='research' && (
            <div style={{maxWidth:720,margin:'0 auto',padding:'0 1.5rem'}}>
              <h2 style={{fontFamily:'serif',fontSize:'1.5rem',color:'var(--gold-light)',marginBottom:'0.5rem'}}>Research Mode</h2>
              <p style={{fontSize:'0.875rem',color:'var(--text-2)',marginBottom:'1.75rem'}}>Advanced tools for students, researchers, and history enthusiasts.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1.5rem'}}>
                {[
                  {icon:'📄',title:'Essay Outline',q:'Generate an academic essay outline with thesis statement about: '},
                  {icon:'📚',title:'Bibliography',q:'Suggest academic sources and bibliography for research on: '},
                  {icon:'⚖️',title:'Compare Events',q:'Compare and contrast these two historical events in detail: '},
                  {icon:'🔍',title:'Fact Check',q:'Verify and fact-check this historical claim: '},
                  {icon:'📝',title:'Study Guide',q:'Create a comprehensive study guide for: '},
                  {icon:'❓',title:'Research Questions',q:'Generate 8 original research questions for academic study of: '},
                ].map(r=>(
                  <div key={r.title} onClick={()=>{setInput(r.q);setView('chat');setMode('research');}} style={{background:'var(--ink-3)',border:'1px solid var(--border)',borderRadius:'0.75rem',padding:'1.125rem',cursor:'pointer',transition:'all 0.2s'}}
                    onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
                    <div style={{fontSize:'1.75rem',marginBottom:'0.625rem'}}>{r.icon}</div>
                    <div style={{fontSize:'0.9rem',fontWeight:500,color:'var(--text)'}}>{r.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUIZ */}
          {view==='quiz' && (
            <div style={{maxWidth:680,margin:'0 auto',padding:'0 1.5rem'}}>
              {quizIndex < QUIZ.length ? (
                <>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
                    <h2 style={{fontFamily:'serif',fontSize:'1.5rem',color:'var(--gold-light)'}}>History Quiz</h2>
                    <span style={{fontSize:'0.8rem',color:'var(--text-3)'}}>Q{quizIndex+1}/{QUIZ.length} · Score: {quizScore}</span>
                  </div>
                  <div style={{background:'var(--ink-3)',border:'1px solid var(--border)',borderRadius:'0.75rem',padding:'1.75rem'}}>
                    <div style={{fontFamily:'serif',fontSize:'1.2rem',lineHeight:1.4,marginBottom:'1.5rem'}}>{QUIZ[quizIndex].q}</div>
                    <div style={{display:'flex',flexDirection:'column' as const,gap:'0.625rem'}}>
                      {QUIZ[quizIndex].opts.map((o,i)=>(
                        <button key={i} disabled={quizAnswered} onClick={()=>{setSelectedOpt(i);setQuizAnswered(true);if(i===QUIZ[quizIndex].correct)setQuizScore(s=>s+1);}}
                          style={{background: quizAnswered?(i===QUIZ[quizIndex].correct?'rgba(46,125,82,0.2)':i===selectedOpt?'rgba(192,57,43,0.2)':'var(--ink-2)'):'var(--ink-2)',border:`1px solid ${quizAnswered?(i===QUIZ[quizIndex].correct?'#2e7d52':i===selectedOpt?'#c0392b':'var(--border)'):'var(--border)'}`,borderRadius:'0.5rem',padding:'0.875rem 1.125rem',cursor:quizAnswered?'default':'pointer',fontSize:'0.875rem',color:quizAnswered?(i===QUIZ[quizIndex].correct?'#4ade80':i===selectedOpt?'#f87171':'var(--text-2)'):'var(--text-2)',textAlign:'left' as const}}>
                          {String.fromCharCode(65+i)}. {o}
                        </button>
                      ))}
                    </div>
                    {quizAnswered && <div style={{marginTop:'1.25rem',padding:'0.875rem',background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:'0.5rem',fontSize:'0.8rem',color:'var(--text-2)',lineHeight:1.6}}>{QUIZ[quizIndex].exp}</div>}
                    {quizAnswered && <button onClick={()=>{setQuizIndex(i=>i+1);setQuizAnswered(false);setSelectedOpt(null);}} style={{marginTop:'1rem',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',color:'var(--gold-light)',padding:'0.625rem 1.5rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.875rem'}}>Next Question →</button>}
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center' as const,paddingTop:'3rem'}}>
                  <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🏆</div>
                  <h2 style={{fontFamily:'serif',fontSize:'2rem',color:'var(--gold-light)',marginBottom:'0.5rem'}}>Quiz Complete!</h2>
                  <div style={{fontSize:'2rem',fontWeight:700,color:'var(--gold-bright)',marginBottom:'0.75rem'}}>{quizScore}/{QUIZ.length}</div>
                  <p style={{color:'var(--text-2)',marginBottom:'1.5rem'}}>{quizScore===QUIZ.length?'Perfect score! Outstanding historian!':quizScore>=3?'Excellent historical knowledge!':'Keep exploring history!'}</p>
                  <button onClick={()=>{setQuizIndex(0);setQuizScore(0);setQuizAnswered(false);}} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',color:'var(--gold-light)',padding:'0.75rem 2rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.9rem'}}>Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        {(view==='chat'||view==='welcome') && (
          <div style={S.inputArea}>
            <div style={{maxWidth:720,margin:'0 auto'}}>
              <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.625rem',flexWrap:'wrap' as const}}>
                {[{l:'📚 Study Guide',q:'Create a study guide for '},{l:'🗓 Timeline',q:'Create a timeline of '},{l:'⚖️ Compare',q:'Compare and contrast '},{l:'✍️ Essay Help',q:'Generate an essay outline about '}].map(t=>(
                  <button key={t.l} onClick={()=>setInput(t.q)} style={{background:'none',border:'1px solid var(--border)',color:'var(--text-3)',padding:'0.3rem 0.75rem',borderRadius:'20px',fontSize:'0.75rem',cursor:'pointer',transition:'all 0.15s'}}>{t.l}</button>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:'0.625rem',background:'var(--ink-3)',border:'1px solid var(--border-2)',borderRadius:'1rem',padding:'0.625rem 0.875rem'}}>
                <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
                  placeholder="Ask about any historical event, figure, or era..." rows={1}
                  style={{flex:1,background:'none',border:'none',color:'var(--text)',fontFamily:'inherit',fontSize:'0.875rem',resize:'none' as const,outline:'none',lineHeight:1.6,maxHeight:'120px'}} />
                <button onClick={()=>send()} disabled={loading||!input.trim()}
                  style={{background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)',color:'var(--gold-light)',padding:'0.5rem 1rem',borderRadius:'0.625rem',cursor:'pointer',fontSize:'0.8rem',flexShrink:0,opacity:loading||!input.trim()?0.4:1}}>
                  Send ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
