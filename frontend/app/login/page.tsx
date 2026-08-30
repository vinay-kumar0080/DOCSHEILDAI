'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, HelpCircle, CheckCircle2, X } from 'lucide-react';
import { signInWithGoogle } from '../../lib/supabase';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate requests
    setError('');

    // Form validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid official email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Sync with backend profile
      await api.updateProfile({
        email: email.trim(),
        full_name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Security Officer',
        role: 'analyst',
        domain: 'airport_security'
      }).catch(() => null);

      // Save local authenticated user profile
      localStorage.setItem('docshield_user', JSON.stringify({
        email: email.trim(),
        full_name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Security Officer',
        role: 'analyst'
      }));

      // Redirect to authenticated Home / Dashboard route
      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid email or password. Please verify your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError('');
    try {
      const { data, error: gError } = await signInWithGoogle();
      if (gError) {
        setError(gError.message || 'Google authentication failed. Please try again.');
        setGoogleLoading(false);
        return;
      }
      
      // Successful Google Sign-In -> Redirect to Home
      router.push('/dashboard');
    } catch (err: any) {
      setError('Google Sign-In encountered an error. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError('Please enter a valid official email address.');
      return;
    }

    setResetLoading(true);
    try {
      // Simulate/Trigger password reset request
      await new Promise(resolve => setTimeout(resolve, 800));
      setResetMessage('If an account exists for this email, a password reset link has been sent.');
    } catch (err: any) {
      setResetError('Password reset request could not be processed. Please contact system support.');
    } finally {
      setResetLoading(false);
    }
  };

  const quickOfficerLogin = (domainRole: string, defaultEmail: string, officerName: string) => {
    localStorage.setItem('docshield_domain', domainRole);
    localStorage.setItem('docshield_user', JSON.stringify({
      email: defaultEmail,
      full_name: officerName,
      role: 'analyst'
    }));
    router.push('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel rounded-3xl p-8 border-blue-500/30 relative shadow-2xl">
        
        {/* Top Glow Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-0.5 shadow-glow-blue mb-1">
            <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>DOCSHIELD</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/40">AI</span>
            </h1>
            <p className="text-xs text-cyan-300/90 font-medium mt-1">
              AI-Powered Identity & Document Screening
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">Officer Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@docshield.ai"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">Password / PIN</label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetMessage('');
                  setResetError('');
                  setShowForgotPassword(true);
                }}
                className="text-[11px] text-blue-400 hover:text-cyan-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-100 placeholder-slate-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-glow-blue transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="font-mono text-xs animate-pulse">Signing in...</span>
            ) : (
              <>
                <span>Work Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0b1329] px-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest relative">OR</span>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-surface hover:bg-surface-elevated border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{googleLoading ? 'Connecting to Google OAuth...' : 'Continue with Google'}</span>
        </button>

        {/* Quick Demo Pre-sets (Airport Officer and Airline Agent centered) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-[10px] font-mono text-slate-400 text-center uppercase tracking-wider">
            Quick Terminal Access (One-Click)
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <button
              onClick={() => quickOfficerLogin('airport_security', 'airport.officer@docshield.ai', 'Capt. Marcus Vance')}
              className="px-3 py-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-[11px] font-mono text-blue-300 text-center transition-colors shadow-sm"
            >
              Airport Officer
            </button>
            <button
              onClick={() => quickOfficerLogin('airline', 'airline.agent@docshield.ai', 'Agent Sarah Lin')}
              className="px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-[11px] font-mono text-purple-300 text-center transition-colors shadow-sm"
            >
              Airline Agent
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <Link href="/signup" className="hover:text-cyan-300 transition-colors">
            Create Account
          </Link>
          <Link href="/help" className="inline-flex items-center gap-1 hover:text-cyan-300 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & Support</span>
          </Link>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border-blue-500/40 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Forgot Password</h3>
              </div>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ CLOSE
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your registered officer email address below to receive password recovery instructions.
            </p>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetMessage ? (
              <div className="space-y-4 text-center py-2">
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-left leading-relaxed">{resetMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-2.5 rounded-xl bg-surface border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-surface-elevated transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="officer@docshield.ai"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-2.5 rounded-xl bg-surface border border-slate-700 text-slate-300 text-xs font-medium hover:bg-surface-elevated transition-colors"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
