import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('Supabase URL not configured. Simulating Google OAuth login for development.');
    localStorage.setItem('docshield_user', JSON.stringify({
      email: 'officer.google@docshield.ai',
      full_name: 'Security Inspector (Google Auth)',
      role: 'analyst',
      domain: 'airport_security',
      provider: 'google'
    }));
    return { data: { user: { email: 'officer.google@docshield.ai' } }, error: null };
  }

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });
}

export async function signOutUser() {
  localStorage.removeItem('docshield_user');
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('Supabase sign out error:', err);
  }
}
