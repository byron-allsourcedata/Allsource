'use client';
import React, { useState, useEffect } from 'react';
import { useRouter} from 'next/navigation';
import Image from 'next/image';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import { confirmStyles } from './confirmStyles';



const ConfirmSend: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMe = sessionStorage.getItem('me');
      setEmail(storedMe ? JSON.parse(storedMe)?.email : null);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push('/login');
  };
  
  return (
    <>
      <Box sx={confirmStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>
      <Box sx={confirmStyles.container}>
        <Typography variant="h4" component="h1" sx={confirmStyles.title}>
        Help is on the way
        </Typography>
        <Typography sx={confirmStyles.text}>
        If <strong>{email}</strong> exists, you will receive an email there shortly.
        </Typography>
        <Typography sx={confirmStyles.text}>
         If you haven’t received an email within that timeframe, please check your spam folder or <Link href="/reset_password" sx={confirmStyles.loginLink}>try sending again.</Link>
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={confirmStyles.form}>
          <Button
            type="submit"
            variant="contained"
            sx={confirmStyles.submitButton}
            fullWidth
          >
            Back to login
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default ConfirmSend;
