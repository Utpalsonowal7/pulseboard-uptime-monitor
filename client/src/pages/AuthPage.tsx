import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowRight, Check, Eye, EyeOff, LockKeyhole, RadioTower, ShieldCheck, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authKeys, authService } from '../services/auth';
import { errorMessage } from '../lib/api';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => isRegister ? authService.register({ name, email, password }) : authService.login({ email, password }),
    onSuccess: (user) => { client.setQueryData(authKeys.me, user); navigate('/', { replace: true }); },
  });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); mutation.mutate(); }
  return <main className="auth-screen">
    <section className="auth-aside">
      <div className="auth-brand"><span className="brand-mark"><RadioTower size={19} /></span><strong>pulseboard</strong></div>
      <div className="auth-aside-content"><span className="auth-kicker"><i /> MONITORING, MADE CLEAR</span><h1>Know what’s<br />working. <em>Always.</em></h1><p>Keep a steady eye on every service your customers rely on.</p><div className="auth-preview"><div className="auth-preview-head"><span><i /><i /><i /></span><small>YOUR WORKSPACE</small><Activity size={14} /></div><div className="auth-preview-row"><span className="preview-icon"><RadioTower size={15} /></span><div><strong>Marketing site</strong><small>https://pulseboard.app</small></div><span className="preview-live"><i />Operational</span></div><div className="auth-preview-metrics"><span><small>UPTIME · 24H</small><strong>99.98%</strong></span><span><small>AVG. RESPONSE</small><strong>184 <em>ms</em></strong></span><div className="preview-chart"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="auth-preview-foot"><span><Check size={12} /> Checks every minute</span><span><ShieldCheck size={12} /> Incident history</span></div></div></div>
      <div className="auth-aside-foot"><span>Built for the moments you’re not watching.</span><span>© 2026 PulseBoard</span></div>
    </section>
    <section className="auth-main"><div className="auth-main-top"><span className="auth-mobile-brand"><span className="brand-mark"><RadioTower size={18} /></span>pulseboard</span><span>{isRegister ? 'Already have an account?' : 'New to PulseBoard?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create account'}</Link></span></div>
      <div className="auth-form-wrap"><div className="auth-form-icon"><LockKeyhole size={18} /></div><p className="auth-step">YOUR WORKSPACE STARTS HERE</p><h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2><p className="auth-form-caption">{isRegister ? 'Set up your PulseBoard workspace in a moment.' : 'Sign in to continue monitoring your services.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <label>Your name<input autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Utpal Sonowal" /></label>}
          <label>Email address<input type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<div className="auth-password"><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 10 : 1} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRegister ? 'At least 10 characters' : 'Enter your password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {mutation.isError && <p className="auth-error">{errorMessage(mutation.error)}</p>}
          <button className="auth-submit" disabled={mutation.isPending}>{mutation.isPending ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={16} /></button>
        </form>
        <div className="auth-security-note"><ShieldCheck size={14} /><span>Your session is protected with secure, HttpOnly cookies.</span></div>
        <div className="auth-benefits"><span><Zap size={13} /> Minute-by-minute checks</span><span><Activity size={13} /> Clear incident history</span></div>
      </div>
      <div className="auth-mobile-foot">© 2026 PulseBoard · Monitoring, made clear</div>
    </section>
  </main>;
}

export function AuthLoading() {
  return <div className="auth-loading"><span className="brand-mark"><RadioTower size={19} /></span><div className="loading-ring" />Connecting to PulseBoard…</div>;
}
