'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/reports');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center font-mono text-xs text-slate-400">
      REDIRECTING TO SCREENING HISTORY...
    </div>
  );
}
