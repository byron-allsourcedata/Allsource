"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTrial } from '../context/TrialProvider';
import { useUser } from '../context/UserContext';
import PlanSlider from './PlanSlider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


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
        setStatusText('Trial Active');
        setBackgroundColor('#EAF8DD');
        setTextColor('#6EC125 !important');
        setIconColor('#6EC125');
      } else {
        if (daysDifference > 5) {
          setStatusText(`${daysDifference} days Free Trial Left.`);
          setBackgroundColor('#EAF8DD');
          setTextColor('#6EC125');
          setIconColor('#6EC125');
        } else if (daysDifference <= 5 && daysDifference > 0) {
          setStatusText(`${daysDifference} days Free Trial Left.`);
          setBackgroundColor('rgba(255, 233, 131, 1)');
          setTextColor('rgba(0, 0, 0, 1)');
          setIconColor('rgba(0, 0, 0, 1)');
        } else {
          setStatusText('Free Trial Expired');
          setBackgroundColor('rgba(246, 202, 204, 1)');
          setTextColor('rgba(78, 1, 16, 1)');
          setIconColor('rgba(103, 12, 14, 1)');
        }
      }
    }
    if (trial === false) {
      setStatusText('Trial Pending');
      setBackgroundColor('rgba(231, 231, 231, 1)');
      setTextColor('rgba(95, 99, 104, 1)');
      setIconColor('rgba(95, 99, 104, 1)');
    }
  }, [trial, daysDifference]);


  const handleOpenSlider = () => {
    setIsSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setIsSliderOpen(false)
  };

  const handleChoosePlanSlider = () => {
    router.push('/settings?section=subscription')
    setIsSliderOpen(false)
  };

  return (
    <>
      <Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6.25px 10px',
          backgroundColor: backgroundColor,
          borderRadius: '3.27px',
          color: textColor,
          fontSize: '14px',
          fontWeight: '500',
          '@media (min-width: 901px)': {
            marginRight: '2em'
          }
        }}>
          {(statusText.includes('Free Trial Expired')) && (
            <>
              <Image src={'danger.svg'} width={20} height={20} alt="danger" />
            </>
          )}
          {(statusText.includes('Free Trial Left')) && (
            <AccessTimeIcon sx={{ color: iconColor }} />
          )}
          <Typography sx={{
            marginRight: '5px',
            letterSpacing: '-0.02em',
            pt: '1px',
            fontFamily: 'Nunito Sans',
            fontSize: '16px',
            lineHeight: 'normal',
            textAlign: 'left',
            marginLeft: '3px'

          }}>
            {statusText}
          </Typography>
          {(statusText.includes('Trial Pending') || statusText.includes('Trial Active')) && (
            <AccessTimeIcon sx={{ color: iconColor }} />
          )}
          {(statusText.includes('Free Trial Expired') || statusText.includes('Free Trial Left')) && (
            <Button onClick={handleOpenSlider} sx={{ ml: 2, textTransform: 'none', padding: 0, color: 'rgba(80, 82, 178, 1) !important' }}>
              <Typography className='first-sub-title' sx={{
                color: 'rgba(80, 82, 178, 1) !important',
                marginRight: '5px',
                letterSpacing: '-0.02em',
                textAlign: 'left',
              }}>
                Choose Plan
              </Typography>
            </Button>
          )}
        </Box>
      </Box>
      <PlanSlider open={isSliderOpen} handleClose={handleCloseSlider} handleChoosePlan={handleChoosePlanSlider} />
    </>

  );
};

export default TrialStatus;
