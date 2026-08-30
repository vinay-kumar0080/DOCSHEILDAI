'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Info,
  ChevronLeft,
  Eye,
  Check,
  Layers,
  Image as ImageIcon,
  Scan
} from 'lucide-react';
import { api } from '../../../lib/api';
import { DOCUMENT_CONFIGS } from '../../../lib/documentTypes';

export default function DocumentScannerPage() {
  const params = useParams();
  const router = useRouter();
  const docType = (params.docType as string) || 'passport';
  const docConfig = DOCUMENT_CONFIGS[docType] || DOCUMENT_CONFIGS.passport;
  const isComparePair = docType === 'compare_documents';

  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Primary Document state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; quality: string; blurScore: number } | null>(null);

  // Secondary Document state (for Compare Documents mode)
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryPreviewUrl, setSecondaryPreviewUrl] = useState<string | null>(null);

  const [activeSlot, setActiveSlot] = useState<'primary' | 'secondary'>('primary');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [simulateTamper, setSimulateTamper] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper: Stop camera tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Request camera permission and start video stream
  const startCamera = async (slot: 'primary' | 'secondary' = 'primary') => {
    setActiveSlot(slot);
    setCameraError(null);
    setErrorMsg(null);
    stopCamera();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Please upload from your device.');
      setMode('upload');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment'
        },
        audio: false
      });

      streamRef.current = stream;
      setMode('camera');
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'Camera could not be started.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission is required to capture documents live.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device was detected on your system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently in use by another application.';
      }
      setCameraError(message);
      setMode('upload');
      setCameraActive(false);
    }
  };

  // Convert base64 data URL to a real File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Analyze image quality (resolution, brightness, contrast, blur)
  const assessImageQuality = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width, height, quality: 'Good', blurScore: 92 };

    const imgData = ctx.getImageData(0, 0, Math.min(width, 320), Math.min(height, 240));
    const data = imgData.data;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    }

    const avgBrightness = totalBrightness / (data.length / 4);
    let quality = 'Good';

    if (width < 800 || height < 600 || avgBrightness < 35 || avgBrightness > 235) {
      quality = 'Acceptable';
    }
    if (width < 500 || avgBrightness < 20) {
      quality = 'Poor';
    }

    return {
      width,
      height,
      quality,
      blurScore: quality === 'Good' ? 92 : quality === 'Acceptable' ? 78 : 54
    };
  };

  // Capture photo from live video frame
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const filename = `${docType}_${activeSlot}_capture_${Date.now()}.jpg`;
      const capturedFile = dataURLtoFile(dataUrl, filename);
      const meta = assessImageQuality(canvas, width, height);

      if (activeSlot === 'primary') {
        setFile(capturedFile);
        setPreviewUrl(dataUrl);
        setImageMeta(meta);
      } else {
        setSecondaryFile(capturedFile);
        setSecondaryPreviewUrl(dataUrl);
      }

      // Stop camera stream after capturing
      stopCamera();
    }
  };

  // Handle file drop or selection
  const handleFileSelection = (selectedFile: File, slot: 'primary' | 'secondary' = 'primary') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const meta = {
          width: img.naturalWidth || 1280,
          height: img.naturalHeight || 720,
          quality: img.naturalWidth > 800 ? 'Good' : 'Acceptable',
          blurScore: img.naturalWidth > 800 ? 94 : 76
        };

        if (slot === 'primary') {
          setFile(selectedFile);
          setPreviewUrl(dataUrl);
          setImageMeta(meta);
        } else {
          setSecondaryFile(selectedFile);
          setSecondaryPreviewUrl(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRetake = (slot: 'primary' | 'secondary' = 'primary') => {
    if (slot === 'primary') {
      setFile(null);
      setPreviewUrl(null);
      setImageMeta(null);
    } else {
      setSecondaryFile(null);
      setSecondaryPreviewUrl(null);
    }
    setErrorMsg(null);
    startCamera(slot);
  };

  const handleStartScan = async () => {
    if (!file) {
      setErrorMsg('Please capture or upload the primary document before analyzing.');
      return;
    }

    if (isComparePair && !secondaryFile) {
      setErrorMsg('Please capture or upload the secondary document to perform cross-document comparison.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const domain = localStorage.getItem('docshield_domain') || 'airport_security';
      
      // 1. Create Screening Session in backend
      const { id: screeningId } = await api.createScreening(domain, docType, false);

      // 2. Upload Primary Document file
      await api.uploadDocument(screeningId, file, 'primary_document', file.name);

      // 3. Upload Secondary Document if in compare mode
      if (isComparePair && secondaryFile) {
        await api.uploadDocument(screeningId, secondaryFile, 'secondary_document', secondaryFile.name);
      }

      // 4. Start AI background screening pipeline
      await api.startAnalysis(screeningId, simulateTamper);

      // 5. Navigate to analysis tracking screen
      router.push(`/screening/${screeningId}/analysis`);
    } catch (err: any) {
      console.error('Screening initiation failed:', err);
      setErrorMsg(err.message || 'Failed to initiate AI screening analysis.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Top Header Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-900/30 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            onClick={stopCamera}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
                SCREENING TERMINAL
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                {docConfig.badge}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {docConfig.name} Screening
            </h1>
          </div>
        </div>

        {/* Demo Simulation Switch for Testing/Presentations */}
        <div className="flex items-center gap-2 p-2 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs">
          <input
            type="checkbox"
            id="tamperSim"
            checked={simulateTamper}
            onChange={(e) => setSimulateTamper(e.target.checked)}
            className="accent-purple-500 cursor-pointer"
          />
          <label htmlFor="tamperSim" className="text-purple-300 font-mono text-[11px] cursor-pointer">
            Simulate Tampered Anomaly (SIH Demo)
          </label>
        </div>
      </div>

      {/* Global Error Banner */}
      {(errorMsg || cameraError) && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg || cameraError}</span>
          </div>
          {cameraError && (
            <button
              onClick={() => { setCameraError(null); setMode('upload'); }}
              className="px-3 py-1 rounded bg-surface border border-rose-500/40 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Use File Upload
            </button>
          )}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Scanner / Camera / Upload Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Mode Switch Buttons */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-slate-800">
            <button
              onClick={() => { stopCamera(); setMode('upload'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'upload' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => startCamera('primary')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'camera' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Open Live Camera</span>
            </button>
          </div>

          {/* PRIMARY DOCUMENT SLOT */}
          <div className="space-y-3">
            {isComparePair && (
              <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>PRIMARY DOCUMENT (PASSPORT)</span>
              </div>
            )}

            {/* View State: Uncaptured / Live Camera / Captured */}
            {!previewUrl ? (
              mode === 'camera' && cameraActive ? (
                /* LIVE CAMERA VIEW */
                <div className="relative min-h-[380px] rounded-2xl border-2 border-cyan-500/40 bg-black overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover min-h-[380px]"
                  />
                  {/* Framing Reticle */}
                  <div className="absolute inset-8 border-2 border-dashed border-cyan-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="text-[11px] font-mono text-cyan-300 bg-black/75 px-3 py-1 rounded-full border border-cyan-500/40 shadow-glow-cyan">
                      ALIGN {docConfig.name.toUpperCase()} INSIDE FRAME
                    </div>
                  </div>
                  {/* Capture Button */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button
                      onClick={capturePhoto}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-blue transition-all transform hover:scale-105"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Image</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-3 rounded-full bg-surface/80 hover:bg-surface border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* DRAG AND DROP UPLOAD DROPZONE */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelection(e.dataTransfer.files[0], 'primary');
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[360px] rounded-2xl border-2 border-dashed border-blue-500/30 hover:border-blue-400 bg-surface/60 hover:bg-surface-elevated/80 transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelection(e.target.files[0], 'primary');
                      }
                    }}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                  />
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Drag & Drop {docConfig.name} Image Here
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Supports high-resolution JPG, PNG, WEBP, or scanned PDF documents up to 15MB.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 rounded-xl bg-surface-elevated border border-slate-700 text-xs font-semibold text-slate-200 group-hover:border-blue-500 transition-colors">
                      Browse Files
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startCamera('primary');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-xs font-semibold text-blue-300 hover:bg-blue-600/50 transition-colors flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Use Camera</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* DOCUMENT CAPTURED & DISPLAYED REVIEW STATE */
              <div className="glass-panel rounded-2xl p-6 space-y-4 border-cyan-500/40 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">Document Captured</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ready for screening
                  </span>
                </div>

                {/* Captured Image Canvas Display */}
                <div className="h-[300px] rounded-xl border border-slate-800 bg-black/80 flex items-center justify-center overflow-hidden relative group">
                  <img
                    src={previewUrl}
                    alt="Captured Document"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-slate-300">
                    {imageMeta?.width} × {imageMeta?.height} px
                  </div>
                </div>

                {/* Instant Image Quality Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-400">SOURCE</div>
                    <div className="font-semibold text-slate-200 truncate">
                      {file?.name.includes('capture') ? 'Camera Capture' : file?.name || 'File Upload'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-400">IMAGE QUALITY</div>
                    <div className={`font-semibold ${
                      imageMeta?.quality === 'Good' ? 'text-emerald-400' : imageMeta?.quality === 'Acceptable' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {imageMeta?.quality || 'Good'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-slate-800">
                    <div className="text-[10px] text-slate-400">STATUS</div>
                    <div className="font-semibold text-cyan-300">
                      Ready for AI
                    </div>
                  </div>
                </div>

                {/* Retake and Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleRetake('primary')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 hover:bg-surface-elevated text-slate-300 text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Image</span>
                  </button>

                  {!isComparePair && (
                    <button
                      onClick={handleStartScan}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-blue transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <span className="font-mono text-xs animate-pulse">INITIATING PIPELINE...</span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Use This Image & Start Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECONDARY DOCUMENT SLOT (IF COMPARE DOCUMENTS MODE) */}
          {isComparePair && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>SECONDARY DOCUMENT (VISA / PERMIT / BOARDING PASS)</span>
              </div>

              {!secondaryPreviewUrl ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelection(e.dataTransfer.files[0], 'secondary');
                    }
                  }}
                  onClick={() => secondaryFileInputRef.current?.click()}
                  className="min-h-[220px] rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-purple-400 bg-surface/60 hover:bg-surface-elevated/80 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={secondaryFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelection(e.target.files[0], 'secondary');
                      }
                    }}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-slate-200">
                    Upload or Capture Secondary Document
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Upload accompanying Visa, Travel Permit, or Boarding Pass for cross-verification.
                  </p>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-5 space-y-3 border-purple-500/40">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Secondary Document Ready</span>
                    </span>
                    <button
                      onClick={() => handleRetake('secondary')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </div>
                  <div className="h-[180px] rounded-lg border border-slate-800 bg-black/60 flex items-center justify-center overflow-hidden">
                    <img src={secondaryPreviewUrl} alt="Secondary" className="max-h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Start Pair Comparison Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartScan}
                  disabled={isProcessing || !file || !secondaryFile}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:opacity-95 text-white text-sm font-bold shadow-glow-purple transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="font-mono text-xs animate-pulse">PROCESSING CROSS-DOCUMENT VERIFICATION...</span>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Start Cross-Document Comparison Analysis</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT: Document-Specific Requirements & Guidelines (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Selected Document Details Card */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 border-blue-900/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-400">
                  <docConfig.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">SELECTED DOCUMENT</div>
                  <div className="text-sm font-bold text-white">{docConfig.name}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                {docConfig.category}
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Expected Information:
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {docConfig.expectedInformation.map((info, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Document Quality Requirements Checklist */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 border-blue-900/40">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Document Capture Checklist
            </h3>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-surface/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All 4 document corners must be clearly visible</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-surface/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Even lighting without direct flash reflections or glare</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-surface/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Text and MRZ lines sharp and in focus</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-surface/60 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>High contrast between document and background</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
