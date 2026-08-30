'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Shield, 
  Home, 
  Clock, 
  User, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Scan
} from 'lucide-react';
import { api } from '../lib/api';
import { signOutUser } from '../lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [user, setUser] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Load local officer profile
    const savedUser = localStorage.getItem('docshield_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser({ full_name: 'Security Officer', email: 'officer@docshield.ai', role: 'analyst' });
      }
    } else {
      setUser({ full_name: 'Security Officer', email: 'officer@docshield.ai', role: 'analyst' });
    }

    // Load saved collapse state
    const savedCollapse = localStorage.getItem('docshield_sidebar_collapsed');
    if (savedCollapse === 'true') {
      setIsCollapsed(true);
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'false');
    }

    // Load unread notifications
    api.getUnreadNotificationsCount()
      .then(count => setUnreadCount(count))
      .catch(() => setUnreadCount(0));

    // Listen to external toggle events (e.g. from top navbar)
    const handleToggleEvent = () => {
      setIsCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('docshield_sidebar_collapsed', String(next));
        document.documentElement.setAttribute('data-sidebar-collapsed', String(next));
        window.dispatchEvent(new Event('sidebarStateChanged'));
        return next;
      });
    };

    const handleMobileToggle = () => {
      setIsMobileOpen(prev => !prev);
    };

    window.addEventListener('toggleSidebarMenu', handleToggleEvent);
    window.addEventListener('toggleMobileMenu', handleMobileToggle);

    return () => {
      window.removeEventListener('toggleSidebarMenu', handleToggleEvent);
      window.removeEventListener('toggleMobileMenu', handleMobileToggle);
    };
  }, [pathname]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('docshield_sidebar_collapsed', String(next));
    document.documentElement.setAttribute('data-sidebar-collapsed', String(next));
    window.dispatchEvent(new Event('sidebarStateChanged'));
  };

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  const navItems = [
    { name: 'HOME', href: '/dashboard', icon: Home },
    { name: 'HISTORY', href: '/reports', icon: Clock },
    { name: 'MY PROFILE', href: '/profile', icon: User },
    { 
      name: 'NOTIFICATIONS', 
      href: '/notifications', 
      icon: Bell, 
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { name: 'SETTINGS', href: '/settings', icon: Settings },
    { name: 'HELP / SUPPORT', href: '/help', icon: HelpCircle },
  ];

  // Do not render sidebar on login / signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const sidebarContent = (
    <div className={`flex flex-col h-full bg-[#070c18]/95 backdrop-blur-xl border-r border-blue-900/30 text-slate-300 transition-all duration-300 justify-between ${
      isCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-4'
    }`}>
      {/* Top Branding & Menu Toggle Symbol */}
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between px-1">
          <Link href="/dashboard" className="flex items-center gap-3 group overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-0.5 shadow-glow-blue flex items-center justify-center">
              <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                <Shield className="w-5 h-5 text-cyan-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="font-bold text-white tracking-wider text-base flex items-center gap-1.5 truncate">
                  <span>DOCSHIELD</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">AI</span>
                </div>
                <div className="text-[9px] font-mono text-slate-400 tracking-tight truncate">SECURITY COMMAND</div>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-surface/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
            title={isCollapsed ? "Expand Dashboard Menu" : "Collapse Dashboard Menu"}
            aria-label="Toggle Dashboard Menu"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl text-xs font-mono font-semibold transition-all ${
                  isCollapsed 
                    ? 'justify-center p-3 w-12 h-12 mx-auto relative group' 
                    : 'justify-between px-3.5 py-2.5 w-full'
                } ${
                  isActive
                    ? 'bg-blue-600/25 text-cyan-300 border border-blue-500/40 shadow-glow-blue/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {item.badge && (
                  isCollapsed ? (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse border border-slate-900" />
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                      {item.badge}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className={`pt-4 border-t border-slate-800/80 space-y-2 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <Link 
          href="/profile" 
          onClick={() => setIsMobileOpen(false)}
          title={isCollapsed ? user?.full_name || 'My Profile' : undefined}
          className={`flex items-center rounded-xl hover:bg-white/5 transition-colors group ${
            isCollapsed ? 'justify-center p-2 w-10 h-10' : 'gap-3 p-2'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-white/20 shadow-sm shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'O'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                {user?.full_name || 'Security Officer'}
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate">
                {user?.email || 'officer@docshield.ai'}
              </div>
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`flex items-center rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-colors ${
            isCollapsed ? 'justify-center p-2 w-10 h-10' : 'w-full gap-3 px-3.5 py-2'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className={`hidden md:block fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
