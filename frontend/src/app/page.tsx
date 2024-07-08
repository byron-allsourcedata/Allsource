
'use client';
import { useRouter } from 'next/navigation';

function RedirectPage() {
  const router = useRouter()
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
      if (token) {
        router.push('/dashboard');
      }
      else {
        router.push('/login')
      }
  }
}

export default RedirectPage;