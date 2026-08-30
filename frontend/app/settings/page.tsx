'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Sliders, 
  Database, 
  Bell, 
  Lock, 
  Eye, 
  Save, 
  RotateCcw,
  CheckCircle2,
  Cpu,
  HardDrive,
  Globe,
  Trash2
} from 'lucide-react';
import { api } from '../../lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'security' | 'application' | 'privacy'>('account');
  const [modelsStatus, setModelsStatus] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Preference states
  const [theme, setTheme] = useState<string>('dark');
  const [language, setLanguage] = useState<string>('en');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [retentionHours, setRetentionHours] = useState<number>(24);
  const [autoMrz, setAutoMrz] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<string>('standard');

  useEffect(() => {
    // Load model diagnostics
    api.getModelsStatus()
      .then(data => setModelsStatus(data))
      .catch(() => null);

    // Load persisted settings
    api.getSystemSettings()
      .then(res => {
        if (res.preferences) {
          if (res.preferences.theme) setTheme(res.preferences.theme);
          if (res.preferences.language) setLanguage(res.preferences.language);
          if (res.preferences.timezone) setTimezone(res.preferences.timezone);
          if (res.preferences.retention_hours) setRetentionHours(res.preferences.retention_hours);
          if (res.preferences.sensitivity) setSensitivity(res.preferences.sensitivity);
        }
      })
      .catch(() => null);
  }, []);

  const handleSave = async () => {
    try {
      await api.updateSystemSettings({
        theme,
        language,
        timezone,
        retention_hours: retentionHours,
        sensitivity,
        auto_mrz_validation: autoMrz
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save settings: ' + (err.message || 'Error'));
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'application', label: 'Application & Diagnostics', icon: Cpu },
    { id: 'privacy', label: 'Privacy & Retention', icon: HardDrive },
  ];

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-blue-900/30 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Configuration Panel</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Terminal Settings</span>
          </h1>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-blue transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Preferences</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved to database successfully.</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Tab Buttons */}
        <div className="space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  active
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content */}
        <div className="md:col-span-3 glass-panel rounded-3xl p-6 border-slate-800 space-y-6">
          
          {/* 1. ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Account Information</h3>
                <p className="text-xs text-slate-400">Manage officer credentials and session authorization.</p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Terminal Email</label>
                  <input
                    type="email"
                    disabled
                    value="officer@docshield.ai"
                    className="w-full px-3 py-2 rounded-xl bg-surface/50 border border-slate-800 text-xs font-mono text-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Current Clearance Level</label>
                  <div className="p-3 rounded-xl bg-surface border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300">LEVEL 4 — AUTHORIZED EXAMINER</span>
                    <span className="text-emerald-400 font-mono text-[10px]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Interface & Regional Preferences</h3>
                <p className="text-xs text-slate-400">Configure timezones, languages, and layout presets.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-white"
                  >
                    <option value="en">English (ICAO Standard)</option>
                    <option value="fr">Français (French)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="de">Deutsch (German)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-white"
                  >
                    <option value="UTC">UTC / GMT (Zulu Standard)</option>
                    <option value="EST">EST (US Eastern)</option>
                    <option value="PST">PST (US Pacific)</option>
                    <option value="IST">IST (India Standard Time)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Security & Authentication Protocols</h3>
                <p className="text-xs text-slate-400">Multi-factor authentication and session authorization.</p>
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</div>
                    <div className="text-[11px] text-slate-400">Require biometric hardware security key / OTP.</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                    CONFIGURED (SSO)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. APPLICATION & DIAGNOSTICS */}
          {activeTab === 'application' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Live AI Subsystem Diagnostics</h3>
                <p className="text-xs text-slate-400">Verified deep learning models and execution state.</p>
              </div>

              <div className="space-y-3">
                {modelsStatus?.models ? (
                  modelsStatus.models.map((m: any) => (
                    <div key={m.name} className="p-3.5 rounded-xl bg-surface border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.source} &bull; {m.device}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {m.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-slate-400">Checking model availability...</div>
                )}
              </div>
            </div>
          )}

          {/* 5. PRIVACY & RETENTION */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white">Data Privacy & Document Retention</h3>
                <p className="text-xs text-slate-400">Automatic purging and zero long-term raw biometric caching.</p>
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">Document Retention Policy</label>
                  <select
                    value={retentionHours}
                    onChange={(e) => setRetentionHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-slate-800 text-xs text-white"
                  >
                    <option value={1}>1 Hour (Strict Immediate Purge)</option>
                    <option value={24}>24 Hours (Standard Shift Audit)</option>
                    <option value={72}>72 Hours (Extended Investigation)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-cyan-300 leading-relaxed">
                  Notice: DocShield AI never exposes face embeddings or raw identity documents to public endpoints. All storage operations are encrypted on disk.
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
