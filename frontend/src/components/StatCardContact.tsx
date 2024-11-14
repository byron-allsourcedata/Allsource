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

const StatCard: React.FC<StatCardProps> = ({ value, title, icon, imageUrl, bgColor = '#7D4DFF', textColor = 'white', borderColor = 'transparent', border = '' }) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      color: textColor,
      borderRadius: '8px',
      padding: '16px',
      width: '100%',
      gap: 1.5,
      mb: 2,
      boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.25)',
      height: '84px',
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: `${borderColor}`,
        borderRadius: '20%',
        padding: '12px',
        width: '52px',
        height: '52px'
      }}>
        {imageUrl ? (
          <Image src={imageUrl} alt={title} width={36} height={36} />
        ) : (
          icon
        )}
      </Box>
      <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start'}}>
        <Typography variant="h5" sx={{ fontWeight: '700', fontSize: '22px', fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)'}}>
          {value?.toLocaleString()} 
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', fontWeight: '500', lineHeight: '19.6px', textAlign: 'left', color: 'rgba(74, 74, 74, 1)', wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis'  }}>
          {title}
        </Typography>
      </Box>

    </Box>
  );
};

const TotalLeadsCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Total Contacts Collected"
    icon={<MarkEmailReadOutlinedIcon sx={{ color: 'rgba(244, 87, 69, 1)', fontSize: '36px' }} />}
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(244, 87, 69, 0.2)"
  />
);

const NewCustomersCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Total Visitors"
    imageUrl='/PersonMarked.svg'
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(80, 82, 178, 0.2)"
  />
);

const DemographicsCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="View Products"
    imageUrl='/PersonEdit.svg'
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(252, 225, 130, 0.2)"
  />
);

const AbandonedCart: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Abandoned Cart"
    imageUrl='/cart.svg'
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(202, 239, 169, 0.2)"
  />
);

const SalesOverTimeCard: React.FC<{ value: number }> = ({ value }) => (
  <StatCard
    value={value}
    title="Converted Sale"
    imageUrl='/converted-sales.svg'
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(234, 242, 251, 1)"
  />
);

const Cards = ({ values }: { values: { totalContact: number, totalVisitors: number, viewProducts: number, totalAbandonedCart: number, totalConvertedSale: number } }) => {
    return (
        <Grid container spacing={{xs: 1, sm: 2, md: 2, lg: 2}}>
          <Grid item xs={12} md={2.4}>
            <TotalLeadsCard value={values.totalContact} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <NewCustomersCard value={values.totalVisitors} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <DemographicsCard value={values.viewProducts} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <AbandonedCart value={values.totalAbandonedCart} />
          </Grid>
          <Grid item xs={12} md={2.4}>
            <SalesOverTimeCard value={values.totalConvertedSale} />
          </Grid>
        </Grid>
      );
    };

export default Cards;
