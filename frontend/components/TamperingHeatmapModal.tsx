'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Eye, Layers, AlertCircle, Sparkles } from 'lucide-react';
import { SuspiciousRegion } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  originalImageSrc?: string;
  heatmapBase64?: string;
  suspiciousRegions?: SuspiciousRegion[];
  signals?: Record<string, any>;
}

export const TamperingHeatmapModal: React.FC<Props> = ({
  isOpen,
  onClose,
  originalImageSrc,
  heatmapBase64,
  suspiciousRegions = [],
  signals = {}
}) => {
  const [opacity, setOpacity] = useState<number>(0.75);
  const [zoom, setZoom] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overlay' | 'split'>('overlay');

  if (!isOpen) return null;

  const displayHeatmap = heatmapBase64 || originalImageSrc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl border border-blue-500/30 bg-surface-elevated/95 p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Visual Tampering & Forensic Heatmap
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ELA & FFT SPECTRUM
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect local Error Level Analysis, pixel compression discontinuities, and high-frequency noise variance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border border-slate-800 bg-surface/60 text-xs">
          {/* View Mode */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">VIEW:</span>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'overlay' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overlay & Heatmap
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          {/* Opacity Slider */}
          {viewMode === 'overlay' && (
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono">HEATMAP OPACITY: {Math.round(opacity * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-32 accent-blue-500 cursor-pointer"
              />
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Canvas Area */}
        <div className="relative min-h-[380px] max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-black/60 flex items-center justify-center p-4">
          {viewMode === 'overlay' ? (
            <div
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
              {displayHeatmap ? (
                <img
                  src={displayHeatmap}
                  alt="Forensic Heatmap"
                  className="max-h-[440px] rounded-lg shadow-2xl object-contain"
                  style={{ opacity }}
                />
              ) : (
                <div className="text-center p-8 text-slate-500 font-mono text-xs">
                  Localization heatmap unavailable for this capture.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-2 text-center">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Original Document Capture</div>
                <div className="h-[340px] rounded-lg border border-slate-800 bg-surface flex items-center justify-center overflow-hidden">
                  {originalImageSrc ? (
                    <img src={originalImageSrc} alt="Original" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-500">Document Image</span>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-center">
                <div className="text-[11px] font-mono text-purple-400 uppercase">Tampering Spectral Heatmap</div>
                <div className="h-[340px] rounded-lg border border-purple-900/40 bg-surface flex items-center justify-center overflow-hidden">
                  {displayHeatmap ? (
                    <img src={displayHeatmap} alt="Heatmap" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-500">Heatmap Preview</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suspicious Regions Detail List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Detected Forensic Signals & Region Breakdown ({suspiciousRegions.length})
          </h4>

          {suspiciousRegions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suspiciousRegions.map((reg, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 flex items-start justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        REGION #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        Coords: ({reg.x}, {reg.y}) - {reg.width}x{reg.height}px
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{reg.reason}</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-400 shrink-0">
                    {Math.round(reg.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300 font-mono">
              ✓ No anomalous high-frequency pixel splicing or compression discontinuities detected.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TamperingHeatmapModal;

