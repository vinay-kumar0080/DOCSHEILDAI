'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Plane, 
  Building2, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Search,
  RotateCcw,
  FileText,
  Scan
} from 'lucide-react';
import { api } from '../../lib/api';
import { AnalyticsData, ScreeningDetail } from '../../types';
import { DOMAIN_DETAILS } from '../../lib/documentTypes';

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Officer');
  const [greeting, setGreeting] = useState<string>('Good morning');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentScans, setRecentScans] = useState<ScreeningDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Determine greeting by current hour
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // 2. Load user profile name
    const savedUser = localStorage.getItem('docshield_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.full_name) setUserName(u.full_name);
      } catch {}
    }

    // 3. Load DB metrics & recent screenings
    Promise.all([
      api.getAnalytics().catch(() => null),
      api.listScreenings({ limit: 5 }).catch(() => [])
    ]).then(([analyticsData, screeningsData]) => {
      if (analyticsData) setAnalytics(analyticsData);
      if (screeningsData) setRecentScans(screeningsData);
      setLoading(false);
    });
  }, []);

  const domains = [
    {
      id: 'immigration_officers',
      name: 'Immigration Officers',
      code: 'IMM-OFFICER',
      desc: 'Screen passports, visas, residence permits, work permits, and national ID cards.',
      icon: ShieldCheck,
      badge: 'Border Control & Customs',
      gradient: 'from-cyan-950/40 via-cyan-900/20 to-surface',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      glow: 'hover:shadow-glow-cyan',
      iconColor: 'text-cyan-400',
      href: '/screening/start/immigration_officers'
    },
    {
      id: 'border_security',
      name: 'Border-Security Personnel',
      code: 'BOR-SECURITY',
      desc: 'Verify cross-border travel credentials, visas, national IDs, and border permits.',
      icon: Shield,
      badge: 'Border Checkpoint',
      gradient: 'from-emerald-950/40 via-emerald-900/20 to-surface',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      glow: 'hover:shadow-glow-cyan',
      iconColor: 'text-emerald-400',
      href: '/screening/start/border_security'
    },
    {
      id: 'airport_security',
      name: 'Airport Security Authorities',
      code: 'ASA-TERMINAL',
      desc: 'Screen passenger identity documents, boarding passes, visas, and e-tickets.',
      icon: Plane,
      badge: 'Terminal Checkpoint',
      gradient: 'from-blue-950/40 via-blue-900/20 to-surface',
      border: 'border-blue-500/40 hover:border-blue-400',
      glow: 'hover:shadow-glow-blue',
      iconColor: 'text-blue-400',
      href: '/screening/start/airport_security'
    },
    {
      id: 'immigration_departments',
      name: 'Immigration Departments',
      code: 'IMM-DEPT',
      desc: 'Screen visa applications, residence permits, work authorizations, and dossiers.',
      icon: Building2,
      badge: 'Departmental Screening',
      gradient: 'from-purple-950/40 via-purple-900/20 to-surface',
      border: 'border-purple-500/40 hover:border-purple-400',
      glow: 'hover:shadow-glow-purple',
      iconColor: 'text-purple-400',
      href: '/screening/start/immigration_departments'
    },
    {
      id: 'law_enforcement',
      name: 'Law-Enforcement Agencies',
      code: 'LEA-PATROL',
      desc: 'Screen national IDs, driving licences, passports, and travel credentials.',
      icon: ShieldCheck,
      badge: 'Law Enforcement Command',
      gradient: 'from-indigo-950/40 via-indigo-900/20 to-surface',
      border: 'border-indigo-500/40 hover:border-indigo-400',
      glow: 'hover:shadow-glow-blue',
      iconColor: 'text-indigo-400',
      href: '/screening/start/law_enforcement'
    }
  ];

  return (
    <div className="space-y-10 py-4">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-900/30 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-cyan-300 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>TERMINAL ACTIVE &bull; LEVEL 4 CLEARANCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">{userName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Select a screening domain to begin identity and document verification.
          </p>
        </div>

        <Link
          href="/domains"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-glow-blue transition-all self-start sm:self-auto"
        >
          <Scan className="w-4 h-4" />
          <span>Launch Screening</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 space-y-2 border-blue-500/30">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL SCREENINGS</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {analytics ? analytics.total_screenings : '...'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            All registered subjects
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TODAY'S SCREENINGS</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {analytics ? analytics.screenings_today : '...'}
          </div>
          <div className="text-[11px] text-cyan-300/80 font-mono">
            Processed in current shift
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border-rose-500/30">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>HIGH RISK DETECTED</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-rose-300">
            {analytics ? analytics.risk_distribution.high_risk : '...'}
          </div>
          <div className="text-[11px] text-rose-400/80 font-mono">
            Flagged for inspection
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-2 border-amber-500/30">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PENDING REVIEW</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-300">
            {analytics ? analytics.risk_distribution.review_recommended : '...'}
          </div>
          <div className="text-[11px] text-amber-400/80 font-mono">
            Secondary check required
          </div>
        </div>
      </div>

      {/* SCREENING DOMAINS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Operational Screening Domains</span>
            </h2>
            <p className="text-xs text-slate-400">Choose your operational environment to calibrate screening rules and presets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {domains.map((dom) => {
            const Icon = dom.icon;
            return (
              <Link
                key={dom.id}
                href={dom.href}
                className={`glass-panel rounded-3xl p-6 space-y-4 bg-gradient-to-b ${dom.gradient} border ${dom.border} ${dom.glow} transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group cursor-pointer`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl bg-surface/90 border border-white/10 ${dom.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                      {dom.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {dom.code}
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {dom.name}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dom.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span>Start Person Screening</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Scans Quick Table */}
      <div className="space-y-4 pt-4 border-t border-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Recent Screening Operations</h2>
          </div>
          <Link href="/reports" className="text-xs text-blue-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
            <span>View All Scans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border-slate-800 text-slate-400 text-xs">
            No recent screening sessions logged yet.
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-3.5">Screening Subject</th>
                    <th className="p-3.5">Domain</th>
                    <th className="p-3.5">Document</th>
                    <th className="p-3.5">Risk Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {recentScans.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 font-bold text-white font-sans">
                        <span className="text-cyan-300 font-bold">{s.person_name || 'Screening Subject'}</span>
                        <div className="text-[10px] font-mono text-slate-400">Ref: DS-{s.id.substring(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="p-3.5 capitalize font-sans">{s.domain.replace('_', ' ')}</td>
                      <td className="p-3.5 capitalize font-sans">{s.document_type.replace('_', ' ')}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.risk_level === 'LOW_RISK'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : s.risk_level === 'HIGH_RISK'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {Math.round(s.risk_score)}/100
                        </span>
                      </td>
                      <td className="p-3.5 capitalize font-sans text-slate-400">{s.status}</td>
                      <td className="p-3.5 text-right font-sans">
                        <Link
                          href={`/screening/${s.id}/result`}
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-cyan-300 font-semibold"
                        >
                          <span>Dossier</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
