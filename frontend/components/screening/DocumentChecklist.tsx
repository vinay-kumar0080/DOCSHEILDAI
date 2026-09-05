import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, HelpCircle, ArrowUpCircle, FileText, Check } from 'lucide-react';
import { DOCUMENT_CONFIGS } from '../../lib/documentTypes';

export type DocStatus = 'NOT_UPLOADED' | 'UPLOADING' | 'PROCESSING' | 'VERIFIED' | 'REVIEW_REQUIRED' | 'REJECTED' | 'UNABLE_TO_DETERMINE';

interface DocumentChecklistProps {
  availableDocuments: string[];
  selectedDocuments: string[];
  currentDocType: string;
  documentStatuses: Record<string, DocStatus>;
  onToggleSelectDoc: (docType: string) => void;
  onSelectCurrentDoc: (docType: string) => void;
  isProcessing: boolean;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  availableDocuments,
  selectedDocuments,
  currentDocType,
  documentStatuses,
  onToggleSelectDoc,
  onSelectCurrentDoc,
  isProcessing
}) => {
  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
            <Clock className="w-3 h-3 animate-spin" /> PROCESSING
          </span>
        );
      case 'UPLOADING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <ArrowUpCircle className="w-3 h-3" /> UPLOADING
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> REVIEW REQ
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> REJECTED
          </span>
        );
      case 'UNABLE_TO_DETERMINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <HelpCircle className="w-3 h-3" /> UNCERTAIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-500 border border-slate-700/60">
            NOT UPLOADED
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Documents For This Screening
          </h3>
          <p className="text-[11px] text-slate-400">
            Select presented credentials to verify one-by-one
          </p>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
          {selectedDocuments.length} SELECTED
        </span>
      </div>

      <div className="space-y-2">
        {availableDocuments.map((docKey) => {
          const cfg = (DOCUMENT_CONFIGS as any)[docKey] || { title: docKey.replace(/_/g, ' ') };
          const isSelected = selectedDocuments.includes(docKey);
          const isCurrent = currentDocType === docKey;
          const status = documentStatuses[docKey] || 'NOT_UPLOADED';

          return (
            <div
              key={docKey}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-blue-950/40 border-blue-500 shadow-glow-blue'
                  : isSelected
                  ? 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox for including document in screening */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onToggleSelectDoc(docKey)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-900/60'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Click to activate document */}
                <button
                  type="button"
                  disabled={isProcessing || !isSelected}
                  onClick={() => onSelectCurrentDoc(docKey)}
                  className="text-left"
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-white' : isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                      {cfg.title}
                    </span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    )}
                  </div>
                </button>
              </div>

              <div>{getStatusBadge(status)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
