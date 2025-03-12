import React from 'react';
import { Box, Backdrop, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNotification } from '../context/NotificationContext';


const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 4,
  borderRadius: 0,
  backgroundColor: '#c6dafc',
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    backgroundColor: '#4285f4',
  },
}));

const PageWithLoader: React.FC = () => {
  const { hasNotification } = useNotification();
  return (
        <Box sx={{ width: '100%', position: 'fixed', top: hasNotification ? '6.85rem' : '4.25rem', zIndex: 1200, left:'154px','@media (min-height: 900px)': { top:'4.25rem'} , '@media (max-width: 899px)': { left: 0, top:'4.5rem'}, }}>
          <BorderLinearProgress
            variant="indeterminate"
          />
        </Box>
  );
};

export default PageWithLoader;
