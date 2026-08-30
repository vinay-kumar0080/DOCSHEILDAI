import React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Scan, 
  FileCheck, 
  Cpu, 
  Lock, 
  Plane, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Layers, 
  ScanFace,
  Terminal,
  Activity,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  const capabilities = [
    {
      title: 'Passports & Travel Docs',
      desc: 'Full ICAO 9303 MRZ parsing, composite checksums, and optical biodata consistency.',
      icon: Shield,
      badge: 'TD1/TD2/TD3'
    },
    {
      title: 'Visa & Consular Foils',
      desc: 'Validity window checks, entry constraints, and consular security pattern inspection.',
      icon: FileCheck,
      badge: 'Consular Standard'
    },
    {
      title: 'National ID & Permits',
      desc: 'ISO/IEC 7810 ID-1 card geometry, microprint noise variance, and text alignment.',
      icon: Scan,
      badge: 'ISO/IEC 7810'
    },
    {
      title: '1:1 Biometric Face Match',
      desc: 'Compare document portrait photo with live webcam capture using facial embedding correlation.',
      icon: ScanFace,
      badge: 'Biometric Correlation'
    },
    {
      title: 'Forensic Tampering & ELA',
      desc: 'Error Level Analysis, 2D FFT spectral anomaly, and localized noise gradient splicing detection.',
      icon: Layers,
      badge: 'Multi-Signal Forensics'
    },
    {
      title: 'Explainable Risk Engine',
      desc: 'Transparent 0-100 risk score breakdown with itemized positive and negative contributing factors.',
      icon: Cpu,
      badge: 'Transparent AI'
    }
  ];

  const pipelineStages = [
    { step: '01', title: 'Capture', desc: 'High-res upload or live webcam grab' },
    { step: '02', title: 'Preprocess', desc: 'Blur & glare optical quality check' },
    { step: '03', title: 'OCR Engine', desc: 'Field-level character recognition' },
    { step: '04', title: 'MRZ Checksum', desc: 'ICAO 9303 modulo-10 mathematical validation' },
    { step: '05', title: 'Tamper Forensics', desc: 'Error Level Analysis & FFT anomaly heatmap' },
    { step: '06', title: 'Face Compare', desc: '1:1 portrait vs live selfie match' },
    { step: '07', title: 'Risk Score', desc: 'Explainable risk classification & audit report' }
  ];

  return (
    <div className="space-y-24 py-8">
      
      {/* Hero Section */}
      <section className="relative text-center space-y-8 pt-8 pb-12 overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>PRODUCTION-GRADE AI IDENTITY & DOCUMENT SCREENING</span>
        </div>

        {/* Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            AI-Powered Identity & <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Document Screening
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Analyze identity and travel documents, detect inconsistencies and potential manipulation, 
            verify identity signals, and generate explainable screening risk assessments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-glow-blue transition-all transform hover:-translate-y-0.5"
          >
            <span>Start Screening</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-blue-900/60 bg-surface/80 hover:bg-surface-elevated text-slate-300 hover:text-white text-sm font-medium transition-all"
          >
            <span>Explore How It Works</span>
          </a>
        </div>

        {/* Domain Target Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-8">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-900/40 bg-surface/60 text-left">
            <Plane className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">Airport Security</div>
              <div className="text-[11px] text-slate-400">Passenger & travel credentials</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-900/40 bg-surface/60 text-left">
            <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">Airlines</div>
              <div className="text-[11px] text-slate-400">Pre-boarding visa screening</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-900/40 bg-surface/60 text-left">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">Immigration Officers</div>
              <div className="text-[11px] text-slate-400">Border control forensics</div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Screen Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Multi-Modal Screening Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Comprehensive inspection across physical layouts, optical data, mathematical checksums, and forensic pixels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl p-6 space-y-4 glass-panel-hover group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-400 group-hover:text-cyan-300 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-600/10 text-blue-400 border border-blue-500/20">
                    {cap.badge}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-white">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section id="how-it-works" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            End-to-End AI Analysis Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Real server-side asynchronous AI pipeline executing automated forensic checks in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-xl p-4 space-y-2 relative border-blue-900/40 hover:border-blue-500/40 transition-colors"
            >
              <div className="text-xs font-mono font-bold text-blue-400">
                {stage.step}
              </div>
              <div className="text-sm font-bold text-slate-200">
                {stage.title}
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Explainable Risk Assessment Section */}
      <section className="glass-panel rounded-3xl p-8 sm:p-10 space-y-8 border-blue-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>TRANSPARENT DECISION SUPPORT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Explainable Risk Engine, <br />
              <span className="text-blue-400">Not an Opaque Black Box</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              DocShield AI never outputs arbitrary scores. Every risk evaluation is a weighted aggregation of 
              explicit, verifiable signals: mathematical checksum pass/fail, error-level splicing, 
              biometric embedding similarity, and date consistency.
            </p>
            
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deterministic ICAO 9303 modulo-10 validation</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Visual Error Level Analysis (ELA) heatmap inspection</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Downloadable official PDF forensic screening reports</span>
              </div>
            </div>
          </div>

          {/* Synthetic Risk Preview Card */}
          <div className="rounded-2xl border border-blue-900/60 bg-surface-elevated/90 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-xs font-mono text-slate-400">AI Risk Assessment Sample</div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                REVIEW RECOMMENDED
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold font-mono text-amber-400">48 <span className="text-xs text-slate-500">/ 100</span></div>
                <div className="text-[11px] text-slate-400 font-mono">Moderate Risk Signal</div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Confidence: <b>89%</b></span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Contributing Signals:</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-amber-950/30 border border-amber-500/20 text-amber-300">
                  <span>+25 Potential document manipulation (ELA anomaly)</span>
                  <span className="font-mono font-bold">+25</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                  <span>-8 Valid ICAO 9303 MRZ Checksums</span>
                  <span className="font-mono font-bold">-8</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                  <span>-5 High Image Optical Resolution</span>
                  <span className="font-mono font-bold">-5</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Ready for Operational Document Screening?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Choose your domain, upload identity credentials or capture live through camera to execute the AI screening pipeline.
        </p>
        <Link
          href="/domains"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-glow-blue transition-all"
        >
          <span>Launch Screening Terminal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </div>
  );
}
