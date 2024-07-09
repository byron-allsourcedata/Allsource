
'use client';
import { useRouter } from 'next/navigation';

function RedirectPage() {
  const router = useRouter()
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
      if (token) {
        router.push('/dashboard');
      }
  }
}

export default RedirectPage;
