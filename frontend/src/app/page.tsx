
'use client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

function RedirectPage() {
  const { partner } = useUser();
  const router = useRouter()
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
      if (token) {
        router.push(partner ? '/partners' : '/dashboard');
      }
      else {
        router.push('/signin')
      }
  }
}

export default RedirectPage;
