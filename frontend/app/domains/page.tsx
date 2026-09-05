'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Building2, ShieldCheck, ArrowRight, Shield } from 'lucide-react';
import { DOMAIN_DETAILS, DOCUMENT_CONFIGS } from '../../lib/documentTypes';

export default function DomainSelectionPage() {
  const router = useRouter();

  const domains = [
    {
      id: 'immigration_officers',
      name: 'Immigration Officers',
      code: 'IMM-OFFICER',
      desc: 'Screen passports, visas, residence permits, work permits, travel authorizations, and national identity cards at immigration checkpoints.',
      icon: ShieldCheck,
      gradient: 'from-cyan-950/50 via-cyan-900/20 to-surface',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      glow: 'hover:shadow-glow-cyan',
      badge: 'Border Control & Customs',
      documents: DOMAIN_DETAILS.immigration_officers.documents
    },
    {
      id: 'border_security',
      name: 'Border-Security Personnel',
      code: 'BOR-SECURITY',
      desc: 'Verify cross-border travel credentials, entry visas, national IDs, residence cards, and travel permits for border control operations.',
      icon: Shield,
      gradient: 'from-emerald-950/50 via-emerald-900/20 to-surface',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      glow: 'hover:shadow-glow-cyan',
      badge: 'Border Checkpoint',
      documents: DOMAIN_DETAILS.border_security.documents
    },
    {
      id: 'airport_security',
      name: 'Airport Security Authorities',
      code: 'ASA-TERMINAL',
      desc: 'Screen passenger identity documents, boarding passes, consular visas, e-tickets, and travel authorizations at airport terminals.',
      icon: Plane,
      gradient: 'from-blue-950/50 via-blue-900/20 to-surface',
      border: 'border-blue-500/40 hover:border-blue-400',
      glow: 'hover:shadow-glow-blue',
      badge: 'Terminal Checkpoint',
      documents: DOMAIN_DETAILS.airport_security.documents
    },
    {
      id: 'immigration_departments',
      name: 'Immigration Departments',
      code: 'IMM-DEPT',
      desc: 'Comprehensive document integrity screening for visa applications, residence permits, employment authorizations, and travel dossiers.',
      icon: Building2,
      gradient: 'from-purple-950/50 via-purple-900/20 to-surface',
      border: 'border-purple-500/40 hover:border-purple-400',
      glow: 'hover:shadow-glow-purple',
      badge: 'Departmental Screening',
      documents: DOMAIN_DETAILS.immigration_departments.documents
    },
    {
      id: 'law_enforcement',
      name: 'Law-Enforcement Agencies',
      code: 'LEA-PATROL',
      desc: 'Screen national identity cards, driver licenses, international passports, residence permits, and travel documents in law enforcement operations.',
      icon: ShieldCheck,
      gradient: 'from-indigo-950/50 via-indigo-900/20 to-surface',
      border: 'border-indigo-500/40 hover:border-indigo-400',
      glow: 'hover:shadow-glow-blue',
      badge: 'Law Enforcement Command',
      documents: DOMAIN_DETAILS.law_enforcement.documents
    }
  ];

  const handleSelectDomain = (domainId: string) => {
    localStorage.setItem('docshield_domain', domainId);
    router.push(`/screening/start/${domainId}`);
  };

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-cyan-300 text-xs font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>SECURITY OPERATIONAL DOMAIN</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Select Screening Domain
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Choose your operational environment to calibrate screening rules, compliance standards, and document presets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {domains.map((dom) => {
          const Icon = dom.icon;
          return (
            <div
              key={dom.id}
              onClick={() => handleSelectDomain(dom.id)}
              className={`glass-panel rounded-3xl p-8 space-y-6 cursor-pointer bg-gradient-to-b ${dom.gradient} border ${dom.border} ${dom.glow} transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between group shadow-xl`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-4 rounded-2xl bg-surface/90 border border-white/10 text-white group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-cyan-400 group-hover:text-white" />
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                    {dom.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {dom.code}
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                    {dom.name}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {dom.desc}
                  </p>
                </div>

                {/* Supported Documents Presets */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Supported Documents ({dom.documents.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dom.documents.map((docKey: string) => {
                      const docCfg = DOCUMENT_CONFIGS[docKey];
                      return (
                        <span
                          key={docKey}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface/80 border border-white/10 text-cyan-300"
                        >
                          {docCfg?.name || docKey.replace('_', ' ')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                <span>Launch Domain Terminal</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
