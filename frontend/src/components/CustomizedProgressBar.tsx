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
    <>
      <Backdrop
        open={true}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ width: '100%', position: 'absolute', top: 0 }}>
          <BorderLinearProgress
            variant="indeterminate"
          />
        </Box>
      </Backdrop>
    </>
  );
};

export default PageWithLoader;
