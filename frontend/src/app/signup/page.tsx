'use client';
import Image from "next/image";
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment } from '@mui/material';
import { useRouter } from 'next/router';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Define Signup component
const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  /*const router = useRouter();*/

  const handleGoogleSignup = () => {
    // Implement Google signup logic here
    console.log('Google signup clicked');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Implement form submission logic here
    console.log('Form submitted');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxHeight: '95vh',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        boxShadow: '0px 2px 8px 0px #00000033',
        borderRadius: '10px',
        border: '2px solid transparent',
        width: '100%',
        maxWidth: '25%',
        margin: '0 auto',
        marginTop: '25vh'
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Create a new account
      </Typography>
      <Button
          variant="contained"
          color="primary"
          onClick={handleGoogleSignup}
          sx={{
            mb: 2,
            bgcolor: '#FFFFFF',
            color: '#000000',
            padding: '10px 80px',
            border: '2px solid transparent',
            '&:hover': {
              borderColor: '#000000',
            },
          }}
          disableRipple={true}
          startIcon={<img src="/google-icon.svg" style={{ width: '20px' }} />}
      >
        Sign in with Google
    </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 360, mb: 2 }}>
        <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
        <Typography variant="body1" sx={{ px: 2 }}>
          OR
        </Typography>
        <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 360 }}>
        <TextField
          label="Full name"
          variant="outlined"
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Email address"
          type="email"
          variant="outlined"
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Create password"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          margin="normal"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePasswordVisibility} edge="end">
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          type="submit"
          variant="contained"
          style={{ backgroundColor: '#F45745', color: '#FFFFFF' }}
          fullWidth
          sx={{ mt: 2 }}
        >
          ACTIVATE ACCOUNT
        </Button>
      </Box>
      <Typography variant="body2" sx={{ mt: 2, marginTop:'20px' }}>
        Already have an account{' '}
        <Link href="/login" sx={{ color: '#F45745', cursor: 'pointer' }}>
          Login
        </Link>
      </Typography>
    </Box>
  );
};

export default Signup;
