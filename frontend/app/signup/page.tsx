'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, User, Building2, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithGoogle } from '../../lib/supabase';
import { api } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('Border Control Authority');
  const [domain, setDomain] = useState('airport_security');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);

    try {
      await api.updateProfile({
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'analyst',
        domain: domain as any,
        organization: organization.trim()
      }).catch(() => null);

      localStorage.setItem('docshield_domain', domain);
      localStorage.setItem('docshield_user', JSON.stringify({
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'analyst',
        organization: organization.trim()
      }));

      router.push('/dashboard');
    } catch (err: any) {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel rounded-3xl p-8 border-blue-500/30 relative shadow-2xl">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-0.5 shadow-glow-blue mb-1">
            <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Register Screening Officer
          </h1>
          <p className="text-xs text-slate-400">
            Create an authorized identity screening terminal account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase">Officer Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Capt. Marcus Vance"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase">Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@agency.gov"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 uppercase">Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 text-xs text-slate-100"
              >
                <option value="airport_security">Airport Security</option>
                <option value="airline">Airlines</option>
                <option value="immigration">Immigration</option>
                <option value="border_travel">Border Control</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 uppercase">Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Border Agency"
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 uppercase">Security PIN / Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-slate-800 focus:border-blue-500 text-sm text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold shadow-glow-blue transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <span>Registering...</span> : <span>Create Account</span>}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-cyan-300 font-semibold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
