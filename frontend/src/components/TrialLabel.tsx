"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTrial } from '../context/TrialProvider';
import { useUser } from '../context/UserContext';
import PlanSlider from './PlanSlider';
import { useRouter } from 'next/navigation';


const TrialStatus: React.FC = () => {
  const { daysDifference } = useUser();
  const { trial } = useTrial();
  const [statusText, setStatusText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [iconColor, setIconColor] = useState('');
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (trial) {
      if (daysDifference === null || daysDifference === undefined || isNaN(daysDifference)) {
        setStatusText('Trial Pending');
        setBackgroundColor('rgba(238, 238, 238, 1)');
        setTextColor('rgba(0, 0, 0, 1)');
        setIconColor('rgba(0, 0, 0, 1)');
      } else {
        if (daysDifference > 1) {
          setStatusText(`${daysDifference} days Free Trial Left.`);
          setBackgroundColor('rgba(255, 233, 131, 1)');
          setTextColor('rgba(0, 0, 0, 1)');
          setIconColor('rgba(0, 0, 0, 1)');
        } else if (daysDifference === 1) {
          setStatusText(`${daysDifference} days Free Trial Left.`);
          setBackgroundColor('rgba(248, 211, 211, 1)');
          setTextColor('rgba(224, 49, 48, 1)');
          setIconColor('rgba(224, 49, 48, 1)');
        } else {
          setStatusText('Free Trial Expired');
          setBackgroundColor('rgba(246, 202, 204, 1)');
          setTextColor('rgba(78, 1, 16, 1)');
          setIconColor('rgba(224, 49, 48, 1)');
        }
      }
    }
  }, [trial, daysDifference]);

  if (!trial) return null;

  const handleOpenSlider = () => {
    setIsSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setIsSliderOpen(false)
  };

  const handleChoosePlanSlider = () => {
    router.push('/choose-plan')
  };

  return (
    <>
    <Box>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        backgroundColor: backgroundColor,
        borderRadius: '3.27px',
        color: textColor,
        fontSize: '14px',
        fontWeight: 500,
        marginRight: '2em',
        cursor: 'pointer',
        '@media (min-width: 901px)': {
        marginRight: '2em'
      }
      }}>
        {(statusText.includes('Free Trial Expired') || statusText.includes('Free Trial Left')) && (
          <AccessTimeIcon sx={{ color: iconColor }} />
        )}
        <Typography sx={{
          marginRight: '5px',
          fontFamily: 'Nunito',
          lineHeight: '19.1px',
          letterSpacing: '-0.02em',
          textAlign: 'left',
        }}>
          {statusText}
        </Typography>
        {(statusText.includes('Trial Pending')) && (
          <AccessTimeIcon sx={{ color: iconColor }} />
        )}
        {(statusText.includes('Free Trial Expired') || statusText.includes('Free Trial Left') || statusText.includes('Trial Pending')) && (
          <Button onClick={handleOpenSlider} sx={{ ml: 2, textTransform: 'none', padding:0, color: 'rgba(80, 82, 178, 1)' }}>
            <Typography sx={{
          marginRight: '5px',
          fontFamily: 'Nunito',
          lineHeight: '19.1px',
          letterSpacing: '-0.02em',
          textAlign: 'left',
        }}>
          Choose Plan
        </Typography>
          </Button>
        )}
      </Box>
      </Box>
      <PlanSlider open={isSliderOpen} handleClose={handleCloseSlider} handleChoosePlan={handleChoosePlanSlider}/>
     </>
    
  );
};

export default TrialStatus;
