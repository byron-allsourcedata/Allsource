'client'
import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';

const AudienceDashboard = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4">
        <Skeleton width="60%" />
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
        <Skeleton variant="rectangular" height={80} />
        <Skeleton variant="rectangular" height={80} />
        <Skeleton variant="rectangular" height={80} />
      </Box>
    </Box>
  );
};

export default AudienceDashboard;