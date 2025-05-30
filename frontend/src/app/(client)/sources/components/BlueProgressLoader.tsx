import React from 'react';
import { LinearProgress } from '@mui/material';

type Progress = {
  total: number;
  processed: number;
  matched?: number;
  reversed?: boolean;
};

interface ProgressBarProps {
  progress: Progress;
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
  const percentage = progress?.processed
    ? (progress.processed / progress.total) * 100
    : 0;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          width: "100%",
          height: "6px",
          backgroundColor: "rgba(56, 152, 252, 1)",
          borderRadius: "54px",
          overflow: 'hidden',
          transform: progress.reversed ? 'rotate(180deg)' : 'none',
          "& .MuiLinearProgress-bar": {
            backgroundColor: "rgba(207, 216, 226, 1)",
          },
        }}
      />
    </div>
  );
};

export default ProgressBar;
