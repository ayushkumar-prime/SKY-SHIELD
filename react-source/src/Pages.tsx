import { useEffect, useState, type FormEvent } from 'react';
export const pages = [
  { id: 'overview', label: 'Overview', title: 'Airspace overview', description: 'A quick view of the demo. Choose a section to start.' },
  { id: 'radar', label: 'Live radar', title: 'Live radar', description: 'Watch the tracks. Zoom in or follow one object.' },
  { id: 'threats', label: 'Threats', title: 'Threat review', description: 'Review the ranked tracks and see why each score changes.' },
  { id: 'prediction', label: 'Prediction', title: 'Trajectory prediction', description: 'Change the time window and explore the simple motion math.' },
  { id: 'events', label: 'Event log', title: 'Event log', description: 'See priority changes and review marks from this session.' },
  { id: 'about', label: 'About / Team', title: 'About SKY SHIELD', description: 'Our idea, our website, and the people building it.' },
  { id: 'contact', label: 'Contact Us', title: 'Contact us', description: 'Have a question, found a bug, or want to share an idea?' },
] as const;
export type Page = typeof pages[number]['id'];
const getPage = (): Page => { const id = location.hash.replace(/^#\/?/, ''); return pages.find(p => p.id === id)?.id || 'overview'; };
export function usePage() {
  const [page, setPage] = useState<Page>(getPage);
  useEffect(() => { const update = () => setPage(getPage()); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  return page;
}
export function Navigation({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [page]);
  return <div className="navigation-shell"><div className="navigation-inner"><button className="mobile-menu" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(v => !v)}>☰ Sections <span>{pages.find(p => p.id === page)?.label}</span></button><nav id="main-navigation" className={open ? 'site-nav open' : 'site-nav'} aria-label="Main navigation">{pages.map((p, i) => <a key={p.id} href={`#/${p.id}`} aria-current={page === p.id ? 'page' : undefined} onClick={() => setOpen(false)}><small>{String(i + 1).padStart(2, '0')}</small>{p.label}</a>)}</nav></div></div>;
}
export function Overview({ high, total }: { high: number; total: number }) {
  return <section className="overview-sections" aria-label="Choose a dashboard section"><div className="overview-message"><span className="eyebrow">MISSION / DEMO ONLY</span><h3>Know what is in the air.</h3><p>Follow {total} fake flying objects, check their next position, and review the tracks that need attention.</p><a className="action-link" href="#/radar">Open live radar →</a></div><div className="section-cards">{[
    ['radar', '01', 'Live radar', 'Watch moving objects on a 10 × 10 km grid. Zoom and follow a track.', 'Open radar'],
    ['threats', '02', 'Threat review', `${high} high-priority tracks right now. Check each score and mark your review.`, 'Review tracks'],
    ['prediction', '03', 'Prediction lab', 'Move the time slider and see how speed and direction change the estimated position.', 'Explore the math'],
    ['events', '04', 'Event log', 'See the latest priority changes and operator review marks.', 'Read the log'],
  ].map(([id, n, title, text, action]) => <a href={`#/${id}`} className="section-card" key={id}><span className="section-num">{n} / SECTION</span><h3>{title}</h3><p>{text}</p><b>{action} →</b></a>)}</div><p className="overview-help">New here? <a href="#/about">Meet our team</a> or <a href="#/contact">contact us</a>. The simulation keeps running as you move between sections.</p></section>;
}
const team = [
  { name: 'Namit', initials: 'N', role: 'Team leader · Website designer · UI maker', work: 'Leads the team and builds the website design and user interface.' },
  { name: 'Ayush', initials: 'A', role: 'Frontend developer', work: 'Builds the pages, navigation, and interactive dashboard.' },
  { name: 'Lucky', initials: 'L', role: 'Backend developer', work: 'Works on the server and the simulated data flow.' },
  { name: 'Aniket', initials: 'A', role: 'Backend developer', work: 'Works on the backend logic and data processing.' },
];
export function About() {
  return <div className="information-page"><section className="panel"><div className="panel-heading"><h3>01 / WHY WE BUILT IT</h3><span>Hackathon project</span></div><div className="information-body"><h3>A simple view of a busy airspace.</h3><p>SKY SHIELD is a counter-drone monitoring and airspace security prototype. It brings moving tracks, trajectory prediction, and threat scores into one easy website.</p><p>Our aim is to make fast-changing data clear, even on a phone or a slow connection. We use only fake data in a fictional area.</p><div className="about-points"><div><b>Watch</b><p>Track many objects at the same time.</p></div><div><b>Understand</b><p>See the math and reasons behind each score.</p></div><div><b>Keep going</b><p>Use the local simulator when the server is offline.</p></div></div><a className="action-link" href="#/overview">Explore the dashboard →</a></div></section><section className="team-section" aria-labelledby="team-heading"><div className="team-heading"><p className="eyebrow">THE PEOPLE BEHIND THE BUILD</p><h3 id="team-heading">Meet our team</h3><p>Four people. One hackathon project.</p></div><div className="team-grid">{team.map(person => <article className="panel team-card" key={person.name}><div className="team-avatar" aria-hidden="true">{person.initials}</div><h4>{person.name}</h4><p className="team-role">{person.role}</p><p>{person.work}</p></article>)}</div></section><div className="notice">This is a student demo. It uses no real military data, live sensors, or drone controls.</div><div className="about-bottom"><span>Built with React, TypeScript, Tailwind CSS, and Node.js.</span><a href="#/contact">Talk to the team →</a></div></div>;
}
const repo = 'https://github.com/ayushkumar-prime/SKY-SHIELD';
export function Contact() {
  const [topic, setTopic] = useState('Question'), [subject, setSubject] = useState(''), [message, setMessage] = useState('');
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null), [status, setStatus] = useState('');
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || message.trim().length < 10) { setStatus('Add a subject and a message with at least 10 characters.'); return; }
    setDraft({ title: `[${topic}] ${subject.trim()}`, body: `Topic: ${topic}\n\n${message.trim()}` }); setStatus('Draft ready. Review it below. Nothing has been sent.');
  }
  function download() {
    if (!draft) return;
    const url = URL.createObjectURL(new Blob([`${draft.title}\n\n${draft.body}`], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = 'sky-shield-message.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Draft downloaded. You can share it with the team later.');
  }
  const edit = () => { setDraft(null); setStatus(''); };
  return <div className="contact-layout information-page"><section className="panel"><div className="panel-heading"><h3>01 / WRITE TO THE TEAM</h3><span>Questions & feedback</span></div><div className="information-body"><h3>Let’s improve this demo.</h3><p>We use GitHub for project questions and feedback. Prepare a message here, then review and post it on GitHub.</p><form className="contact-form" onSubmit={prepare}><label htmlFor="contact-topic">Topic</label><select id="contact-topic" value={topic} onChange={e => { setTopic(e.target.value); edit(); }}><option>Question</option><option>Bug report</option><option>Idea</option></select><label htmlFor="contact-subject">Subject</label><input id="contact-subject" value={subject} onChange={e => { setSubject(e.target.value); edit(); }} maxLength={100} required placeholder="What would you like to discuss?" /><label htmlFor="contact-message">Message</label><textarea id="contact-message" value={message} onChange={e => { setMessage(e.target.value); edit(); }} minLength={10} maxLength={2000} required rows={6} placeholder="Tell us about your question, bug, or idea." /><small>{message.length} / 2000 characters</small><button type="submit">Prepare message →</button></form><p className="contact-status" role="status">{status}</p>{draft && <section className="message-draft" aria-label="Message preview"><h4>{draft.title}</h4><p>{draft.body}</p><div className="draft-actions"><a className="action-link" href={`${repo}/issues/new?title=${encodeURIComponent(draft.title)}&body=${encodeURIComponent(draft.body)}`} target="_blank" rel="noreferrer">Review on GitHub ↗</a><button onClick={download}>↓ Save draft</button></div><small>GitHub opens in a new tab. You may need to sign in. You choose when to post.</small></section>}</div></section><aside className="panel contact-aside"><div className="panel-heading"><h3>02 / PROJECT LINKS</h3></div><div className="information-body"><span className="contact-symbol" aria-hidden="true">↗</span><h3>Find SKY SHIELD on GitHub</h3><p>Read the code, check known issues, or share feedback with the team.</p><a className="action-link" href={repo} target="_blank" rel="noreferrer">View repository ↗</a><a className="contact-secondary" href={`${repo}/issues`} target="_blank" rel="noreferrer">Read project issues ↗</a><hr /><h4>Who built this?</h4><p>Namit leads the team and makes the design and UI. Ayush builds the frontend. Lucky and Aniket build the backend.</p><a className="contact-secondary" href="#/about">Meet the team →</a><p className="tiny">Offline? Prepare and save a draft. Posting on GitHub needs a connection.</p></div></aside></div>;
}
