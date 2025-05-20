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

const ProgressBar = ({ progress }: ProgressBarProps) => {
  const percentage = progress?.processed
    ? (progress.processed / progress.total) * 100
    : 0;

  return (
    <div>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          width: "100%",
          height: "6px",
          backgroundColor: "rgba(217, 217, 217, 1)",
          borderRadius: "54px",
          overflow: 'hidden',
          "& .MuiLinearProgress-bar": {
            backgroundColor: "#3898FC",
            borderRadius: "54px",
          },
        }}
      />
    </div>
  );
};

export default ProgressBar;
