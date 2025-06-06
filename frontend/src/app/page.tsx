
'use client';
import { useUser } from '@/context/UserContext';

function RedirectPage() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/dashboard'
    }
    else {
      window.location.href = '/signin'
    }
  }
}

export default RedirectPage;
