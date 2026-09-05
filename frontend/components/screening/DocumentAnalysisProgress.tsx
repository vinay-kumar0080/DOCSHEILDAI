import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, Sparkles, Scan, FileText } from 'lucide-react';

interface DocumentAnalysisProgressProps {
  currentStage: string;
}

const STAGES = [
  { id: 'quality', label: 'Image Quality Gate & Resolution' },
  { id: 'classification', label: 'Document Classification (Expected vs Detected)' },
  { id: 'ocr', label: 'Multi-Pass OCR & Token Extraction' },
  { id: 'mrz', label: 'ICAO 9303 MRZ Checksum Verification' },
  { id: 'tampering', label: 'Forensic ELA, FFT & Wavelet Analysis' },
  { id: 'face', label: 'Document Portrait Crop Localization' }
];

export const DocumentAnalysisProgress: React.FC<DocumentAnalysisProgressProps> = ({ currentStage }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border-blue-900/40 bg-slate-900/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            AI Multi-Modal Forensic Pipeline Active
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse">
          INSPECTING CREDENTIAL
        </span>
      </div>

      <div className="space-y-2.5">
        {STAGES.map((s, idx) => {
          const isDone = true; // In progress simulation
          return (
            <div
              key={s.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-900/60 border border-blue-500/40 text-[10px] font-mono text-blue-300 flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-medium text-slate-200">{s.label}</span>
              </div>
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
