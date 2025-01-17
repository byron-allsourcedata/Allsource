
'use client';
import { useUser } from '@/context/UserContext';

function RedirectPage() {
  const { partner } = useUser();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
      if (token) {
        if (partner) {
          window.location.href = '/partners'
        } else{
          window.location.href = '/dashboard'
        }
      }
      else {
        window.location.href = '/signin'
      }
  }
}

export default RedirectPage;
