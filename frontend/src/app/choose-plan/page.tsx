'use client';
import React, { Suspense, useState, useEffect } from 'react';
import { Box, Button, Typography, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import { planStyles } from './planStyles';
import { useUser } from '../../context/UserContext'; // Assuming you have a UserContext to provide user information
import axiosInterceptorInstance from '@/axios/axiosInterceptorInstance';

const PlanCard = ({ plan, onChoose }: { plan: any; onChoose: (stripePriceId: string) => void }) => {
  return (
    <Box sx={planStyles.card}>
      <Typography variant="h6" component="div" sx={planStyles.planName}>
        <Box component="span" sx={planStyles.planDot} /> {plan.title}
      </Typography>
      <Typography variant="h4" component="div" sx={planStyles.price}>
        ${plan.price}
        <Typography variant="subtitle1" component="span" sx={planStyles.priceSub}>
          {"    "}/month
        </Typography>
      </Typography>
      <Typography variant="body1" component="div" sx={planStyles.description}>
        {plan.description}
      </Typography>
      <Button
        variant="outlined"
        sx={planStyles.submitButton}
        fullWidth
        onClick={() => onChoose(plan.stripe_price_id)}
      >
        Choose plan
      </Button>
    </Box>
  );
};

const PlanPage: React.FC = () => {
  const router = useRouter();
  const { full_name, email } = useUser(); 
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInterceptorInstance.get('/subscriptions/stripe-plans');
        setPlans(response.data.stripe_plans);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChoosePlan = async (stripePriceId: string) => {
    try {
      const response = await axiosInterceptorInstance.get(`/subscriptions/session/new?price_id=${stripePriceId}`);
      if (response.status === 200) {
        console.log(response)
        window.location.href = response.data.link;
      }
    } catch (error) {
      console.error('Error choosing plan:', error);
    }
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    router.push('/settings');
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/signin');
  };

  return (
    <>
      <Box sx={planStyles.headers}>
        <Box sx={planStyles.logoContainer}>
          <Image src="/logo.svg" alt="logo" height={80} width={60} />
        </Box>
        <Button
          aria-controls={open ? 'profile-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleProfileMenuClick}
        >
          <PersonIcon sx={planStyles.account} />
        </Button>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          MenuListProps={{
            'aria-labelledby': 'profile-menu-button',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">{full_name}</Typography>
            <Typography variant="body2" color="textSecondary">{email}</Typography>
          </Box>
          <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
        </Menu>
      </Box>

      <Typography variant="h4" component="h1" sx={planStyles.title}>
        We&apos;ve got a plan that&apos;s perfect for you!
      </Typography>
      <Box sx={planStyles.formContainer}>
        {plans.map((plan, index) => (
          <Box key={index} sx={planStyles.formWrapper}>
            <PlanCard plan={plan} onChoose={handleChoosePlan} />
          </Box>
        ))}
      </Box>
    </>
  );
};

const ChoosePlanPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlanPage />
    </Suspense>
  );
};

export default ChoosePlanPage;
