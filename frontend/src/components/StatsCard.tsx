import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import AttachMoneySharpIcon from '@mui/icons-material/AttachMoneySharp';
import Image from 'next/image';

interface StatCardProps {
  value: number;
  title: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  border?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, title, icon, imageUrl, bgColor = '#7D4DFF', textColor = 'white', borderColor = 'transparent',  border = ''}) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      height: '100px',
      border: `2px solid ${borderColor}`
    }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '24px' }}>
          {value.toLocaleString()} {/* Formats the number with commas */}
        </Typography>
        <Typography variant="body1" sx={{fontFamily: 'Nunito', mt: '1em' ,fontSize: '18', fontWeight: '400', lineHeight: '19.6px', textAlign: 'left'}}>
          {title}
        </Typography>
      </Box>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: `1px solid ${border}`,
        borderRadius: '20%',
        padding: '8px',
        width: '40px',
        height: '40px'
      }}>
        {imageUrl ? (
          <Image src={imageUrl} alt={title} width={36} height={36} />
        ) : (
          icon
        )}
      </Box>
    </Box>
  );
};

const TotalLeadsCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Total Leads"
    icon={<MarkEmailReadOutlinedIcon sx={{ color: 'rgba(244, 87, 69, 1)', fontSize: '36px'}} />}
    bgColor="rgba(249, 108, 112, 0.1)"
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(249, 168, 159, 1)"
    border='rgba(249, 168, 159, 1)'
  />
);

const NewCustomersCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="New Customers"
    imageUrl='/PersonMarked.svg'
    bgColor="rgba(113, 115, 193, 0.1)"
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(184, 185, 224, 1)"
    border="rgba(184, 185, 224, 1)"
  />
);

const DemographicsCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Demographics"
    imageUrl='/PersonEdit.svg'
    bgColor="rgba(251, 208, 55, 0.1)"
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(252, 225, 130, 1)"
    border="rgba(252, 225, 130, 1)"
  />
);

const SalesOverTimeCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Sales Over Time"
    icon={<AttachMoneySharpIcon  sx={{ color: 'rgba(149, 222, 84, 1)', fontSize: '36px'}} />}
    bgColor="rgba(149, 222, 84, 0.1)"
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(202, 239, 169, 1)"
    border='rgba(202, 239, 169, 1)'
  />
);

const Cards = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <TotalLeadsCard value={1000} />
      </Grid>
      <Grid item xs={12} md={3}>
        <NewCustomersCard value={500} />
      </Grid>
      <Grid item xs={12} md={3}>
        <DemographicsCard value={300} />
      </Grid>
      <Grid item xs={12} md={3}>
        <SalesOverTimeCard value={1200} />
      </Grid>
    </Grid>
  );
};

export default Cards;
