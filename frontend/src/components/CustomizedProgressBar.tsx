import React from 'react';
import { Box, Backdrop, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

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
  return (
        <Box sx={{ width: '100%', position: 'fixed', top: '4.25rem', left:'146px','@media (min-height: 900px)': { top:'4.25rem'} , '@media (max-width: 899px)': { left: 0, top:'4.5rem'}, }}>
          <BorderLinearProgress
            variant="indeterminate"
          />
        </Box>
  );
};

export default PageWithLoader;
