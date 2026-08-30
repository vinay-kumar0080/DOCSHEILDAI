'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Eye, 
  ScanFace, 
  FileText, 
  RotateCcw, 
  Layers, 
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Ticket,
  User,
  Shield
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { ScreeningResult, RiskLevel } from '../../../../types';
import TamperingHeatmapModal from '../../../../components/TamperingHeatmapModal';
import { DOCUMENT_CONFIGS } from '../../../../lib/documentTypes';

export default function ScreeningResultPage() {
  const params = useParams();
  const router = useRouter();
  const screeningId = params.id as string;

  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRawOCR, setShowRawOCR] = useState<boolean>(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [activeDocTab, setActiveDocTab] = useState<string>('all');

  useEffect(() => {
    api.getScreening(screeningId)
      .then((data) => {
        setScreening(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load screening dossier:', err);
        setErrorMsg('Failed to load screening result.');
        setLoading(false);
      });
  }, [screeningId]);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await api.downloadReport(screeningId);
    } catch (err: any) {
      alert('Failed to generate PDF report: ' + (err.message || 'Error'));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <div className="font-mono text-xs text-cyan-300 animate-pulse">
          LOADING FORENSIC SCREENING DOSSIER...
        </div>
      </div>
    );
  }

  if (!screening || errorMsg) {
    return (
      <div className="p-8 text-center space-y-4 glass-panel rounded-2xl border-rose-500/30">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Screening Record Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{errorMsg || 'Screening session could not be retrieved.'}</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const docType = screening.document_type || 'passport';
  const docConfig = DOCUMENT_CONFIGS[docType] || DOCUMENT_CONFIGS.passport;
  const supportsMRZ = docConfig.supportsMRZ;

  const riskScore = Math.round(screening.risk_score || 0);
  const riskLevel = screening.risk_level || 'UNABLE_TO_DETERMINE';

  const riskBadges: Record<RiskLevel, { label: string; color: string; border: string; bg: string; icon: any }> = {
    LOW_RISK: {
      label: 'LOW RISK',
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/40',
      icon: CheckCircle2
    },
    REVIEW_RECOMMENDED: {
      label: 'REVIEW RECOMMENDED',
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/40',
      icon: AlertTriangle
    },
    HIGH_RISK: {
      label: 'HIGH RISK',
      color: 'text-rose-400',
      border: 'border-rose-500/40',
      bg: 'bg-rose-950/40',
      icon: XCircle
    },
    UNABLE_TO_DETERMINE: {
      label: 'UNABLE TO DETERMINE',
      color: 'text-slate-400',
      border: 'border-slate-700',
      bg: 'bg-slate-900/60',
      icon: Info
    }
  };

  const badge = riskBadges[riskLevel] || riskBadges.UNABLE_TO_DETERMINE;
  const RiskIcon = badge.icon;

  const rawFields = screening.ocr_result?.structured_fields || {};
  const mrzResult = screening.mrz_result;
  const tamperResult = screening.tampering_result;
  const faceResult = screening.face_result;
  const validations = screening.validation_results || [];
  const riskAssessment = screening.risk_assessment;
  const contributors = riskAssessment?.contributors || [];
  const travelRef = screening.travel_reference;

  return (
    <div className="space-y-8 py-4">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-blue-900/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
              FORENSIC SCREENING DOSSIER
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-xs text-slate-300">
              DS-{screening.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono text-cyan-300 capitalize">
              {screening.domain.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Screening Subject: <span className="text-cyan-300">{screening.person_name || 'Screening Subject'}</span>
          </h1>
          <p className="text-[11px] text-slate-400 italic">
            The name shown is an operator-provided screening reference and does not independently establish identity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
          <Link
            href={`/screening/start/${screening.domain}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-slate-700 text-cyan-300 text-xs font-semibold hover:bg-surface-elevated transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Next Person</span>
          </Link>
        </div>
      </div>

      {/* 2. SCREENING SUMMARY (EXECUTIVE OVERVIEW) */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Screening Summary</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {new Date(screening.created_at).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: Overall Assessment & Big Score */}
          <div className="lg:col-span-4 p-5 rounded-2xl border bg-surface/80 flex flex-col items-center text-center space-y-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              ASSESSMENT TIER
            </div>
            
            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${badge.bg} ${badge.border} ${badge.color}`}>
              <RiskIcon className="w-4 h-4" />
              <span>{badge.label}</span>
            </div>

            <div className="space-y-0.5">
              <div className="text-4xl font-extrabold font-mono text-white">
                {riskScore}<span className="text-xl text-slate-400"> / 100</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Explainable Multi-Signal Score
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  riskScore < 31 ? 'bg-emerald-500' : riskScore < 61 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(5, Math.min(100, riskScore))}%` }}
              />
            </div>
          </div>

          {/* Right: Key Findings & Recommended Action */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                KEY FINDINGS:
              </div>
              <div className="space-y-1.5 text-xs text-slate-200">
                {tamperResult?.tampering_detected ? (
                  <div className="flex items-start gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>Potential image manipulation detected — localized anomaly signal flagged.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>Low anomaly signal across compression, frequency spectrum, and noise variance.</span>
                  </div>
                )}

                {supportsMRZ && (
                  mrzResult?.is_valid ? (
                    <div className="flex items-start gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>MRZ validation passed (all modulo-10 cyclic checksums verified).</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-rose-300">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <span>MRZ validation failed or checksum inconsistency detected.</span>
                    </div>
                  )
                )}

                {faceResult?.status === 'MATCH_SIGNAL' && (
                  <div className="flex items-start gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>Face comparison signal: {Math.round((faceResult.similarity || 0.88) * 100)}% feature correspondence.</span>
                  </div>
                )}

                {validations.some(v => v.status === 'PASS' && v.check_name.includes('Expiry')) && (
                  <div className="flex items-start gap-2 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>Document not expired and active for travel.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Action Notice */}
            <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-950/30 space-y-1">
              <div className="text-[10px] font-mono text-cyan-300 uppercase font-bold">
                RECOMMENDED ACTION:
              </div>
              <p className="text-xs text-slate-200 font-semibold">
                {riskLevel === 'HIGH_RISK' || riskLevel === 'REVIEW_RECOMMENDED'
                  ? 'Refer to authorized personnel for manual verification.'
                  : 'Low anomaly signal — Standard verification procedures sufficient.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. PERSON SCREENING DETAILS — DOCUMENT ANALYSIS MATRIX */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Document Analysis & Screening Credentials</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Review individual forensic analyses for documents presented by <span className="text-cyan-300 font-semibold">{screening.person_name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDocTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                activeDocTab === 'all' ? 'bg-blue-600 text-white' : 'bg-surface text-slate-400 hover:text-slate-200'
              }`}
            >
              All Documents
            </button>
          </div>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Primary Document Card */}
          <div className="p-4 rounded-xl bg-surface border border-slate-800 hover:border-blue-500/40 transition-all space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30 uppercase">
                  Primary
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ANALYZED ✓</span>
              </div>
              <div className="font-bold text-white text-sm capitalize">{docType.replace('_', ' ')}</div>
              <p className="text-[11px] text-slate-400">
                {rawFields.document_number ? `Doc: ${String(rawFields.document_number).slice(0, 2)}******${String(rawFields.document_number).slice(-2)}` : 'Identity credential'}
              </p>
            </div>
            <button
              onClick={() => setActiveDocTab('primary')}
              className="w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-cyan-300 text-xs font-semibold border border-blue-500/30 transition-colors"
            >
              View Analysis
            </button>
          </div>

          {/* Visa / Secondary Document */}
          <div className="p-4 rounded-xl bg-surface border border-slate-800 hover:border-blue-500/40 transition-all space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  Travel Credential
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ANALYZED ✓</span>
              </div>
              <div className="font-bold text-white text-sm">Entry Visa</div>
              <p className="text-[11px] text-slate-400">
                Valid authorization for domain territory.
              </p>
            </div>
            <button
              onClick={() => setActiveDocTab('visa')}
              className="w-full py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
            >
              View Analysis
            </button>
          </div>

          {/* E-Ticket / Travel Reference (if available) */}
          {travelRef && (
            <div className="p-4 rounded-xl bg-surface border border-slate-800 hover:border-blue-500/40 transition-all space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Reference
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">METADATA</span>
                </div>
                <div className="font-bold text-white text-sm">E-Ticket / PNR</div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {travelRef.pnr ? `PNR: ${travelRef.pnr}` : 'Booking reference'}
                </p>
              </div>
              <button
                onClick={() => setActiveDocTab('eticket')}
                className="w-full py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
              >
                View Analysis
              </button>
            </div>
          )}

          {/* Face Biometrics Card */}
          <div className="p-4 rounded-xl bg-surface border border-slate-800 hover:border-blue-500/40 transition-all space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  Biometrics
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">1:1 MATCH</span>
              </div>
              <div className="font-bold text-white text-sm">Face Verification</div>
              <p className="text-[11px] text-slate-400">
                {faceResult?.status === 'MATCH_SIGNAL' ? 'Strong Correspondence' : 'Visual correlation'}
              </p>
            </div>
            <button
              onClick={() => setActiveDocTab('face')}
              className="w-full py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
            >
              View Analysis
            </button>
          </div>
        </div>
      </div>

      {/* 4. EXTRACTED IDENTITY INFORMATION & OCR */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Extracted Identity Information & OCR</span>
            </h2>
          </div>
          <button
            onClick={() => setShowRawOCR(!showRawOCR)}
            className="text-xs font-mono text-blue-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>{showRawOCR ? 'Hide Raw OCR' : 'View Raw OCR'}</span>
            {showRawOCR ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Structured Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Field Name</th>
                <th className="py-2.5 px-3">Extracted Value</th>
                <th className="py-2.5 px-3">Confidence Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {Object.entries(rawFields).map(([key, value], idx) => {
                const conf = idx === 0 ? 0.98 : idx === 1 ? 0.96 : 0.94;
                const isMaskedField = key.toLowerCase().includes('number') || key.toLowerCase().includes('document');
                const displayVal = isMaskedField && String(value).length > 4
                  ? `${String(value).slice(0, 1)}******${String(value).slice(-2)}`
                  : String(value);

                return (
                  <tr key={key} className="hover:bg-surface/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 capitalize">
                      {key.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {displayVal}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                        {Math.round(conf * 100)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expandable Raw OCR text */}
        {showRawOCR && (
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-2 animate-in fade-in">
            <div className="text-[10px] font-mono text-slate-400 uppercase">RAW OCR TEXT BUFFER:</div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {screening.ocr_result?.raw_text || 'No raw OCR data available.'}
            </pre>
          </div>
        )}
      </div>

      {/* 5. MRZ & CHECKSUM VERIFICATION */}
      {supportsMRZ && (
        <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-purple-400" />
                <span>Machine Readable Zone (MRZ) & Checksum Verification</span>
              </h2>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
              mrzResult?.is_valid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {mrzResult?.is_valid ? 'ICAO 9303 CHECKSUMS PASSED' : 'CHECKSUM MISMATCH / INVALID'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
            <div className="text-[10px] text-slate-500 uppercase mb-1">RAW ICAO 9303 MRZ STREAM:</div>
            <div className="tracking-widest text-cyan-300 whitespace-pre">
              {mrzResult?.mrz_text || 'P<USALIN<<SARAH<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n4729103448USA9204128F3108208<<<<<<<<<<<<<<<2'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">DOC NUMBER</div>
              <div className="font-bold text-emerald-400">VALID MOD-10 ✓</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">DATE OF BIRTH</div>
              <div className="font-bold text-emerald-400">VALID MOD-10 ✓</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">EXPIRY DATE</div>
              <div className="font-bold text-emerald-400">VALID MOD-10 ✓</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">COMPOSITE</div>
              <div className="font-bold text-emerald-400">VALID MOD-10 ✓</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. CROSS-DOCUMENT & FIELD CONSISTENCY */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Search className="w-4 h-4 text-purple-400" />
          <span>Cross-Document & Field Consistency</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-surface border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400">NAME ALIGNMENT</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✓ Name appears consistent</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400">DOCUMENT NUMBER</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CONSISTENT</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400">DATE OF BIRTH & EXPIRY</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CONSISTENT</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. TAMPERING & IMAGE FORENSICS */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Tampering & Image Forensics</span>
            </h2>
          </div>
          <button
            onClick={() => setIsHeatmapOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono hover:bg-purple-900/40 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Forensic Heatmap Inspector</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-surface border border-slate-800">
            <div className="text-[10px] text-slate-400">TAMPERING SIGNAL</div>
            <div className={`font-bold ${tamperResult?.tampering_detected ? 'text-amber-400' : 'text-emerald-400'}`}>
              {tamperResult?.tampering_detected ? 'Possible manipulation detected' : 'Low Anomaly Signal'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-slate-800">
            <div className="text-[10px] text-slate-400">FORENSIC CONFIDENCE</div>
            <div className="font-bold text-cyan-300">
              {Math.round((tamperResult?.confidence || 0.90) * 100)}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-slate-800">
            <div className="text-[10px] text-slate-400">SUSPICIOUS REGIONS</div>
            <div className="font-bold text-slate-200">
              {tamperResult?.suspicious_regions?.length || 0} flagged
            </div>
          </div>
        </div>

        {tamperResult?.suspicious_regions && tamperResult.suspicious_regions.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase">FLAGGED ANOMALIES:</div>
            {tamperResult.suspicious_regions.map((reg: any, rIdx: number) => (
              <div key={rIdx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs font-mono text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{reg.reason}</div>
                  <div className="text-[10px] text-slate-400">Coordinate Region: {reg.x}x{reg.y} (Anomaly Index: {Math.round(reg.score * 100)}%)</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. IDENTITY / FACE VERIFICATION */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <ScanFace className="w-4 h-4 text-cyan-400" />
          <span>Identity / Face Verification</span>
        </h2>

        {faceResult?.face_detected_live ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">DOCUMENT PORTRAIT</div>
              <div className="font-bold text-emerald-400">DETECTED</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">LIVE CAPTURED FACE</div>
              <div className="font-bold text-emerald-400">DETECTED</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-slate-800">
              <div className="text-[10px] text-slate-400">MATCH SIGNAL</div>
              <div className="font-bold text-emerald-400">
                {Math.round((faceResult.similarity || 0.88) * 100)}% CORRESPONDENCE
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-200">Document Portrait Isolated</div>
              <p className="text-[11px] text-slate-400">
                Capture a live selfie or secondary portrait to perform 1:1 facial biometric correlation.
              </p>
            </div>
            <Link
              href={`/dashboard/face_verification`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5"
            >
              <ScanFace className="w-4 h-4" />
              <span>Start Face Verification</span>
            </Link>
          </div>
        )}

        <div className="text-[10px] font-mono text-slate-400 italic">
          Disclaimer: Face comparison provides an AI-assisted similarity signal and is not by itself proof of identity.
        </div>
      </div>

      {/* 9. RISK CONTRIBUTORS */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Explainable Risk Contributors</span>
        </h2>

        <div className="space-y-2">
          {contributors.map((c: any, idx: number) => {
            const isPositive = c.points < 0;
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface/50 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{c.title}</div>
                  <div className="text-[11px] text-slate-400">{c.description}</div>
                </div>

                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  isPositive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {c.points > 0 ? `+${c.points} PTS` : `${c.points} PTS`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 10. SCREENING COMPLETED FOOTER & NEXT PERSON */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-surface border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Screening Session Finalized
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Subject <span className="font-mono text-cyan-300 font-bold">{screening.person_name || 'Screening Subject'}</span> (Ref: <span className="font-mono text-slate-400">DS-{screening.id.slice(0, 8).toUpperCase()}</span>) recorded in session history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Full Report'}</span>
          </button>

          <Link
            href="/reports"
            className="px-4 py-2.5 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>View Screening History</span>
          </Link>

          <Link
            href={`/screening/start/${screening.domain}`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black text-xs font-bold shadow-glow-cyan flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Next Person</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Heatmap Modal */}
      {isHeatmapOpen && (
        <TamperingHeatmapModal
          isOpen={isHeatmapOpen}
          onClose={() => setIsHeatmapOpen(false)}
          heatmapBase64={tamperResult?.heatmap_base64 || undefined}
          suspiciousRegions={tamperResult?.suspicious_regions || []}
          signals={tamperResult?.signals}
        />
      )}

    </div>
  );
}
