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
    router.push('/signin');
  };
  
  return (
    <>
      <Box sx={confirmStyles.logoContainer}>
        <Image src='/logo.svg' alt='logo' height={30} width={50} />
      </Box>
      <Box sx={confirmStyles.mainContent}>
        <Box sx={confirmStyles.container}>
          <Typography variant="h4" component="h1" sx={confirmStyles.title}>
          Help is on the way
          </Typography>
          <Typography sx={confirmStyles.text}>
          Please check your email {email}. If you run into any hiccups, our support team is ready to rock 'n' roll and help you out.
          </Typography>
          <Typography sx={confirmStyles.text}>
            Please check your spam folder or <Link href="/reset-password" sx={confirmStyles.loginLink}>try sending again.</Link>
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
      </Box>
    </>
  );
};

export default ConfirmSend;
