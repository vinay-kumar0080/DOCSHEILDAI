'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Shield, 
  Plane, 
  Building2, 
  ShieldCheck, 
  Bell, 
  Search, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Menu
} from 'lucide-react';
import { api } from '../lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDomain, setCurrentDomain] = useState<string>('airport_security');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded'>('operational');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const savedDomain = localStorage.getItem('docshield_domain');
    if (savedDomain) setCurrentDomain(savedDomain);

    const savedCollapse = localStorage.getItem('docshield_sidebar_collapsed');
    setIsSidebarCollapsed(savedCollapse === 'true');

    const handleSidebarChange = () => {
      const isCol = localStorage.getItem('docshield_sidebar_collapsed') === 'true';
      setIsSidebarCollapsed(isCol);
    };

    window.addEventListener('sidebarStateChanged', handleSidebarChange);

    // Fetch system health & unread notifications
    api.getModelsStatus()
      .then(res => {
        if (res.status === 'operational') setSystemStatus('operational');
        else setSystemStatus('degraded');
      })
      .catch(() => setSystemStatus('operational'));

    api.getUnreadNotificationsCount()
      .then(count => setUnreadCount(count))
      .catch(() => setUnreadCount(0));

    return () => {
      window.removeEventListener('sidebarStateChanged', handleSidebarChange);
    };
  }, [pathname]);

  const handleDomainChange = (domain: string) => {
    setCurrentDomain(domain);
    localStorage.setItem('docshield_domain', domain);
    window.dispatchEvent(new Event('domainChanged'));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/reports?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      window.dispatchEvent(new Event('toggleMobileMenu'));
    } else {
      window.dispatchEvent(new Event('toggleSidebarMenu'));
    }
  };

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const domainOptions = [
    { id: 'immigration_officers', label: 'Immigration Officers', icon: ShieldCheck, color: 'text-cyan-400' },
    { id: 'border_security', label: 'Border Security', icon: Shield, color: 'text-emerald-400' },
    { id: 'airport_security', label: 'Airport Security', icon: Plane, color: 'text-blue-400' },
    { id: 'immigration_departments', label: 'Immigration Depts', icon: Building2, color: 'text-purple-400' },
    { id: 'law_enforcement', label: 'Law Enforcement', icon: ShieldCheck, color: 'text-indigo-400' }
  ];

  return (
    <header className={`sticky top-0 z-30 w-full border-b border-blue-900/30 bg-[#050814]/80 backdrop-blur-xl transition-all duration-300 ${
      isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Dashboard Menu Symbol + Domain Selector & Status */}
        <div className="flex items-center gap-3">
          {/* Dashboard Menu Symbol Button */}
          <button
            type="button"
            onClick={handleMenuClick}
            className="p-2 rounded-xl bg-surface/90 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-cyan-300 transition-colors shadow-sm"
            title="Toggle Dashboard Menu (Expand / Collapse)"
            aria-label="Toggle Dashboard Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="relative inline-flex items-center">
            <select
              value={currentDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="appearance-none bg-surface/90 border border-blue-500/30 hover:border-blue-400 text-xs font-semibold text-slate-200 pl-3 pr-8 py-1.5 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
            >
              {domainOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-surface text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* System Status Indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border border-white/10 bg-slate-900/60 text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${systemStatus === 'operational' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{systemStatus === 'operational' ? 'AI SERVICES READY' : 'DEGRADED'}</span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Person Name, Screening ID (e.g. John Doe, DS-A123)..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-surface/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-200 placeholder-slate-500 transition-colors font-mono"
          />
        </form>

        {/* Right Actions: Notifications & Profile */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl bg-surface/70 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/domains"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>New Screening</span>
          </Link>
        </div>

      </div>
    </header>
  );
}
