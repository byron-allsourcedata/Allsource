"use client";
import React, { Suspense } from 'react';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { planStyles } from './planStyles';


const PlanCard = ({ planName, price, features }: { planName: string; price: string; features: string[] }) => {
  return (
    <Box sx={planStyles.card}>
      <Typography variant="h6" component="div" sx={planStyles.planName}>
        <Box component="span" sx={planStyles.planDot} /> {planName}
      </Typography>
      <Typography variant="h4" component="div" sx={planStyles.price}>
        {price}
        <Typography variant="subtitle1" component="span" sx={planStyles.priceSub}>
          {"    "}/month
        </Typography>
      </Typography>
      <Box sx={planStyles.features}>
        {features.map((feature, index) => (
          <Typography key={index} variant="body1" component="div" sx={planStyles.feature}>
            <Image src={"/electric-bolt.png"} alt="Lightning" width={24} height={24} /> {feature}
          </Typography>
        ))}
      </Box>
      <Button variant="outlined" sx={planStyles.submitButton} fullWidth>
        Talk to us
      </Button>
    </Box>
  );
};

const PlanPage: React.FC = () => {
  const router = useRouter();

  const plans = [
    {
      planName: 'Basic Plan',
      price: '$99',
      features: [
        'Feature 1 upto 123 words',
        'Feature 2 upto 123 words',
        'Feature 3 upto 123 words',
        'Feature 4 upto 123 words',
        'Feature 5 upto 123 words',
        'Feature 6 upto 123 words',
      ],
    },
    {
      planName: 'Standard Plan',
      price: '$199',
      features: [
        'Feature 1 upto 123 words',
        'Feature 2 upto 123 words',
        'Feature 3 upto 123 words',
        'Feature 4 upto 123 words',
        'Feature 5 upto 123 words',
        'Feature 6 upto 123 words',
      ],
    },
    {
      planName: 'Premium Plan',
      price: '$299',
      features: [
        'Feature 1 upto 123 words',
        'Feature 2 upto 123 words',
        'Feature 3 upto 123 words',
        'Feature 4 upto 123 words',
        'Feature 5 upto 123 words',
        'Feature 6 upto 123 words',
      ],
    },
  ];

  return (
    <>
      <Box sx={planStyles.logoContainer}>
        <Image src="/logo.svg" alt="logo" height={80} width={60} />
      </Box>
      <Typography variant="h4" component="h1" sx={planStyles.title}>
        We’ve got a plan thats perfect for you!
      </Typography>
      <Box sx={planStyles.formContainer}>
        {plans.map((plan, index) => (
          <Box key={index} sx={planStyles.formWrapper}>
            <PlanCard planName={plan.planName} price={plan.price} features={plan.features} />
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
