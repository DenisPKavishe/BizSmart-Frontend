'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Syne, DM_Sans } from 'next/font/google';
import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Fonts (module-level, Next.js optimised) ─────────────────────────────────
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Module {
  name: string;
  icon: string;
  description: string;
  features: string[];
  href: string;
  accent: string;
  glyph: string;
}
interface Feature { icon: string; title: string; description: string; }
interface Stat { value: string; suffix: string; label: string; icon: string; }

// ─── Data ─────────────────────────────────────────────────────────────────────
const MODULES: Module[] = [
  { name: 'Point of Sale',       icon: '⊡', glyph: '01', description: 'Fast, intuitive checkout built for speed. Accept any payment, print receipts, close shifts.',           accent: '#0EA5E9', href: '/sales/pos',             features: ['Quick checkout', 'Multi-payment', 'Receipt printing'] },
  { name: 'Sales Management',    icon: '◈', glyph: '02', description: 'Track every deal, manage customers and automate returns from one command centre.',                       accent: '#06B6D4', href: '/sales/history',         features: ['Sales history', 'Customer CRM', 'Return processing'] },
  { name: 'Inventory Control',   icon: '▣', glyph: '03', description: 'Real-time stock visibility across every location. Never oversell, never run dry.',                       accent: '#3B82F6', href: '/inventory/products',    features: ['Live tracking', 'Low-stock alerts', 'Purchase orders'] },
  { name: 'Financial Suite',     icon: '◉', glyph: '04', description: 'Full-cycle financial control — invoices, expenses and reports that close themselves.',                   accent: '#8B5CF6', href: '/financials/transactions',features: ['Transactions', 'Invoice engine', 'P&L reports'] },
  { name: 'HR & Payroll',        icon: '◎', glyph: '05', description: 'From onboarding to payslip in one platform. Automate salaries, leave and compliance.',                  accent: '#EC4899', href: '/hr/employees',          features: ['Employee records', 'Salary mgmt', 'Payroll engine'] },
  { name: 'Business Intel',      icon: '◆', glyph: '06', description: 'Live dashboards that turn raw numbers into decisions. Drill down on any metric.',                       accent: '#10B981', href: '/analytics',             features: ['Live dashboards', 'Sales analytics', 'KPI tracking'] },
];

const FEATURES: Feature[] = [
  { icon: '⚡', title: 'Sub-second response',  description: 'Every action feels instant — no spinners, no lag.' },
  { icon: '🔒', title: 'Bank-grade security',  description: 'AES-256 encryption with role-based access controls.' },
  { icon: '☁',  title: 'Cloud-native',         description: 'Access your entire business from any device, anywhere.' },
  { icon: '↗',  title: 'Built to scale',       description: 'From one store to a thousand — the platform grows with you.' },
];

const STATS: Stat[] = [
  { value: '98',   suffix: '%',  label: 'Satisfaction score', icon: '★' },
  { value: '50',   suffix: 'K+', label: 'Active users',       icon: '◉' },
  { value: '1',    suffix: 'M+', label: 'Transactions/month', icon: '⚡' },
  { value: '99.9', suffix: '%',  label: 'Uptime SLA',         icon: '☁' },
];

const MARQUEE_ITEMS = [
  'Point of Sale','Inventory Control','HR & Payroll','Financial Suite',
  'Sales Analytics','Business Intel','Live Dashboards','Cloud-Native','Enterprise Security',
];

// ─── CSS (static string — no dynamic expressions, avoids hydration mismatch) ──
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --white:  #FFFFFF;
    --off:    #F8FAFC;
    --soft:   #F1F5F9;
    --card:   #FFFFFF;
    --b1:     rgba(0,0,0,0.07);
    --b2:     rgba(0,0,0,0.13);
    --ocean:  #0077C0;
    --teal:   #00A896;
    --sky:    #0EA5E9;
    --navy:   #003366;
    --text:   #0F172A;
    --muted:  #64748B;
    --light:  #94A3B8;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--white); color: var(--text); font-size: 16px; line-height: 1.7; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--soft); }
  ::-webkit-scrollbar-thumb { background: var(--ocean); border-radius: 2px; }

  /* NAV */
  .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 clamp(1.5rem,5vw,4rem); transition: background .4s, border-color .4s, box-shadow .4s; border-bottom: 1px solid transparent; background: rgba(255,255,255,0); }
  .nav.scrolled { background: rgba(255,255,255,.92); backdrop-filter: blur(20px); border-color: var(--b1); box-shadow: 0 1px 24px rgba(0,0,0,.06); }
  .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 72px; }
  .nav-logo { font-weight: 800; font-size: 1.4rem; background: linear-gradient(135deg,var(--navy) 30%,var(--sky)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none; letter-spacing: -.02em; }
  .nav-logo span { display: block; font-size: .6rem; font-weight: 400; -webkit-text-fill-color: var(--light); letter-spacing: .12em; text-transform: uppercase; }
  .nav-links { display: flex; align-items: center; gap: 2.5rem; }
  .nav-links a { color: var(--muted); font-size: .875rem; font-weight: 500; text-decoration: none; letter-spacing: .02em; transition: color .2s; position: relative; }
  .nav-links a::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--ocean); transition: width .3s; }
  .nav-links a:hover { color: var(--text); }
  .nav-links a:hover::after { width: 100%; }
  .nav-cta { padding: .5rem 1.4rem; background: var(--navy); border: none; border-radius: 6px; color: #fff !important; font-size: .875rem !important; transition: background .3s, transform .2s !important; }
  .nav-cta::after { display: none !important; }
  .nav-cta:hover { background: var(--ocean) !important; color: #fff !important; transform: translateY(-1px); }
  .nav-hamburger { display: none; cursor: pointer; flex-direction: column; gap: 5px; background: none; border: none; padding: 4px; }
  .nav-hamburger span { display: block; width: 22px; height: 1.5px; background: var(--text); transition: all .3s; }
  .mobile-menu { display: none; flex-direction: column; background: rgba(255,255,255,.98); border-top: 1px solid var(--b1); backdrop-filter: blur(20px); }
  .mobile-menu.open { display: flex; }
  .mobile-menu a { padding: 1rem clamp(1.5rem,5vw,4rem); color: var(--muted); text-decoration: none; font-size: .9rem; border-bottom: 1px solid var(--b1); transition: color .2s, background .2s; }
  .mobile-menu a:hover { color: var(--text); background: var(--soft); }
  @media (max-width: 680px) { .nav-links { display: none; } .nav-hamburger { display: flex; } }

  /* HERO */
  .hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 140px clamp(1.5rem,5vw,4rem) 80px; position: relative; overflow: hidden; background: linear-gradient(160deg, #f0f7ff 0%, #ffffff 50%, #f0fdf8 100%); }
  .hero-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; transition: transform .1s ease-out; }
  .orb-a { width: 600px; height: 600px; background: radial-gradient(circle,rgba(0,119,192,.12),transparent 70%); top: -100px; right: -100px; }
  .orb-b { width: 500px; height: 500px; background: radial-gradient(circle,rgba(0,168,150,.1),transparent 70%); bottom: 0; left: -100px; }
  .orb-c { width: 300px; height: 300px; background: radial-gradient(circle,rgba(14,165,233,.08),transparent 70%); top: 40%; left: 40%; }
  .hero-grid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%); }
  .hero-content { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; position: relative; z-index: 2; }
  .hero-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,119,192,.08); border: 1px solid rgba(0,119,192,.2); border-radius: 100px; padding: 6px 16px; font-size: .78rem; font-weight: 500; color: var(--ocean); letter-spacing: .04em; margin-bottom: 2rem; animation: fadeUp .7s ease both; }
  .hero-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ocean); animation: pulse-dot 2s infinite; }
  @keyframes pulse-dot { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.4; transform:scale(.6); } }
  .hero-headline { font-weight: 800; font-size: clamp(2.6rem,6vw,4.5rem); line-height: 1.05; letter-spacing: -.03em; margin-bottom: 1.5rem; color: var(--text); animation: fadeUp .7s .1s ease both; }
  .hero-headline em { font-style: normal; background: linear-gradient(135deg,var(--ocean) 0%,var(--teal) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .hero-sub { font-size: 1.1rem; color: var(--muted); max-width: 480px; margin-bottom: 2.5rem; animation: fadeUp .7s .2s ease both; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 1rem; animation: fadeUp .7s .3s ease both; }
  .btn-primary { padding: .8rem 2rem; border-radius: 8px; border: none; background: linear-gradient(135deg,var(--navy),var(--ocean)); color: #fff; font-size: .95rem; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; position: relative; overflow: hidden; transition: transform .2s, box-shadow .2s; }
  .btn-primary::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(255,255,255,.15),transparent); opacity: 0; transition: opacity .2s; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,51,102,.25); }
  .btn-primary:hover::before { opacity: 1; }
  .btn-secondary { padding: .8rem 2rem; border-radius: 8px; background: transparent; border: 1.5px solid var(--b2); color: var(--text); font-size: .95rem; font-weight: 400; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: border-color .2s, background .2s, transform .2s; }
  .btn-secondary:hover { border-color: var(--ocean); color: var(--ocean); background: rgba(0,119,192,.04); transform: translateY(-1px); }
  .btn-arrow { transition: transform .2s; }
  .btn-primary:hover .btn-arrow, .btn-secondary:hover .btn-arrow { transform: translateX(3px); }

  /* HERO VISUAL */
  .hero-visual { position: relative; animation: fadeUp .9s .3s ease both; }
  .hero-visual-inner { background: rgba(255,255,255,.8); border: 1px solid var(--b1); border-radius: 20px; padding: 2rem; backdrop-filter: blur(12px); position: relative; box-shadow: 0 4px 40px rgba(0,0,0,.08); }
  .hero-visual-inner::before { content: ''; position: absolute; inset: -1px; border-radius: 20px; background: linear-gradient(135deg,rgba(0,119,192,.08),transparent 50%,rgba(0,168,150,.06)); z-index: -1; }
  .mini-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  .mini-card { background: var(--white); border: 1px solid var(--b1); border-radius: 12px; padding: 1rem; text-align: center; transition: border-color .3s, transform .3s, box-shadow .3s; cursor: default; box-shadow: 0 1px 4px rgba(0,0,0,.04); }
  .mini-card:hover { border-color: var(--b2); box-shadow: 0 4px 16px rgba(0,0,0,.1); transform: translateY(-3px); }
  .mini-card-icon { font-size: 1.5rem; margin-bottom: 6px; display: block; }
  .mini-card-label { font-size: .72rem; color: var(--muted); font-weight: 500; line-height: 1.3; }
  .hero-live-badge { display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem; font-size: .75rem; color: var(--muted); }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 0 0 rgba(16,185,129,.6); animation: live-pulse 2s infinite; }
  @keyframes live-pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,.5); } 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

  /* STATS */
  .stats-section { padding: 5rem clamp(1.5rem,5vw,4rem); background: var(--soft); border-top: 1px solid var(--b1); border-bottom: 1px solid var(--b1); }
  .stats-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 2rem; }
  .stat-card { text-align: center; padding: 2rem 1rem; position: relative; }
  .stat-card::after { content: ''; position: absolute; right: 0; top: 20%; bottom: 20%; width: 1px; background: var(--b1); }
  .stat-card:last-child::after { display: none; }
  .stat-icon { display: block; font-size: 1.2rem; color: var(--ocean); margin-bottom: .75rem; }
  .stat-value { font-weight: 800; font-size: clamp(2rem,4vw,3rem); line-height: 1; color: var(--navy); margin-bottom: .5rem; }
  .stat-suffix { color: var(--ocean); }
  .stat-label { font-size: .82rem; color: var(--muted); letter-spacing: .02em; }

  /* SECTION */
  .section { padding: 6rem clamp(1.5rem,5vw,4rem); max-width: 1200px; margin: 0 auto; }
  .section-tag { display: inline-block; font-size: .72rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ocean); margin-bottom: 1rem; padding: 4px 12px; border: 1px solid rgba(0,119,192,.2); border-radius: 4px; background: rgba(0,119,192,.06); }
  .section-heading { font-weight: 800; font-size: clamp(2rem,4vw,3rem); line-height: 1.1; letter-spacing: -.03em; margin-bottom: 1.25rem; color: var(--text); }
  .section-heading em { font-style: normal; background: linear-gradient(135deg,var(--ocean),var(--teal)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .section-sub { font-size: 1.05rem; color: var(--muted); max-width: 520px; margin-bottom: 3.5rem; }

  /* MODULES */
  .modules-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: var(--b1); border: 1px solid var(--b1); border-radius: 16px; overflow: hidden; }
  .module-card { position: relative; background: var(--white); padding: 2rem; opacity: 0; transform: translateY(20px); transition: opacity .6s var(--delay,0ms) ease, transform .6s var(--delay,0ms) ease, background .3s, box-shadow .3s; overflow: hidden; cursor: default; }
  .module-card.revealed { opacity: 1; transform: translateY(0); }
  .module-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%,var(--accent,var(--sky)) 0%,transparent 60%); opacity: 0; transition: opacity .4s; }
  .module-card:hover { background: var(--off); box-shadow: inset 0 0 0 1px rgba(0,0,0,.06); }
  .module-card:hover::before { opacity: .04; }
  .module-glyph { position: absolute; top: 1.5rem; right: 1.5rem; font-weight: 700; font-size: .7rem; color: rgba(0,0,0,.08); letter-spacing: .05em; }
  .module-icon-wrap { width: 48px; height: 48px; border-radius: 12px; border: 1px solid var(--b1); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; background: var(--soft); transition: border-color .3s, transform .3s, box-shadow .3s; }
  .module-card:hover .module-icon-wrap { border-color: var(--accent,var(--ocean)); transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  .module-icon { font-size: 1.3rem; color: var(--accent,var(--ocean)); }
  .module-name { font-weight: 700; font-size: 1rem; margin-bottom: .6rem; color: var(--text); }
  .module-desc { font-size: .85rem; color: var(--muted); line-height: 1.6; margin-bottom: 1.25rem; }
  .module-features { list-style: none; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 6px; }
  .module-features li { display: flex; align-items: center; gap: 8px; font-size: .8rem; color: var(--muted); }
  .check { color: var(--accent,var(--teal)); font-size: .75rem; font-weight: 700; flex-shrink: 0; }
  .module-cta { display: inline-flex; align-items: center; gap: 6px; font-size: .82rem; font-weight: 600; color: var(--accent,var(--ocean)); text-decoration: none; opacity: .6; transition: opacity .2s; }
  .module-card:hover .module-cta { opacity: 1; }
  .module-card:hover .cta-arrow { transform: translateX(3px); }
  .cta-arrow { transition: transform .2s; }

  /* FEATURES */
  .features-wrap { display: grid; grid-template-columns: repeat(2,1fr); gap: 1px; background: var(--b1); border: 1px solid var(--b1); border-radius: 16px; overflow: hidden; }
  .feature-item { background: var(--white); padding: 2.5rem; display: flex; gap: 1.5rem; transition: background .3s; }
  .feature-item:hover { background: var(--off); }
  .feature-icon-box { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg,rgba(0,119,192,.1),rgba(0,168,150,.08)); border: 1px solid rgba(0,119,192,.15); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
  .feature-title { font-weight: 700; font-size: 1rem; margin-bottom: .5rem; color: var(--text); }
  .feature-desc { font-size: .87rem; color: var(--muted); line-height: 1.6; }

  /* MARQUEE */
  .marquee-section { padding: 2rem 0; border-top: 1px solid var(--b1); border-bottom: 1px solid var(--b1); overflow: hidden; position: relative; background: var(--white); }
  .marquee-section::before, .marquee-section::after { content: ''; position: absolute; top: 0; bottom: 0; z-index: 2; width: 120px; }
  .marquee-section::before { left: 0; background: linear-gradient(90deg,var(--white),transparent); }
  .marquee-section::after  { right: 0; background: linear-gradient(-90deg,var(--white),transparent); }
  .marquee-track { display: flex; width: max-content; animation: marquee 28s linear infinite; }
  .marquee-track:hover { animation-play-state: paused; }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee-item { padding: .5rem 2.5rem; display: flex; align-items: center; gap: 10px; font-size: .8rem; font-weight: 500; color: var(--light); white-space: nowrap; flex-shrink: 0; }
  .marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ocean); opacity: .4; }

  /* CTA */
  .cta-section { padding: 4rem clamp(1.5rem,5vw,4rem) 6rem; background: var(--white); }
  .cta-inner { max-width: 1200px; margin: 0 auto; background: linear-gradient(135deg,var(--navy) 0%,#004d99 60%,#006bb3 100%); border-radius: 24px; padding: clamp(3rem,6vw,5rem) clamp(2rem,6vw,5rem); text-align: center; position: relative; overflow: hidden; box-shadow: 0 20px 60px rgba(0,51,102,.2); }
  .cta-inner::before { content: ''; position: absolute; inset: 0; border-radius: 24px; background: radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,255,255,.06),transparent); pointer-events: none; }
  .cta-lines { position: absolute; inset: 0; pointer-events: none; overflow: hidden; border-radius: 24px; }
  .cta-line { position: absolute; background: rgba(255,255,255,.06); }
  .cta-line-h { height: 1px; left: 0; right: 0; }
  .cta-line-v { width: 1px; top: 0; bottom: 0; }
  .cta-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); border-radius: 100px; padding: 6px 18px; font-size: .78rem; font-weight: 600; color: rgba(255,255,255,.9); letter-spacing: .04em; margin-bottom: 1.5rem; }
  .cta-heading { font-weight: 800; font-size: clamp(2rem,4vw,3rem); line-height: 1.1; letter-spacing: -.03em; margin-bottom: 1rem; color: #fff; }
  .cta-sub { font-size: 1.05rem; color: rgba(255,255,255,.75); margin-bottom: 2.5rem; }
  .cta-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
  .cta-section .btn-primary { background: #fff; color: var(--navy); box-shadow: none; }
  .cta-section .btn-primary:hover { background: #f0f7ff; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
  .cta-section .btn-secondary { border-color: rgba(255,255,255,.3); color: #fff; }
  .cta-section .btn-secondary:hover { border-color: rgba(255,255,255,.6); background: rgba(255,255,255,.08); color: #fff; }

  /* FOOTER */
  .footer { border-top: 1px solid var(--b1); padding: 3rem clamp(1.5rem,5vw,4rem) 2rem; background: var(--off); }
  .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 2.5rem; }
  .footer-brand-name { font-weight: 800; font-size: 1.2rem; color: var(--navy); display: block; margin-bottom: .35rem; }
  .footer-brand-sub { font-size: .75rem; color: var(--light); text-transform: uppercase; letter-spacing: .1em; display: block; margin-bottom: 1rem; }
  .footer-desc { font-size: .82rem; color: var(--muted); line-height: 1.7; }
  .footer-col-title { font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ocean); margin-bottom: 1rem; }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: .6rem; }
  .footer-col ul a { font-size: .85rem; color: var(--muted); text-decoration: none; transition: color .2s; }
  .footer-col ul a:hover { color: var(--text); }
  .footer-bottom { max-width: 1200px; margin: 2.5rem auto 0; padding-top: 1.5rem; border-top: 1px solid var(--b1); display: flex; align-items: center; justify-content: space-between; font-size: .8rem; color: var(--light); }
  .footer-bottom-links { display: flex; gap: 1.5rem; }
  .footer-bottom-links a { color: var(--light); text-decoration: none; transition: color .2s; }
  .footer-bottom-links a:hover { color: var(--text); }

  /* ANIMATIONS */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease; }
  .fade-up.in { opacity: 1; transform: translateY(0); }

  /* RESPONSIVE */
  @media (max-width: 960px) {
    .hero-content { grid-template-columns: 1fr; }
    .hero-visual { display: none; }
    .stats-inner { grid-template-columns: repeat(2,1fr); }
    .stat-card::after { display: none; }
    .modules-grid { grid-template-columns: repeat(2,1fr); }
    .footer-inner { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .modules-grid { grid-template-columns: 1fr; }
    .features-wrap { grid-template-columns: 1fr; }
    .stats-inner { grid-template-columns: repeat(2,1fr); }
    .footer-inner { grid-template-columns: 1fr; }
    .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
  }
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, decimals: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1800, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, decimals]);
  return count;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function AnimatedStat({ stat, active }: { stat: Stat; active: boolean }) {
  const dotPos = stat.value.indexOf('.');
  const decimals = dotPos >= 0 ? stat.value.length - dotPos - 1 : 0;
  const count = useCounter(parseFloat(stat.value), decimals, active);
  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toString();
  return (
    <div className="stat-card">
      <span className="stat-icon">{stat.icon}</span>
      <div className="stat-value">{display}<span className="stat-suffix">{stat.suffix}</span></div>
      <p className="stat-label">{stat.label}</p>
    </div>
  );
}

function ModuleCard({ mod, index }: { mod: Module; index: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`module-card${inView ? ' revealed' : ''}`}
      style={{ '--delay': `${index * 80}ms`, '--accent': mod.accent } as React.CSSProperties}
    >
      <div className="module-glyph">{mod.glyph}</div>
      <div className="module-icon-wrap"><span className="module-icon">{mod.icon}</span></div>
      <h3 className="module-name">{mod.name}</h3>
      <p className="module-desc">{mod.description}</p>
      <ul className="module-features">
        {mod.features.map(f => (
          <li key={f}><span className="check">✓</span>{f}</li>
        ))}
      </ul>
      <Link href={mod.href} className="module-cta">Explore <span className="cta-arrow">→</span></Link>
    </div>
  );
}

function FadeSection({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView(0.2);
  return <div ref={ref} className={`fade-up${inView ? ' in' : ''}`}>{children}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [mousePos, setMousePos]   = useState({ x: 50, y: 50 });
  const statsSection              = useInView(0.3);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
  }, []);

  return (
    <div className={`${syne.variable} ${dmSans.variable}`}
      style={{ fontFamily: 'var(--font-body)' }}>

      {/* Inject CSS once, server + client identical */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="noise" aria-hidden />

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo" style={{ fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image
              src="/images/BizsmartLogo2.png"
              alt="BizSmart Logo"
              width={38}
              height={38}
              style={{ objectFit: 'contain', flexShrink: 0 }}
              priority
            />
            <div>
              BizSmart
              <span>Business Intelligence</span>
            </div>
          </Link>
          <div className="nav-links">
            <Link href="#modules">Modules</Link>
            <Link href="#features">Features</Link>
            <Link href="/login" className="nav-cta">Login</Link>
          </div>
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(6.5px)' : undefined }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-6.5px)' : undefined }} />
          </button>
        </div>
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          <Link href="#modules" onClick={() => setMenuOpen(false)}>Modules</Link>
          <Link href="#features" onClick={() => setMenuOpen(false)}>Features</Link>
          <Link href="/login"    onClick={() => setMenuOpen(false)}>Login</Link>
          <Link href="/register" onClick={() => setMenuOpen(false)}>Start free trial →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" onMouseMove={onMouseMove}>
        <div className="hero-orb orb-a" style={{ transform: `translate(${(mousePos.x-50)*-0.04}px,${(mousePos.y-50)*-0.04}px)` }} />
        <div className="hero-orb orb-b" style={{ transform: `translate(${(mousePos.x-50)*0.03}px,${(mousePos.y-50)*0.03}px)` }} />
        <div className="hero-orb orb-c" />
        <div className="hero-grid" aria-hidden />

        <div className="hero-content">
          <div>
            <div className="hero-pill">
              <span className="hero-pill-dot" />
              All-in-one business platform
            </div>
            <h1 className="hero-headline" style={{ fontFamily: 'var(--font-display)' }}>
              Manage your<br />business <em>smarter</em><br />than ever before
            </h1>
            <p className="hero-sub">
              One unified platform for sales, inventory, finance, HR and analytics.
              Built for businesses that refuse to slow down.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="btn-primary">Start free trial <span className="btn-arrow">→</span></Link>
              <Link href="#modules"  className="btn-secondary">Explore modules <span className="btn-arrow">↓</span></Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-inner">
              <div className="hero-live-badge"><span className="live-dot" />Live dashboard · updated just now</div>
              <div className="mini-grid">
                {MODULES.map(mod => (
                  <div className="mini-card" key={mod.name}>
                    <span className="mini-card-icon" style={{ color: mod.accent }}>{mod.icon}</span>
                    <span className="mini-card-label">{mod.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section" aria-hidden>
        <div className="marquee-track">
          {[...Array(2)].flatMap((_, ri) =>
            MARQUEE_ITEMS.map((label, i) => (
              <span className="marquee-item" key={`${ri}-${i}`}>
                <span className="marquee-dot" />{label}
              </span>
            ))
          )}
        </div>
      </div>

      {/* STATS */}
      <section className="stats-section">
        <div ref={statsSection.ref} className="stats-inner">
          {STATS.map(s => <AnimatedStat key={s.label} stat={s} active={statsSection.inView} />)}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules">
        <div className="section">
          <FadeSection>
            <div className="section-tag">Platform modules</div>
            <h2 className="section-heading" style={{ fontFamily: 'var(--font-display)' }}>
              Everything your<br /><em>business needs</em>
            </h2>
            <p className="section-sub">Six powerful modules, one seamless experience. Swap between them instantly — no page reloads, no friction.</p>
          </FadeSection>
          <div className="modules-grid">
            {MODULES.map((mod, i) => <ModuleCard key={mod.name} mod={mod} index={i} />)}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="section">
          <FadeSection>
            <div className="section-tag">Why BizSmart?</div>
            <h2 className="section-heading" style={{ fontFamily: 'var(--font-display)' }}>
              Built for the<br /><em>way you work</em>
            </h2>
            <p className="section-sub">Modern infrastructure under the hood. Intuitive experience on top.</p>
          </FadeSection>
          <div className="features-wrap">
            {FEATURES.map(f => (
              <div className="feature-item" key={f.title}>
                <div className="feature-icon-box">{f.icon}</div>
                <div>
                  <h3 className="feature-title" style={{ fontFamily: 'var(--font-display)' }}>{f.title}</h3>
                  <p className="feature-desc">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-lines" aria-hidden>
            <div className="cta-line cta-line-h" style={{ top: '33%' }} />
            <div className="cta-line cta-line-h" style={{ top: '66%' }} />
            <div className="cta-line cta-line-v" style={{ left: '25%' }} />
            <div className="cta-line cta-line-v" style={{ left: '75%' }} />
          </div>
          <div className="cta-badge">🚀 Join thousands of growing businesses</div>
          <h2 className="cta-heading" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to transform<br />your business?
          </h2>
          <p className="cta-sub">Start your free trial today. No credit card required. Cancel any time.</p>
          <div className="cta-actions">
            <Link href="/register" className="btn-primary">Start free trial <span className="btn-arrow">→</span></Link>
            <Link href="/login"    className="btn-secondary">Sign in to your account</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '.35rem' }}>
              <Image
                src="/images/BizsmartLogo2.png"
                alt="BizSmart Logo"
                width={32}
                height={32}
                style={{ objectFit: 'contain', flexShrink: 0 }}
              />
              <span className="footer-brand-name" style={{ fontFamily: 'var(--font-display)', marginBottom: 0 }}>BizSmart</span>
            </div>
            <span className="footer-brand-sub">Business Intelligence</span>
            <p className="footer-desc">The all-in-one platform that helps ambitious businesses manage every operation from a single, unified workspace.</p>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Product</p>
            <ul>
              <li><Link href="#modules">Modules</Link></li>
              <li><Link href="#features">Features</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Company</p>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Legal</p>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 BizSmart. All rights reserved.</span>
          <div className="footer-bottom-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}