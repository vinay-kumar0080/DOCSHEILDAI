'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Cpu, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  Layers, 
  Scan, 
  FileText, 
  ScanFace,
  Sparkles,
  ArrowRight,
  Fingerprint,
  FileCheck,
  Search
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { DOCUMENT_CONFIGS } from '../../../../lib/documentTypes';

interface StageInfo {
  number: string;
  name: string;
  key: string;
  description: string;
  icon: any;
}

export default function AnalysisProgressPage() {
  const params = useParams();
  const router = useRouter();
  const screeningId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stages: StageInfo[] = [
    {
      number: '01',
      name: 'IMAGE QUALITY',
      key: 'quality',
      description: 'Analyzing Laplacian edge sharpness, contrast, exposure, and illumination glare.',
      icon: Scan
    },
    {
      number: '02',
      name: 'DOCUMENT CLASSIFICATION',
      key: 'classification',
      description: 'Verifying physical card aspect geometry and structural layout template.',
      icon: Layers
    },
    {
      number: '03',
      name: 'OCR EXTRACTION',
      key: 'ocr',
      description: 'Extracting text lines, bounding boxes, and structured identity biodata tokens.',
      icon: FileText
    },
    {
      number: '04',
      name: 'MRZ ANALYSIS',
      key: 'mrz',
      description: 'Calculating ICAO 9303 modulo-10 cyclic weighted [7, 3, 1] check digits.',
      icon: Fingerprint
    },
    {
      number: '05',
      name: 'FIELD VALIDATION',
      key: 'validation',
      description: 'Verifying expiration validity, future date-of-birth constraints, and formatting rules.',
      icon: FileCheck
    },
    {
      number: '06',
      name: 'CONSISTENCY CHECK',
      key: 'consistency',
      description: 'Cross-verifying visual OCR text fields with MRZ lines and paired travel documents.',
      icon: Search
    },
    {
      number: '07',
      name: 'TAMPERING ANALYSIS',
      key: 'tampering',
      description: 'Performing Error Level Analysis (ELA), 2D-FFT spectral density, and wavelet noise forensics.',
      icon: Shield
    },
    {
      number: '08',
      name: 'FACE ANALYSIS',
      key: 'face',
      description: 'Isolating document portrait crop and extracting 128-d deep neural embeddings.',
      icon: ScanFace
    },
    {
      number: '09',
      name: 'RISK ASSESSMENT',
      key: 'risk',
      description: 'Aggregating all multi-modal signals into an explainable 0-100 risk score.',
      icon: Sparkles
    }
  ];

  // Poll screening status from FastAPI backend
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const data = await api.getScreeningStatus(screeningId);
        setSession(data);

        // Map backend stage to index
        const stageMap: Record<string, number> = {
          quality: 0,
          classification: 1,
          ocr: 2,
          mrz: 3,
          validation: 4,
          consistency: 5,
          tampering: 6,
          face: 7,
          risk: 8,
          completed: 9
        };

        const backendStage = data.stage || 'quality';
        const mappedIdx = stageMap[backendStage] !== undefined ? stageMap[backendStage] : 0;
        setCurrentStageIndex(mappedIdx);

        if (data.status === 'completed' || mappedIdx >= 9) {
          setIsCompleted(true);
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/screening/${screeningId}/result`);
          }, 1500);
        } else if (data.status === 'failed') {
          setErrorMsg('Analysis encountered an unrecoverable processing error.');
          clearInterval(interval);
        }
      } catch (err: any) {
        console.error('Error polling screening status:', err);
      }
    };

    pollStatus();
    interval = setInterval(pollStatus, 1000);

    return () => clearInterval(interval);
  }, [screeningId, router]);

  const docType = session?.document_type || 'passport';
  const docConfig = DOCUMENT_CONFIGS[docType] || DOCUMENT_CONFIGS.passport;
  const supportsMRZ = docConfig.supportsMRZ;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Investigation Header */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                AUTOMATED FORENSIC PIPELINE
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-xs text-blue-400">
                DS-{screeningId.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Identity Screening Analysis
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono font-bold text-cyan-300">
                {isCompleted ? 'ANALYSIS COMPLETE' : 'ANALYZING DOCUMENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Screening Context Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-surface/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">DOCUMENT TYPE</div>
            <div className="font-bold text-white uppercase">{docConfig.name}</div>
          </div>
          <div className="p-3 rounded-xl bg-surface/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">SCREENING ID</div>
            <div className="font-bold text-blue-400 truncate">DS-{screeningId.slice(0, 8).toUpperCase()}</div>
          </div>
          <div className="p-3 rounded-xl bg-surface/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">OPERATIONAL DOMAIN</div>
            <div className="font-bold text-slate-200 capitalize">
              {(session?.domain || 'Airport Security').replace('_', ' ')}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">STATUS</div>
            <div className="font-bold text-emerald-400 uppercase">
              {isCompleted ? 'READY' : 'INSPECTION IN PROGRESS'}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <Link href={`/screening/${screeningId}/result`} className="text-blue-400 underline font-mono">
            View Partial Results
          </Link>
        </div>
      )}

      {/* Investigation-Style 9-Stage Processing Pipeline */}
      <div className="glass-panel rounded-2xl p-6 border-blue-900/40 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Multi-Modal Inspection Pipeline</span>
          </h2>
          <span className="text-xs font-mono text-cyan-400">
            Stage {Math.min(9, currentStageIndex + 1)} of 9
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = idx < currentStageIndex || isCompleted;
            const isCurrent = idx === currentStageIndex && !isCompleted;
            const isPending = idx > currentStageIndex && !isCompleted;
            const isMRZNotApplicable = stage.key === 'mrz' && !supportsMRZ;

            return (
              <div
                key={stage.key}
                className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  isCurrent
                    ? 'border-cyan-500/60 bg-cyan-950/20 shadow-glow-cyan'
                    : isDone
                    ? 'border-emerald-500/30 bg-surface/60'
                    : 'border-slate-800/80 bg-surface/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-center shrink-0 mt-0.5">
                  {isMRZNotApplicable ? (
                    <div className="w-7 h-7 rounded-lg bg-surface border border-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                      —
                    </div>
                  ) : isDone ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/60 text-cyan-300 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-surface border border-slate-800 text-slate-500 flex items-center justify-center font-mono text-xs">
                      {stage.number}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{stage.number}</span>
                      <h3 className={`text-xs font-bold font-mono tracking-wider ${
                        isCurrent ? 'text-cyan-300' : isDone ? 'text-slate-200' : 'text-slate-400'
                      }`}>
                        {stage.name}
                      </h3>
                    </div>

                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      isMRZNotApplicable
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isCurrent
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                        : 'text-slate-500'
                    }`}>
                      {isMRZNotApplicable ? 'Not applicable for this document' : isDone ? 'COMPLETED' : isCurrent ? 'ANALYZING...' : 'QUEUED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isMRZNotApplicable 
                      ? 'Machine Readable Zone (MRZ) verification bypassed for this document specification.' 
                      : stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immediate Access Button if completed */}
      {isCompleted && (
        <div className="text-center pt-2">
          <Link
            href={`/screening/${screeningId}/result`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold shadow-glow-blue transition-all"
          >
            <span>Open Forensic Screening Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

    </div>
  );
}
