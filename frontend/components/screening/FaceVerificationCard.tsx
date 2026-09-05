import React, { useRef, useState, useEffect } from 'react';
import { Camera, ScanFace, CheckCircle2, AlertTriangle, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react';

interface FaceVerificationCardProps {
  documentFaceBase64?: string;
  onLiveFaceCaptured: (file: File) => void;
  similarityScore?: number;
  faceStatus?: string;
  isProcessing: boolean;
  onFinalize: () => void;
}

export const FaceVerificationCard: React.FC<FaceVerificationCardProps> = ({
  documentFaceBase64,
  onLiveFaceCaptured,
  similarityScore,
  faceStatus,
  isProcessing,
  onFinalize
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [capturedLiveUrl, setCapturedLiveUrl] = useState<string | null>(null);

  const startLiveCamera = async () => {
    setIsCameraOpen(true);
    setCapturedLiveUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.error('Camera error', e);
    }
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 640, 640);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'live_selfie.jpg', { type: 'image/jpeg' });
      setCapturedLiveUrl(URL.createObjectURL(blob));
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setIsCameraOpen(false);
      onLiveFaceCaptured(file);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Stage 5: Live Biometric Face Verification (1:1 SFace Comparison)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Compare extracted document photograph with live subject camera capture
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Extracted Document Portrait */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Extracted Document Portrait
          </span>
          <div className="w-40 h-48 mx-auto bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
            {documentFaceBase64 ? (
              <img
                src={`data:image/jpeg;base64,${documentFaceBase64}`}
                alt="Extracted Document Face"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-3 text-slate-500 space-y-1">
                <ScanFace className="w-8 h-8 mx-auto text-slate-600" />
                <span className="text-[10px] font-mono block">Portrait extracted from primary credential</span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block">
            {documentFaceBase64 ? 'PORTRAIT RESOLVED' : 'CREDENTIAL SOURCE'}
          </span>
        </div>

        {/* Right: Live Camera Feed */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Live Subject Camera Capture
          </span>
          <div className="w-40 h-48 mx-auto bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center relative">
            {capturedLiveUrl ? (
              <img src={capturedLiveUrl} alt="Captured Live Face" className="w-full h-full object-cover" />
            ) : isCameraOpen ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-3 text-slate-500 space-y-1">
                <Camera className="w-8 h-8 mx-auto text-slate-600" />
                <span className="text-[10px] font-mono block">Live camera stream</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            {!isCameraOpen && !capturedLiveUrl && (
              <button
                type="button"
                onClick={startLiveCamera}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" /> Start Live Camera
              </button>
            )}

            {isCameraOpen && (
              <button
                type="button"
                onClick={captureLivePhoto}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold font-mono flex items-center gap-1.5 animate-pulse"
              >
                <Camera className="w-3.5 h-3.5" /> Capture Frame
              </button>
            )}

            {capturedLiveUrl && (
              <button
                type="button"
                onClick={startLiveCamera}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold font-mono flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Retake
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verification Verdict & Finalize Button */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-surface border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
            Biometric Match Signal
          </span>
          <span className="text-xs font-bold text-white font-mono">
            {similarityScore !== undefined && similarityScore > 0
              ? `SIMILARITY: ${(similarityScore * 100).toFixed(1)}% — ${faceStatus || 'EVALUATED'}`
              : 'READY TO RUN CROSS-DOCUMENT CONSISTENCY & DECISION REPORT'}
          </span>
        </div>

        <button
          type="button"
          onClick={onFinalize}
          disabled={isProcessing}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold font-mono tracking-wider shadow-glow-cyan flex items-center gap-2 transition-all"
        >
          <span>{isProcessing ? 'CALCULATING OVERALL RISK...' : 'FINALIZE & VIEW DOSSIER'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
