// components/GoogleLogin.js
import React, { useEffect, useState } from 'react';
import { useGoogleOneTapLogin } from '@react-oauth/google';
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Image from 'next/image';

const GoogleLogin = () => {
  const router = useRouter();
  const [is_without_card, setIsWiithoutCard] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const is_without_card = searchParams.get('is_without_card');
    setIsWiithoutCard(is_without_card);
  }, []);

  const handleGoogleSignup = () => {
    login();
  };

  const login = useGoogleOneTapLogin({
    onSuccess: async tokenResponse => {
      const token = tokenResponse;
      console.log(token)
      try {
        const response = await axiosInterceptorInstance.post('/api/sign-up-google', {
          token: token,
          is_without_card: is_without_card,
        });

        if (response.data.status === 'SUCCESS') {
          router.push('/dashboard');
        } else if (response.data.status === 'NEED_CHOOSE_PLAN') {
          router.push('/choose-plan');
        } else {
          console.error('Authorization failed:', response.data.status);
        }
      } catch (error) {
        console.error('Error during Google login:', error);
      }
    },
    onError: error => {
      console.error('Login Failed:', error);
    },
  });

  return (
    <Button
      variant="contained"
      onClick={handleGoogleSignup}
      sx={{
        mb: 2,
        bgcolor: '#FFFFFF',
        color: '#000000',
        padding: '0.875rem 7.5625rem',
        whiteSpace: 'nowrap',
        border: '0.125rem solid transparent',
        '&:hover': {
          borderColor: 'grey.300',
          backgroundColor: 'white',
        },
        textTransform: 'none',
        width: '100%',
        maxWidth: '22.5rem',
        fontWeight: 'medium',
        fontSize: '0.875rem',
      }}
      disableFocusRipple
      startIcon={<Image src="/google-icon.svg" alt="Google icon" width={20} height={20} />}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleLogin;
