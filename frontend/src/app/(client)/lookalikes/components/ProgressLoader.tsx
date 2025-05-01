import React from 'react';
import { LinearProgress } from '@mui/material';

type Progress = {
  total: number;
  processed: number;
};

interface ProgressBarProps {
  progress: Progress;
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
  const percentage = progress?.processed 
  ? (progress.processed / progress.total) * 100 
  : 0; 
  console.log(percentage);
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

export default ProgressBar;
