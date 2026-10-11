import { Activity, ArrowRight, CheckCircle2, Clock3, ExternalLink, RadioTower, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { Icon: Clock3, title: 'Checks every minute', body: 'Catch downtime quickly with scheduled checks for your websites and HTTP APIs.' },
  { Icon: Activity, title: 'Useful incident history', body: 'See when a service went down, when it recovered, and how it has been responding.' },
  { Icon: ExternalLink, title: 'Public status pages', body: 'Share a clear service status page with the people who depend on your product.' },
];

export function HomePage() {
  return <main className="home-page">
    <header className="home-nav">
      <Link className="home-brand" to="/"><span className="brand-mark"><RadioTower size={18} /></span><span>pulseboard</span></Link>
      <nav aria-label="Main navigation">
        <a href="#features">Features</a>
        <Link to="/login">Sign in</Link>
        <Link className="home-nav-cta" to="/register">Get started <ArrowRight size={15} /></Link>
      </nav>
    </header>

    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="home-eyebrow"><span /> SIMPLE WEBSITE MONITORING</p>
        <h1>Know when your services need attention.</h1>
        <p className="home-lede">PulseBoard checks your websites and APIs, keeps incident history, and gives you a status page to share.</p>
        <div className="home-actions"><Link className="home-primary" to="/register">Create your workspace <ArrowRight size={16} /></Link><Link className="home-secondary" to="/login">Sign in</Link></div>
        <div className="home-proof"><span><CheckCircle2 size={15} /> Minute-by-minute checks</span><span><ShieldCheck size={15} /> Private monitor workspace</span></div>
      </div>

      <div className="home-preview" aria-label="Example PulseBoard dashboard preview">
        <div className="home-preview-head"><div><span className="home-preview-kicker">WORKSPACE PREVIEW</span><h2>Service overview</h2></div><span className="home-preview-sample">SAMPLE DATA</span></div>
        <div className="home-preview-summary"><div><span>Services monitored</span><strong>03</strong></div><div><span>Open incidents</span><strong>00</strong></div><div><span>Checks</span><strong>Every 60s</strong></div></div>
        <div className="home-preview-list">
          <div><span className="home-service-icon">W</span><span className="home-service-name"><strong>Website</strong><small>example.com</small></span><span className="home-service-state"><i /> Operational</span></div>
          <div><span className="home-service-icon home-service-icon-blue">A</span><span className="home-service-name"><strong>Public API</strong><small>api.example.com</small></span><span className="home-service-state"><i /> Operational</span></div>
          <div><span className="home-service-icon home-service-icon-gold">D</span><span className="home-service-name"><strong>Docs</strong><small>docs.example.com</small></span><span className="home-service-state"><i /> Operational</span></div>
        </div>
        <div className="home-preview-foot"><Activity size={15} /><span>Response time</span><div className="home-bars" aria-hidden="true">{[28, 42, 34, 55, 39, 49, 64, 45, 58, 38, 52, 72, 47, 59, 41, 66, 51, 77, 55, 69, 45, 61, 50, 75].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><small>Last 24 hours</small></div>
      </div>
    </section>

    <section className="home-features" id="features"><div className="home-section-heading"><p className="home-eyebrow">A CLEARER VIEW OF YOUR SERVICES</p><h2>The essentials, in one place.</h2><p>Know what is healthy, what needs attention, and what happened.</p></div><div className="home-feature-grid">{features.map(({ Icon, title, body }) => <article className="home-feature" key={title}><span className="home-feature-icon"><Icon size={19} /></span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section className="home-bottom-cta"><div><h2>Start monitoring your services.</h2><p>Create an account and add your first monitor in a few steps.</p></div><Link to="/register">Get started <ArrowRight size={16} /></Link></section>
    <footer className="home-footer"><Link className="home-brand" to="/"><span className="brand-mark"><RadioTower size={16} /></span><span>pulseboard</span></Link><span>Monitoring, made clear · © 2026 PulseBoard</span></footer>
  </main>;
}
