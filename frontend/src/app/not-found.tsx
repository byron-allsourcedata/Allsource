"use client";
import { Box, Typography, Button } from '@mui/material';

export default function FourOhFour() {
  const handleNavigate = () => {
    window.location.href = '/dashboard';
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '90vh',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src="/not-found404.svg"
        alt="404 Not Found"
        sx={{ maxWidth: '100%', width: 354, mb: 2 }}
      />
      <Typography className='paragraph' sx={{ mb: 2 }}>
        The page you&apos;re looking for was not found.
      </Typography>
      <Button variant="contained" onClick={handleNavigate} sx={{
                    backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito Sans", textTransform: 'none', lineHeight: '22.4px',
                    fontWeight: '700', padding: '1em 1em', textWrap: 'nowrap', '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' },
                    cursor: 'pointer'
                }}>
                    Go to Dashboard
                </Button>
    </Box>
  );
}