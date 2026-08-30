'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function HistoryDetailRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/screening/${id}/result`);
    } else {
      router.replace('/reports');
    }
  }, [id, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center font-mono text-xs text-slate-400">
      LOADING PERSON SCREENING DOSSIER...
    </div>
  );
}
