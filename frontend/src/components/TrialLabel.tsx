"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Image from 'next/image';
import useAxios from 'axios-hooks';
import PlanSlider from './PlanSlider';
import { useRouter } from 'next/navigation';

const TrialStatus: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      setAccessToken(token);
    }
  }, []);

  const [{ data }, refetch] = useAxios(
    {
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}me`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'GET',
    },
    { manual: !accessToken}
  );

  useEffect(() => {
    if (accessToken) {
      refetch();
    }
  }, [accessToken]);

  const [statusText, setStatusText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [iconColor, setIconColor] = useState('');
  const router = useRouter();
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  useEffect(() => {
    if (data) {
      const { user_info, user_plan } = data;
      if (user_info && user_plan) {
        const { is_trial, plan_end, is_trial_pending } = user_plan;

        if (is_trial_pending !== undefined) {
          updateStatus(is_trial_pending);
        } else if (plan_end !== undefined) {
          const calculatedDaysDifference = calculateDaysDifference(plan_end);
          if (calculatedDaysDifference !== null) {
            updateStatus(false);
          }
        }
      }
    }
  }, [data]);

  const calculateDaysDifference = (endDate: string) => {
    const currentDate = new Date();
    const endDateObj = new Date(endDate);
  
    if (isNaN(endDateObj.getTime())) {
      return -1;
    }
  
    const timeDifference = endDateObj.getTime() - currentDate.getTime();

    if (timeDifference < 0) {
      return -1;
    }

    if (
      currentDate.getFullYear() === endDateObj.getFullYear() &&
      currentDate.getMonth() === endDateObj.getMonth() &&
      currentDate.getDate() === endDateObj.getDate()
    ) {
      return 0;
    }
  
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  
    return daysDifference;
  };
  
  

  const plan_days = calculateDaysDifference(data?.user_plan?.plan_end)
  const check_active = data?.user_plan?.plan_end
  const trialstatus = data?.user_plan?.is_trial

  const updateStatus = (isTrialPending: boolean) => {
    if (isTrialPending) {
      setStatusText('Trial Pending');
      setBackgroundColor('rgba(231, 231, 231, 1)');
      setTextColor('rgba(95, 99, 104, 1)');
      setIconColor('rgba(95, 99, 104, 1)');
    } else if (trialstatus) {
      if (plan_days !== undefined && plan_days <= 5 && plan_days >= 0) {
        setStatusText(`${plan_days} days Free Trial left`);
        setBackgroundColor('rgba(255, 233, 131, 1)');
        setTextColor('rgba(0, 0, 0, 1)');
        setIconColor('rgba(0, 0, 0, 1)');
      } else if (plan_days < 0 && check_active !==null ) {
        setStatusText('Free Trial Expired');
        setBackgroundColor('rgba(246, 202, 204, 1)');
        setTextColor('rgba(78, 1, 16, 1)');
        setIconColor('rgba(103, 12, 14, 1)');
      } else if (plan_days > 0) {
        setStatusText(`${plan_days} days Free Trial left`);
        setBackgroundColor('#EAF8DD');
        setTextColor('#6EC125');
        setIconColor('#6EC125');
      } else if (check_active == null) {
        setStatusText('Free Trial Active');
        setBackgroundColor('#EAF8DD');
        setTextColor('#6EC125');
        setIconColor('#6EC125');
      }
    } else {
      if (plan_days !== undefined && plan_days <= 5 && plan_days >= 0) {
        setStatusText(`${plan_days} days left`);
        setBackgroundColor('rgba(255, 233, 131, 1)');
        setTextColor('rgba(0, 0, 0, 1)');
        setIconColor('rgba(0, 0, 0, 1)');
      } else if (plan_days < 0 && check_active !==null ) {
        setStatusText('Subscription Expired');
        setBackgroundColor('rgba(246, 202, 204, 1)');
        setTextColor('rgba(78, 1, 16, 1)');
        setIconColor('rgba(103, 12, 14, 1)');
      } else if (plan_days > 0) {
        setStatusText(`${plan_days} days left`);
        setBackgroundColor('#EAF8DD');
        setTextColor('#6EC125');
        setIconColor('#6EC125');
      } else {
        setStatusText('Subscription Active');
        setBackgroundColor('#EAF8DD');
        setTextColor('#6EC125');
        setIconColor('#6EC125');
      }
    }
  };

  const handleOpenSlider = () => {
    setIsSliderOpen(true);
  };

  const handleCloseSlider = () => {
    setIsSliderOpen(false);
  };

  const handleChoosePlanSlider = () => {
    router.push('/settings?section=subscription');
    setIsSliderOpen(false);
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
          {(statusText.includes('Expired')) && (
            <>
              <Image src={'danger.svg'} width={17} height={17} alt="danger" />
            </>
          )}
          {(statusText.includes('left') || statusText.includes('Left')) && (
            <AccessTimeIcon sx={{ color: iconColor, fontSize: '18px' }} />
          )}
          <Typography sx={{
            marginRight: '5px',
            letterSpacing: '-0.02em',
            pt: '1px',
            fontFamily: 'Nunito Sans',
            fontSize: '13px',
            lineHeight: 'normal',
            textAlign: 'left',
            marginLeft: '3px'
          }}>
            {statusText}
          </Typography>
          {(statusText.includes('Trial Pending') || statusText.includes('Trial Active') || statusText.includes('Subscription Active')) && (
            <AccessTimeIcon sx={{ color: iconColor }} />
          )}
          {(statusText.includes('left') || (statusText.includes('Expired'))) && (
            <Button onClick={handleOpenSlider} sx={{ ml: 0, textTransform: 'none', padding: 0, color: 'rgba(80, 82, 178, 1) !important' }}>
              <Typography className='first-sub-title' sx={{
                color: '#4683F8 !important',
                marginRight: '5px',
                pt: '1px',
                letterSpacing: '-0.02em',
                textAlign: 'left',
                fontSize: '13px !important',
                fontWeight: '500 !important'
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
