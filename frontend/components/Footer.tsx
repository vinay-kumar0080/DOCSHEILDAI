import React from 'react';
import { Shield, AlertTriangle, Cpu, Lock, CheckCircle2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-blue-900/30 bg-surface/80 backdrop-blur-md mt-auto text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Important Disclaimer Banner */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-300 text-xs uppercase tracking-wider font-mono">
              Mandatory AI Screening Operational Notice
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              DocShield AI outputs are probabilistic decision-support signals designed to assist authorized personnel. 
              The system <b>does not make definitive legal determinations of authenticity</b>. 
              Final verification and admission decisions must be conducted by certified officers in accordance with official procedures.
            </p>
          </div>
        </div>

        {/* Bottom Technical Grid */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 text-[11px]">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>DocShield AI &copy; {new Date().getFullYear()} — Enterprise Identity Screening Platform</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> ICAO 9303 Checksums
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> ELA & Spectral Forensics
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Explainable Risk
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
