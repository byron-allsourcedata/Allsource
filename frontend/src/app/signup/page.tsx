'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link, IconButton, InputAdornment, requirePropFactory } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { CenterFocusWeak } from '@mui/icons-material';

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [fontSize, setFontSize] = useState<string | number>('16px');

  interface Styles {
    container: {
      display: 'flex';
      flexDirection: 'column';
      alignItems: 'center';
      justifyContent: 'center';
      minHeight: '50vh';
      backgroundColor: '#ffffff';
      width: '100%';
      position: 'relative';
      maxWidth: '31rem';
      margin: '0 auto';
      marginTop: '120px';
      boxShadow: string;
      borderRadius: string;
      border: string;
    };
    '@media (max-width: 440px)'?: {
      container: {
        boxShadow: string;
        border: string;
        marginTop: string;
      };
    };
  }
  
  const styles: Styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '31rem',
      margin: '0 auto',
      position: 'relative',
      boxShadow: '0rem 2px 8px 0px #00000033',
      borderRadius: '0.625rem',
      border: '0.125rem solid transparent',
      marginTop: '120px'
    },
    '@media (max-width: 440px)': {
      container: {
        boxShadow: '0rem 0px 0px 0px #00000033',
        border: 'none',
        marginTop: '0'
      },
    },
  };

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
    <>
    <Box>
      <Box
        sx={{
          paddingLeft: '2.5rem',
          paddingRight: '0.5rem',
        }}
      >
        <Image src='/logo.svg' alt='logo' height={80} width={60} />
      </Box>

      <Box 
        sx={{
          ...styles.container, // Включаем стили из объекта styles.container
          '@media (max-width: 440px)': styles['@media (max-width: 440px)']?.container,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', fontSize:'28' , whiteSpace: 'nowrap', textAlign: 'center', padding: '1.5rem 1rem 2.5rem', fontFamily: 'Nunito' }}>
          Create a new account
        </Typography>
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
              borderColor: '#000000',
              backgroundColor: "white"
            },
            textTransform: 'none',
            width: '100%',
            maxWidth: '22.5rem',
            fontWeight: 'medium',
            fontSize: '0.875rem'
          }}
          disableFocusRipple={true}
          startIcon={
            <Image src="/google-icon.svg" alt="Google icon" width={20} height={20} />
          }
        >
          Sign in with Google
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '22.5rem', mb: 2, marginTop: '24px', marginBottom: '24px'  }}>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1 }} />
          <Typography variant="body1" sx={{ px: 2, fontWeight: 'regular', fontSize:'14px', fontFamily: 'Nunito'}}>
            OR
          </Typography>
          <Box sx={{ borderBottom: '1px solid #000000', flexGrow: 1}} />
        </Box>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: '360px', padding: '0 0px 24px', fontFamily: 'Nunito' }}>
          <TextField
          InputLabelProps={{
            sx: {
              fontFamily: 'Nunito',
              fontSize: '16'
            }
          }}
            label="Full name"
            variant="outlined"
            required
            fullWidth
          />
          <TextField
          InputLabelProps={{
            sx: {
              fontFamily: 'Nunito',
              fontSize: '16'
            }
          }}
            label="Email address"
            type="email"
            variant="outlined"
            fullWidth
            required
            margin="normal"

          />
          <TextField
            InputLabelProps={{
              sx: {
                fontFamily: 'Nunito',
                fontSize: '16',
                textTransform: 'none'
              }
            }}
            label="Create password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            fullWidth
            required
            margin="normal"
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
            sx={{ mt: 2, backgroundColor: '#F45745', color: '#FFFFFF', '&:hover': {
              borderColor: '#000000',
              backgroundColor: "lightgreen"
            }, 
            fontWeight: 'bold', 
            margin:'24px 0px 0 0px', 
            textTransform: 'none',
            minHeight: '3rem', 
            fontSize: '16', 
            fontFamily: 'Nunito'}}
            fullWidth
          >
            Activate Account
          </Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 2, margin: '40px 0px 24px', fontFamily: 'Nunito', fontSize: '16' }}>
          Already have an account{'  '}
          <Link href="/login" sx={{ color: '#F45745', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Nunito', textDecoration: 'none' }}>
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
    </>
  );
};

export default Signup;
