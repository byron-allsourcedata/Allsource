import React from 'react';
import { LinearProgress } from '@mui/material';

type Progress = {
  total: number;
  processed: number;
  matched?: number;
};

interface ProgressBarProps {
  progress: Progress;
}

const FirstTimeScreen = () => {
  const percentage = 1

  return (
    <div>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{ 
            width: "100%", 
            borderRadius: "54px", 
            height: "8px", 
            backgroundColor: "rgba(217, 217, 217, 1)", 
            "& .MuiLinearProgress-barColorPrimary": {backgroundColor: "rgba(110, 193, 37, 1)"}}}
      />
    </div>
  );
};

export default FirstTimeScreen;
