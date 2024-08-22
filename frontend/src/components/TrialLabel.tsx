import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTrial } from '../context/TrialProvider';
import { useUser } from '../context/UserContext';

const TrialStatus: React.FC = () => {
  const { daysDifference } = useUser();
  const { trial } = useTrial();
  const [statusText, setStatusText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [iconColor, setIconColor] = useState('');

  useEffect(() => {
    if (trial) {
      if (daysDifference === null || daysDifference === undefined || isNaN(daysDifference)) {
        setStatusText('Trial Pending');
        setBackgroundColor('rgba(238, 238, 238, 1)');
        setTextColor('rgba(0, 0, 0, 1)');
        setIconColor('rgba(0, 0, 0, 1)');
      } else {
        if (daysDifference > 1) {
          setStatusText(`Trial Active ${daysDifference} days left`);
          setBackgroundColor('rgba(239, 250, 229, 1)');
          setTextColor('rgba(110, 193, 37, 1)');
          setIconColor('rgba(110, 193, 37, 1)');
        } else if (daysDifference === 1) {
          setStatusText(`Trial Active ${daysDifference} day left`);
          setBackgroundColor('rgba(248, 211, 211, 1)');
          setTextColor('rgba(224, 49, 48, 1)');
          setIconColor('rgba(224, 49, 48, 1)');
        } else {
          setStatusText('Trial Ended');
          setBackgroundColor('rgba(248, 211, 211, 1)');
          setTextColor('rgba(224, 49, 48, 1)');
          setIconColor('rgba(224, 49, 48, 1)');
        }
      }
    }
  }, [trial, daysDifference]);

  if (!trial) return null;

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 10px',
      backgroundColor: backgroundColor,
      borderRadius: '3.27px',
      color: textColor,
      fontSize: '14px',
      fontWeight: 500,
      '@media (min-width: 901px)': {
        marginRight: '2em'
      }
    }}>
      <Typography sx={{
        marginRight: '5px',
        fontFamily: 'Nunito',
        lineHeight: '19.1px',
        letterSpacing: '-0.02em',
        textAlign: 'left',
      }}>
        {statusText}
      </Typography>
      <AccessTimeIcon sx={{ color: iconColor }} />
    </Box>
  );
};

export default TrialStatus;
