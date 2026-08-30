'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Camera, 
  Upload, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ScanFace, 
  Ticket, 
  Building2, 
  Plane, 
  ShieldCheck, 
  ChevronLeft,
  Eye,
  Scan,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Info,
  Check,
  User
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { DOMAIN_DETAILS, DOCUMENT_CONFIGS } from '../../../../lib/documentTypes';

export default function DomainPersonScreeningPage() {
  const params = useParams();
  const router = useRouter();
  const domain = (params.domain as string) || 'airport_security';
  const domainConfig = (DOMAIN_DETAILS as any)[domain] || DOMAIN_DETAILS.airport_security;

  // STEP WIZARD STATE: 1 = Enter Person Name, 2 = Travel Info (Airlines only), 3 = Document Collection
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Person Name State (Operator-provided screening reference)
  const [personName, setPersonName] = useState<string>('');

  // Domain-Specific Info (E-Ticket / PNR for Airlines)
  const [eTicketNumber, setETicketNumber] = useState<string>('');
  const [pnrCode, setPnrCode] = useState<string>('');

  // Selected Documents for Multi-Document Screening
  const [selectedDocType, setSelectedDocType] = useState<string>('passport');
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});
  const [documentPreviews, setDocumentPreviews] = useState<Record<string, string>>({});

  // Active Camera / Capture State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [tempCapturedFile, setTempCapturedFile] = useState<File | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; quality: string } | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Step 1: Submit Person Name
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      setErrorMsg("Please enter the person's name.");
      return;
    }
    setErrorMsg(null);

    // If Airlines domain -> Step 2 (Travel info / E-ticket), else -> Step 3 (Document collection)
    if (domain === 'airline') {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  // Step 2: Proceed from Travel Info (Airlines)
  const handleTravelInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  // Start Camera for capturing selected document
  const startCamera = async (docType: string) => {
    setSelectedDocType(docType);
    setCameraError(null);
    setErrorMsg(null);
    setCapturedBlobUrl(null);
    setTempCapturedFile(null);
    stopCamera();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Please upload from your device.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable: ' + (err.message || 'Error'));
    }
  };

  // Capture frame from video canvas
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedBlobUrl(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${selectedDocType}_captured.jpg`, { type: 'image/jpeg' });
        setTempCapturedFile(file);
        setImageMeta({
          width: canvas.width,
          height: canvas.height,
          quality: canvas.width >= 1280 ? 'High Definition (Optimal)' : 'Acceptable'
        });
      }
    }, 'image/jpeg', 0.95);

    stopCamera();
  };

  // File upload from device
  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedBlobUrl(dataUrl);
      setTempCapturedFile(file);
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          width: img.naturalWidth || 1280,
          height: img.naturalHeight || 720,
          quality: img.naturalWidth >= 1280 ? 'High Definition (Optimal)' : 'Acceptable'
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Confirm and attach captured image to document slot
  const useCapturedImage = () => {
    if (!tempCapturedFile || !capturedBlobUrl) return;

    setDocumentFiles(prev => ({ ...prev, [selectedDocType]: tempCapturedFile }));
    setDocumentPreviews(prev => ({ ...prev, [selectedDocType]: capturedBlobUrl }));

    setCapturedBlobUrl(null);
    setTempCapturedFile(null);
    stopCamera();
  };

  // Launch AI multi-document screening pipeline
  const handleLaunchScreening = async () => {
    const uploadedDocs = Object.keys(documentFiles);
    if (uploadedDocs.length === 0) {
      setErrorMsg('Please capture or upload at least one primary document before screening.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const primaryDocType = uploadedDocs[0] || 'passport';
      const travelRef = (eTicketNumber || pnrCode) ? { ticket_number: eTicketNumber, pnr: pnrCode } : undefined;

      // 1. Create Screening Session in backend with automatic unique UUID
      const { id: screeningId } = await api.createScreening(
        domain,
        primaryDocType,
        false,
        personName.trim() || 'Screening Subject',
        travelRef
      );

      // 2. Upload all collected documents
      for (const docKey of uploadedDocs) {
        const file = documentFiles[docKey];
        const docRole = docKey === 'face_verification' ? 'live_selfie' : (docKey === primaryDocType ? 'primary_document' : 'secondary_document');
        await api.uploadDocument(screeningId, file, docRole, file.name);
      }

      // 3. Trigger AI Background Multi-Modal Analysis
      await api.startAnalysis(screeningId, false);

      // 4. Redirect to Live Analysis Progress
      router.push(`/screening/${screeningId}/analysis`);
    } catch (err: any) {
      console.error('Screening failed to launch:', err);
      setErrorMsg(err.message || 'Failed to initiate AI multi-modal screening pipeline.');
      setIsProcessing(false);
    }
  };

  // Next Person: Reset all state and start fresh
  const handleResetForNextPerson = () => {
    setCurrentStep(1);
    setPersonName('');
    setETicketNumber('');
    setPnrCode('');
    setDocumentFiles({});
    setDocumentPreviews({});
    setCapturedBlobUrl(null);
    setTempCapturedFile(null);
    setErrorMsg(null);
  };

  const DomainIcon = domainConfig.icon;

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      
      {/* Domain Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-900/30 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-cyan-400 shadow-glow-blue/20">
            <DomainIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                {domainConfig.code}
              </span>
              <span className="text-xs text-slate-400 font-mono">{domainConfig.badge}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {domainConfig.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleResetForNextPerson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-xs font-semibold text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Next Person</span>
          </button>
          <Link
            href="/domains"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-slate-800 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Change Domain</span>
          </Link>
        </div>
      </div>

      {/* Step Wizard Progress Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <div className={`p-3 rounded-xl border text-center transition-all ${
          currentStep === 1 
            ? 'bg-blue-600/20 border-cyan-500/50 text-cyan-300 shadow-glow-blue/20' 
            : currentStep > 1 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : 'bg-surface/50 border-slate-800 text-slate-500'
        }`}>
          <div className="text-[10px] font-mono">STEP 01</div>
          <div className="text-xs font-bold truncate">Person Name {currentStep > 1 && '✓'}</div>
        </div>

        {domain === 'airline' && (
          <div className={`p-3 rounded-xl border text-center transition-all ${
            currentStep === 2 
              ? 'bg-blue-600/20 border-cyan-500/50 text-cyan-300 shadow-glow-blue/20' 
              : currentStep > 2 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
              : 'bg-surface/50 border-slate-800 text-slate-500'
          }`}>
            <div className="text-[10px] font-mono">STEP 02</div>
            <div className="text-xs font-bold truncate">Travel Info {currentStep > 2 && '✓'}</div>
          </div>
        )}

        <div className={`p-3 rounded-xl border text-center transition-all ${
          currentStep === 3 
            ? 'bg-blue-600/20 border-cyan-500/50 text-cyan-300 shadow-glow-blue/20' 
            : Object.keys(documentFiles).length > 0 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
            : 'bg-surface/50 border-slate-800 text-slate-500'
        }`}>
          <div className="text-[10px] font-mono">STEP {domain === 'airline' ? '03' : '02'}</div>
          <div className="text-xs font-bold truncate">Documents ({Object.keys(documentFiles).length})</div>
        </div>

        <div className={`p-3 rounded-xl border text-center transition-all ${
          isProcessing 
            ? 'bg-blue-600/20 border-cyan-500/50 text-cyan-300 animate-pulse' 
            : 'bg-surface/50 border-slate-800 text-slate-500'
        }`}>
          <div className="text-[10px] font-mono">STEP {domain === 'airline' ? '04' : '03'}</div>
          <div className="text-xs font-bold truncate">AI Screening</div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ================= STEP 1: ENTER PERSON DETAILS (FULL NAME) ================= */}
      {currentStep === 1 && (
        <div className="glass-panel rounded-3xl p-8 border-blue-500/30 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Enter Person Details
            </h2>
            <p className="text-xs text-slate-400">
              Enter the full legal name of the person presenting documents for screening.
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-5 max-w-lg">
            <div className="space-y-2">
              <label className="text-xs font-mono text-cyan-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Enter person's full name (e.g. John Doe)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-slate-700 focus:border-cyan-400 text-sm font-semibold text-white placeholder-slate-500"
                />
              </div>
              <div className="text-[11px] text-slate-400 italic">
                Name is used as a screening reference and is not independently verified.
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-blue transition-all flex items-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ================= STEP 2: AIRLINE TRAVEL INFORMATION ================= */}
      {currentStep === 2 && domain === 'airline' && (
        <div className="glass-panel rounded-3xl p-8 border-purple-500/30 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px] font-mono">
              <Ticket className="w-3.5 h-3.5" />
              <span>REFERENCE VALIDATION ONLY</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Travel Information
            </h2>
            <p className="text-xs text-slate-400">
              Passenger: <span className="font-mono text-cyan-300 font-bold">{personName}</span>. Enter flight booking reference to cross-verify against passport biodata.
            </p>
          </div>

          <form onSubmit={handleTravelInfoSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">E-Ticket / Booking Reference</label>
              <input
                type="text"
                value={eTicketNumber}
                onChange={(e) => setETicketNumber(e.target.value)}
                placeholder="Enter e-ticket / booking reference (e.g. 016-2491029481)"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-700 focus:border-purple-400 text-xs font-mono text-slate-100 placeholder-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Booking Reference (PNR)</label>
              <input
                type="text"
                value={pnrCode}
                onChange={(e) => setPnrCode(e.target.value.toUpperCase())}
                placeholder="e.g. Y7X9PQ"
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-700 focus:border-purple-400 text-xs font-mono text-slate-100 placeholder-slate-500 uppercase"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400">
              Note: E-ticket information is stored as reference metadata for cross-document consistency checks with the boarding pass and passport.
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-purple transition-all flex items-center gap-2"
            >
              <span>Continue to Document Screening</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ================= STEP 3: MULTI-DOCUMENT COLLECTION MATRIX ================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400">SCREENING SUBJECT</span>
                <div className="text-lg font-bold font-mono text-cyan-300">{personName || 'Screening Subject'}</div>
              </div>
              <div className="text-xs text-slate-400">
                Uploaded Documents: <span className="text-white font-bold font-mono">{Object.keys(documentFiles).length}</span> attached
              </div>
            </div>

            {/* Document Slots Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Documents to Screen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainConfig.primaryDocs.map((docKey: string) => {
                  const cfg = DOCUMENT_CONFIGS[docKey] || {
                    name: docKey.replace('_', ' '),
                    description: 'Identity verification credential',
                    badge: 'Standard'
                  };
                  const hasFile = !!documentFiles[docKey];
                  const preview = documentPreviews[docKey];

                  return (
                    <div
                      key={docKey}
                      className={`glass-panel rounded-2xl p-4 space-y-3 border transition-all flex flex-col justify-between ${
                        hasFile 
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-glow-blue/10' 
                          : 'bg-surface border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300">
                            {cfg.badge}
                          </span>
                          {hasFile ? (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Uploaded ✓</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">Not Started</span>
                          )}
                        </div>

                        <div className="font-bold text-white text-sm capitalize">
                          {cfg.name}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {cfg.description}
                        </p>

                        {/* Thumbnail preview if captured */}
                        {preview && (
                          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-500/30 bg-black">
                            <img src={preview} alt={cfg.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => startCamera(docKey)}
                          className="flex-1 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{hasFile ? 'Retake' : 'Scan'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDocType(docKey);
                            fileInputRef.current?.click();
                          }}
                          className="py-2 px-3 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-slate-300 text-xs font-medium transition-colors"
                          title="Upload image from device"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action: Launch AI Screening */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Ensure documents are clearly legible without heavy glare or blur before launching analysis.
              </div>
              <button
                onClick={handleLaunchScreening}
                disabled={isProcessing || Object.keys(documentFiles).length === 0}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="font-mono text-xs animate-pulse">Initiating AI Pipeline...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Multi-Modal Screening ({Object.keys(documentFiles).length} Attached)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CAMERA / CAPTURE MODAL ================= */}
      {(isCameraActive || capturedBlobUrl) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-panel rounded-3xl p-6 border-blue-500/40 space-y-4 relative shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white capitalize">
                  Capture {selectedDocType.replace('_', ' ')}
                </h3>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setCapturedBlobUrl(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Video Canvas or Review Captured Image */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
              {isCameraActive && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Cyber Scanner Overlay Guidelines */}
                  <div className="absolute inset-8 border-2 border-cyan-400/40 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                    </div>
                    <div className="text-center font-mono text-[10px] text-cyan-300 bg-black/60 py-1 px-3 rounded-full self-center">
                      ALIGN DOCUMENT WITHIN BORDER
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  </div>
                </>
              )}

              {capturedBlobUrl && !isCameraActive && (
                <img
                  src={capturedBlobUrl}
                  alt="Captured Document"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Quality & Metadata details */}
            {imageMeta && capturedBlobUrl && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs font-mono text-slate-300">
                <span>RESOLUTION: {imageMeta.width} x {imageMeta.height}</span>
                <span className="text-emerald-400 font-bold">QUALITY: {imageMeta.quality}</span>
              </div>
            )}

            {/* Actions: Snap, Retake, Use Image */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {isCameraActive ? (
                <button
                  onClick={captureFrame}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono tracking-wider flex items-center justify-center gap-2 shadow-glow-blue"
                >
                  <Camera className="w-4 h-4" />
                  <span>SNAP HIGH-RES FRAME</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => startCamera(selectedDocType)}
                    className="flex-1 py-3 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={useCapturedImage}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-glow-blue"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use This Document</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Hidden File Input for Device Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileDrop}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
      />

    </div>
  );
}
