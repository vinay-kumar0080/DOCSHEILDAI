import React from 'react';
import { Eye, RotateCcw, Play, CheckCircle2, FileText } from 'lucide-react';

interface ImagePreviewProps {
  documentTitle: string;
  previewUrl: string;
  file: File;
  onRetakeOrReplace: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  documentTitle,
  previewUrl,
  file,
  onRetakeOrReplace,
  onAnalyze,
  isAnalyzing
}) => {
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Ingested Document Source — {documentTitle}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {file.name} • {sizeMb} MB • Ready for forensic evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={onRetakeOrReplace}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replace
          </button>
        </div>
      </div>

      {/* Actual Image Render */}
      <div className="relative aspect-[16/10] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-700/80 flex items-center justify-center group shadow-xl">
        <img
          src={previewUrl}
          alt={`Preview of ${documentTitle}`}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACTUAL SOURCE IMAGE LOADED
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-slate-400">
          Click below to initiate Quality Gate, OCR, MRZ, Forensics, and Face Crop.
        </p>
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onAnalyze}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-mono tracking-wider shadow-glow-blue flex items-center gap-2 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          {isAnalyzing ? 'ANALYZING DOCUMENT...' : 'ANALYZE THIS DOCUMENT'}
        </button>
      </div>
    </div>
  );
};
