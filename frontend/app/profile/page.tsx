'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Shield, 
  Mail, 
  Building2, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Lock, 
  Edit3, 
  LogOut,
  Save
} from 'lucide-react';
import { api } from '../../lib/api';
import { UserProfile } from '../../types';
import { signOutUser } from '../../lib/supabase';

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getMyProfile()
      .then((data) => {
        setProfile(data);
        setFullName(data.full_name);
        setOrganization(data.organization);
      })
      .catch(() => {
        setProfile({
          id: 'officer-1',
          email: 'officer@docshield.ai',
          full_name: 'Chief Security Analyst',
          role: 'analyst',
          domain: 'airport_security',
          organization: 'DocShield Security Command',
          created_at: new Date().toISOString(),
          screenings_completed: 18,
          status: 'Active & Authorized'
        });
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        email: profile?.email || 'officer@docshield.ai',
        full_name: fullName,
        organization
      });

      // Update local storage
      const savedUser = localStorage.getItem('docshield_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        u.full_name = fullName;
        u.organization = organization;
        localStorage.setItem('docshield_user', JSON.stringify(u));
      }

      setProfile(prev => prev ? ({ ...prev, full_name: fullName, organization }) : null);
      setIsEditing(false);
      setMsg('Profile updated successfully.');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert('Failed to update profile: ' + (err.message || 'Error'));
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-blue-900/30 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Authorized Officer</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            My Officer Profile
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="glass-panel rounded-3xl p-8 border-blue-500/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-0.5 shadow-glow-blue flex items-center justify-center text-white text-3xl font-bold">
            <div className="w-full h-full bg-surface rounded-[14px] flex items-center justify-center">
              {profile?.full_name?.charAt(0).toUpperCase() || 'O'}
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">{profile?.email}</div>
            <div className="text-xs text-cyan-300/80 font-mono">{profile?.organization}</div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Edit Form or Information Grid */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-slate-800 space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300">Organization / Command</label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-700 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold shadow-glow-blue flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-surface border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">ASSIGNED ROLE</div>
              <div className="text-sm font-bold text-white capitalize">{profile?.role || 'Security Analyst'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">DEFAULT DOMAIN</div>
              <div className="text-sm font-bold text-white capitalize">{profile?.domain?.replace('_', ' ') || 'Airport Security'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-slate-400">COMPLETED SCREENINGS</div>
              <div className="text-sm font-bold font-mono text-cyan-300">{profile?.screenings_completed || 0} Records</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
