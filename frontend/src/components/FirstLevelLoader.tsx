import React from 'react';
import { Box, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 5,
  borderRadius: 0,
  backgroundColor: '#c6dafc',
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    backgroundColor: '#4285f4',
  },
}));

const PageWithLoader: React.FC = () => {
  return (
    <>
        <Box sx={{ width: '100%', position: 'absolute', top: 0, zIndex: (theme) => theme.zIndex.drawer + 1, }}>
          <BorderLinearProgress
            variant="indeterminate"
          />
        </Box>
    </>
  );
};

export default PageWithLoader;
