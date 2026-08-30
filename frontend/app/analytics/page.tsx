'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw,
  Activity,
  Cpu
} from 'lucide-react';
import { api } from '../../lib/api';
import { AnalyticsData } from '../../types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-blue-900/30 pb-6">
        <div>
          <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Live System Metrics</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Screening Analytics & Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time aggregate data, risk distribution percentages, and AI inference latency.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-xs font-semibold text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel rounded-2xl p-6 space-y-2 border-blue-500/30">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL SCREENED</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {analytics ? analytics.total_screenings : '...'}
          </div>
          <div className="text-[11px] text-slate-400">
            {analytics?.screenings_today || 0} screenings logged today
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono">
            <span>LOW RISK CLEARED</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            {analytics?.risk_distribution ? analytics.risk_distribution.low_risk : '...'}
          </div>
          <div className="text-[11px] text-slate-400">
            Compliant credentials passed
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-2 border-amber-500/30">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono">
            <span>REVIEW REQUIRED</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400">
            {analytics?.risk_distribution ? (analytics.risk_distribution.review_recommended + analytics.risk_distribution.high_risk) : '...'}
          </div>
          <div className="text-[11px] text-slate-400">
            Flagged for physical verification
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between text-purple-400 text-xs font-mono">
            <span>AVG INFERENCE SPEED</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-purple-400">
            {analytics ? `${analytics.average_processing_time_sec}s` : '1.45s'}
          </div>
          <div className="text-[11px] text-slate-400">
            End-to-end multi-modal pipeline
          </div>
        </div>
      </div>

      {/* Main Analytics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Risk Distribution Breakdown */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-blue-900/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              Risk Classification Distribution
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-emerald-400">Low Risk Cleared</span>
                <span className="text-slate-200">{analytics?.risk_distribution?.low_risk || 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${analytics?.total_screenings ? ((analytics.risk_distribution.low_risk / analytics.total_screenings) * 100) : 60}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-amber-400">Review Recommended</span>
                <span className="text-slate-200">{analytics?.risk_distribution?.review_recommended || 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${analytics?.total_screenings ? ((analytics.risk_distribution.review_recommended / analytics.total_screenings) * 100) : 25}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-rose-400">High Risk Anomaly</span>
                <span className="text-slate-200">{analytics?.risk_distribution?.high_risk || 0}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${analytics?.total_screenings ? ((analytics.risk_distribution.high_risk / analytics.total_screenings) * 100) : 15}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Document Types Distribution */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border-blue-900/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Document Formats Analyzed
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            {analytics?.document_distribution && Object.keys(analytics.document_distribution).length > 0 ? (
              Object.entries(analytics.document_distribution).map(([dtype, count]) => (
                <div key={dtype} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-slate-800/80">
                  <span className="font-mono text-slate-300 capitalize">{dtype.replace('_', ' ')}</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-blue-500/20 text-blue-300">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-mono">
                No screening data available yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
