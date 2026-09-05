import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

interface CameraCaptureProps {
  documentTitle: string;
  onCapture: (file: File, previewUrl: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  documentTitle,
  onCapture,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this environment.');
      setIsInitializing(false);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Camera access was denied or device is unavailable.';
      if (err.name === 'NotFoundError') msg = 'No camera device was detected.';
      if (err.name === 'NotReadableError') msg = 'Camera is currently locked by another application.';
      setCameraError(msg);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      onCapture(file, previewUrl);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            Live Ingestion Viewfinder — {documentTitle}
          </h3>
          <p className="text-[11px] text-slate-400">
            Align the document within the frame and capture in good lighting
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-900 border border-slate-700"
        >
          Cancel
        </button>
      </div>

      {cameraError ? (
        <div className="p-6 text-center space-y-3 bg-rose-950/20 border border-rose-500/30 rounded-xl">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry Camera
          </button>
        </div>
      ) : (
        <div className="relative aspect-[16/10] bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
          {isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 text-xs font-mono text-cyan-400">
              INITIALIZING HARDWARE CAMERA STREAM...
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Document Framing Overlay */}
          <div className="absolute inset-8 border-2 border-dashed border-cyan-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4">
            <div className="flex justify-between">
              <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
            </div>
            <div className="text-center font-mono text-[11px] text-cyan-300/80 bg-slate-950/70 px-3 py-1 rounded-full mx-auto backdrop-blur-sm">
              PLACE ENTIRE {documentTitle.toUpperCase()} FLAT INSIDE BORDER
            </div>
            <div className="flex justify-between">
              <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            </div>
          </div>
        </div>
      )}

      {!cameraError && !isInitializing && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCaptureFrame}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-mono tracking-wider shadow-glow-cyan flex items-center gap-2 transition-all"
          >
            <Camera className="w-4 h-4" />
            CAPTURE HIGH-RES FRAME
          </button>
        </div>
      )}
    </div>
  );
};
