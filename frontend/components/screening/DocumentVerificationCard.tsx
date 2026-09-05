import React from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, Shield, FileText, 
  ScanFace, ArrowRight, Eye, Check, ExternalLink 
} from 'lucide-react';
import { DOCUMENT_CONFIGS } from '../../lib/documentTypes';

interface DocumentVerificationCardProps {
  documentType: string;
  analysis: any;
  onContinueNext: () => void;
  isLastDocument: boolean;
}

export const DocumentVerificationCard: React.FC<DocumentVerificationCardProps> = ({
  documentType,
  analysis,
  onContinueNext,
  isLastDocument
}) => {
  const cfg = (DOCUMENT_CONFIGS as any)[documentType] || { title: documentType.replace(/_/g, ' ') };
  const qual = analysis?.quality || {};
  const classRes = analysis?.classification || {};
  const ocr = analysis?.ocr || {};
  const mrz = analysis?.mrz || {};
  const tamper = analysis?.tampering || {};
  const faceDetect = analysis?.face_detection || {};
  const riskScore = Math.round(analysis?.risk_score || 0);
  const riskLevel = analysis?.risk_level || 'UNABLE_TO_DETERMINE';

  const isMismatch = classRes.status === 'MISMATCH' || classRes.status === 'REJECT';

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
      {/* 1. Header & Overall Document Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              {cfg.title} — Forensic Verification Dossier
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Source file: <span className="font-mono text-slate-300">{analysis?.filename || 'Document'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Document Risk</span>
            <span className={`text-xs font-mono font-bold ${
              riskLevel === 'LOW_RISK' ? 'text-emerald-400' : riskLevel === 'HIGH_RISK' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {riskScore} PTS ({riskLevel.replace(/_/g, ' ')})
            </span>
          </div>

          <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
            isMismatch
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-400'
              : riskLevel === 'LOW_RISK'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-400'
          }`}>
            {isMismatch ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {isMismatch ? 'MISMATCH / REJECTED' : riskLevel === 'LOW_RISK' ? 'VERIFIED' : 'REVIEW REQUIRED'}
          </span>
        </div>
      </div>

      {/* 2. Grid of 6 Key Forensic Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Image Quality */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300">IMAGE QUALITY</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              qual.is_usable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {qual.status || 'PASS'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>Resolution: <span className="font-mono text-slate-200">{qual.resolution || 'Standard'}</span></p>
            <p>Sharpness Index: <span className="font-mono text-slate-200">{qual.sharpness_index || 0}</span></p>
          </div>
        </div>

        {/* Card 2: Document Classification */}
        <div className={`p-3.5 rounded-xl border space-y-2 ${
          isMismatch ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300">CLASSIFICATION</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              isMismatch ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {classRes.status || 'PASS'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>Expected: <span className="font-mono text-cyan-300">{documentType.toUpperCase()}</span></p>
            <p>Detected: <span className="font-mono text-slate-200">{classRes.detected_type?.toUpperCase() || documentType.toUpperCase()}</span></p>
          </div>
        </div>

        {/* Card 3: OCR Text Extraction */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300">OCR & BIODATA</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
              {ocr.status || 'COMPLETED'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>Confidence: <span className="font-mono text-slate-200">{Math.round((ocr.average_confidence || 0) * 100)}%</span></p>
            <p>Doc No: <span className="font-mono text-slate-200">{ocr.structured_fields?.document_number || 'Not detected'}</span></p>
          </div>
        </div>

        {/* Card 4: MRZ Validation */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300">ICAO 9303 MRZ</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              mrz.is_valid ? 'bg-emerald-500/20 text-emerald-400' : mrz.mrz_detected ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {mrz.is_valid ? 'VALID PASS' : mrz.mrz_detected ? 'CHECKSUM FAIL' : 'N/A'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>MRZ Detected: <span className="font-mono text-slate-200">{mrz.mrz_detected ? 'YES' : 'NO'}</span></p>
            <p>Check Digits: <span className="font-mono text-slate-200">{mrz.is_valid ? 'ALL MATCH' : 'NOT APPLICABLE'}</span></p>
          </div>
        </div>

        {/* Card 5: Forensic Tampering */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300">FORENSICS / ELA</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              tamper.tampering_detected ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {tamper.tampering_detected ? 'ANOMALY DETECTED' : 'CLEAR'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>Anomaly Score: <span className="font-mono text-slate-200">{tamper.score || 0.0}</span></p>
            <p>Status: <span className="font-mono text-slate-200">{tamper.status || 'NO ANOMALIES'}</span></p>
          </div>
        </div>

        {/* Card 6: Document Portrait Extraction */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-300">DOCUMENT PORTRAIT</span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              faceDetect.face_detected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {faceDetect.face_detected ? 'EXTRACTED' : 'NO PHOTO'}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {faceDetect.face_crop_base64 ? (
              <img
                src={`data:image/jpeg;base64,${faceDetect.face_crop_base64}`}
                alt="Document Portrait"
                className="w-8 h-10 object-cover rounded border border-cyan-500/50"
              />
            ) : (
              <ScanFace className="w-6 h-6 text-slate-600" />
            )}
            <div className="text-[10px] text-slate-400 font-mono">
              {faceDetect.face_detected ? 'Biometric crop localized for face verification' : 'Non-photo document format'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <p className="text-[11px] text-slate-400">
          Document analysis stored securely in session dossier.
        </p>

        <button
          type="button"
          onClick={onContinueNext}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-mono tracking-wider shadow-glow-cyan flex items-center gap-2 transition-all"
        >
          <span>{isLastDocument ? 'PROCEED TO FACE VERIFICATION' : 'CONTINUE TO NEXT DOCUMENT'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
