'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Shield, 
  ScanFace, 
  Layers, 
  Cpu, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  FileText
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const guides = [
    {
      title: 'How to Perform a Screening',
      desc: 'Select a domain, enter a unique Person ID, capture documents via WebRTC camera or file upload, and review the risk assessment.',
      icon: BookOpen
    },
    {
      title: 'Understanding MRZ & ICAO 9303',
      desc: 'Learn how TD1, TD2, and TD3 machine readable zones calculate modulo-10 cyclic weighted [7, 3, 1] check digits.',
      icon: FileText
    },
    {
      title: 'Understanding Tampering Forensics',
      desc: 'How Hugging Face Vision Transformers, Error Level Analysis (ELA), and 2D-FFT detect spliced pixels and generative forgeries.',
      icon: Layers
    },
    {
      title: '1:1 Biometric Face Match',
      desc: 'YuNet deep landmark detector isolates passport photo crops while SFace 128-d vectors compare live selfies using Cosine similarity.',
      icon: ScanFace
    },
    {
      title: 'Explainable Risk Engine',
      desc: 'Transparent 0–100 risk score breakdown with itemized positive and negative contributing factor ledgers.',
      icon: Cpu
    }
  ];

  const faqs = [
    {
      q: 'Does DocShield AI make automatic legal decisions on passenger entry?',
      a: 'No. DocShield AI is strictly an AI-assisted decision-support platform for authorized security officers. Final entry or clearance decisions must always be confirmed by human officers following official regulatory procedures.'
    },
    {
      q: 'What happens if a passenger reference ID already exists?',
      a: 'The system detects the duplicate reference ID, alerts the operator, and allows either opening the previous case file or creating a dedicated new screening session.'
    },
    {
      q: 'How does Error Level Analysis (ELA) identify digital photo manipulation?',
      a: 'ELA re-saves an image at a known 90% compression rate and analyzes the error gradient matrix. Edited or spliced areas demonstrate higher compression deltas than authentic surrounding pixels.'
    },
    {
      q: 'How are sensitive document images handled?',
      a: 'All uploaded images are saved strictly in localized or encrypted storage. Data retention rules purge files according to configured shift policies (1 to 24 hours).'
    }
  ];

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      
      {/* Hero Search Header */}
      <div className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-cyan-300 text-xs font-mono">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>OFFICER KNOWLEDGE BASE</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Help & Support Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Operational guides, forensic algorithm references, and standard operating procedures.
        </p>

        <div className="max-w-md mx-auto relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, MRZ checks, error codes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-slate-800 focus:border-blue-500 text-xs text-white placeholder-slate-500 shadow-md"
          />
        </div>
      </div>

      {/* Guides Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Operational Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div key={idx} className="glass-panel rounded-2xl p-5 border-slate-800 hover:border-slate-700 space-y-3 transition-all">
                <div className="p-3 rounded-xl bg-surface border border-white/10 text-cyan-400 w-fit">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{g.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-4 border-slate-800/80 space-y-2 cursor-pointer"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between font-semibold text-xs text-white">
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
              {openFaq === idx && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-800 leading-relaxed animate-fadeIn">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Support Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-surface border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Need Command Assistance?</h3>
          <p className="text-xs text-slate-400">Our technical engineering team provides 24/7 terminal maintenance support.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="mailto:support@docshield.ai"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>

    </div>
  );
}
