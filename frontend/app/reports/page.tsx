'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Plane, 
  Building2, 
  ShieldCheck, 
  Shield, 
  ArrowRight,
  User,
  Clock
} from 'lucide-react';
import { api } from '../../lib/api';
import { ScreeningDetail } from '../../types';

function RecentScansContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [screenings, setScreenings] = useState<ScreeningDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_risk' | 'lowest_risk'>('newest');

  useEffect(() => {
    loadScreenings();
  }, []);

  const loadScreenings = async () => {
    setLoading(true);
    try {
      const data = await api.listScreenings();
      setScreenings(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setScreenings([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = screenings.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (s.person_name || '').toLowerCase().includes(q);
      const matchId = (s.id || '').toLowerCase().includes(q);
      const matchDoc = (s.document_type || '').toLowerCase().includes(q);
      const matchDomain = (s.domain || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDoc && !matchDomain) return false;
    }
    if (domainFilter !== 'all' && s.domain !== domainFilter) return false;
    if (riskFilter !== 'all' && s.risk_level !== riskFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'manual_review' && !s.manual_review_required) return false;
      if (statusFilter !== 'manual_review' && s.status !== statusFilter) return false;
    }
    if (dateFilter !== 'all') {
      const scanDate = new Date(s.created_at).getTime();
      const now = new Date().getTime();
      if (dateFilter === 'today' && now - scanDate > 24 * 60 * 60 * 1000) return false;
      if (dateFilter === 'week' && now - scanDate > 7 * 24 * 60 * 60 * 1000) return false;
      if (dateFilter === 'month' && now - scanDate > 30 * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'highest_risk') return (b.risk_score || 0) - (a.risk_score || 0);
    if (sortBy === 'lowest_risk') return (a.risk_score || 0) - (b.risk_score || 0);
    return 0;
  });

  const getRiskBadge = (level: string, score: number) => {
    if (level === 'LOW_RISK') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {Math.round(score)}/100 &bull; LOW RISK
        </span>
      );
    } else if (level === 'REVIEW_RECOMMENDED') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {Math.round(score)}/100 &bull; REVIEW REQUIRED
        </span>
      );
    } else if (level === 'HIGH_RISK') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {Math.round(score)}/100 &bull; HIGH RISK
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
        INCONCLUSIVE
      </span>
    );
  };

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-900/30 pb-4">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Audit Trail & Investigation Logs</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Recent Scans & History
          </h1>
          <p className="text-xs text-slate-400">
            Search, review, and download official PDF reports for past screening subjects. Click any person to inspect all documents.
          </p>
        </div>

        <button
          onClick={loadScreenings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-xs font-semibold text-slate-300 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Person Name, Ref ID, Document..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-slate-800 focus:border-cyan-400 text-xs text-white placeholder-slate-500"
          />
        </div>

        <div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-slate-200"
          >
            <option value="all">All Domains</option>
            <option value="airline">Airlines</option>
            <option value="airport_security">Airport Security</option>
            <option value="immigration">Immigration</option>
            <option value="border_travel">Border & Travel</option>
          </select>
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-slate-200"
          >
            <option value="all">All Risk Levels</option>
            <option value="LOW_RISK">Low Risk</option>
            <option value="REVIEW_RECOMMENDED">Review Required</option>
            <option value="HIGH_RISK">High Risk</option>
          </select>
        </div>

        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-slate-200"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-slate-200"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highest_risk">Sort: Highest Risk</option>
            <option value="lowest_risk">Sort: Lowest Risk</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400">
          Loading screening records from database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Matching Screening Records</h3>
          <p className="text-xs text-slate-400">
            No records matched your search query or active filter constraints.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3.5">Screening Subject</th>
                  <th className="p-3.5">Screening Reference</th>
                  <th className="p-3.5">Domain</th>
                  <th className="p-3.5">Document Type</th>
                  <th className="p-3.5">Risk Evaluation</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-3.5 font-bold font-sans text-white">
                      <Link 
                        href={`/screening/${s.id}/result`}
                        className="text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{s.person_name || 'Screening Subject'}</span>
                      </Link>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      DS-{s.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3.5 capitalize font-sans">
                      {s.domain.replace('_', ' ')}
                    </td>
                    <td className="p-3.5 capitalize font-sans">
                      {s.document_type.replace('_', ' ')}
                    </td>
                    <td className="p-3.5">
                      {getRiskBadge(s.risk_level, s.risk_score)}
                    </td>
                    <td className="p-3.5 text-slate-400 font-sans text-[11px]">
                      {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-3.5 text-right font-sans space-x-2">
                      <Link
                        href={`/screening/${s.id}/result`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-slate-700 hover:bg-surface-elevated text-xs text-blue-400 hover:text-cyan-300 font-semibold"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Details</span>
                      </Link>
                      <button
                        onClick={() => api.downloadReport(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-xs text-cyan-300 font-semibold"
                        title="Download official PDF report"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default function RecentScansPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-slate-400">Loading screening logs...</div>}>
      <RecentScansContent />
    </Suspense>
  );
}
