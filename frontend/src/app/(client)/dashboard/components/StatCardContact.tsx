import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import Image from 'next/image';

interface StatCardProps {
  value: number;
  typeBusiness: string;
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'start' }}>
        <Typography variant="h5" sx={{ fontWeight: '700', fontSize: '22px', fontFamily: 'Nunito Sans', lineHeight: '30.01px', color: 'rgba(32, 33, 36, 1)' }}>
          {value?.toLocaleString()}
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Nunito Sans', fontSize: '14px', fontWeight: '500', lineHeight: '19.6px', textAlign: 'left', color: 'rgba(74, 74, 74, 1)', wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

const TotalLeadsCard: React.FC<{ value: number, typeBusiness: string }> = ({ value, typeBusiness }) => (
  <StatCard
    value={value}
    typeBusiness={typeBusiness}
    title={typeBusiness === 'd2c' ? 'Total Contacts Collected' : 'Total Leads'}
    icon={<MarkEmailReadOutlinedIcon sx={{ color: 'rgba(244, 87, 69, 1)', fontSize: '36px' }} />}
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(244, 87, 69, 0.2)"
  />
);

const NewCustomersCard: React.FC<{ value: number, typeBusiness: string }> = ({ value, typeBusiness }) => (
  <StatCard
    value={value}
    typeBusiness={typeBusiness}
    title={typeBusiness === 'd2c' ? 'Total Visitors' : 'New Leads'}
    imageUrl={typeBusiness === 'd2c' ? '/PersonMarked.svg' : '/new_leads.svg'}
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(80, 82, 178, 0.1)"
  />
);

const DemographicsCard: React.FC<{ value: number, typeBusiness: string }> = ({ value, typeBusiness }) => (
  <StatCard
    value={value}
    typeBusiness={typeBusiness}
    title={typeBusiness === 'd2c' ? 'View Products' : 'Returning Visitors'}
    imageUrl={typeBusiness === 'd2c' ? '/PersonEdit.svg' : '/returning_visitors.svg'}
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(252, 225, 130, 0.2)"
  />
);

const AbandonedCart: React.FC<{ value: number, typeBusiness: string }> = ({ value, typeBusiness }) => (
  <StatCard
    value={value}
    typeBusiness={typeBusiness}
    title={typeBusiness === 'd2c' ? 'Abandoned Cart' : 'Page Views'}
    imageUrl={typeBusiness === 'd2c' ? '/cart.svg' : '/eye_svgrepo.com.svg'}
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(202, 239, 169, 0.2)"
  />
);

const SalesOverTimeCard: React.FC<{ value: number, typeBusiness: string }> = ({ value, typeBusiness }) => (
  <StatCard
    value={value}
    title="Converted Sale"
    typeBusiness={typeBusiness}
    imageUrl='/converted-sales.svg'
    textColor="rgba(74, 74, 74, 1)"
    borderColor="rgba(234, 242, 251, 1)"
  />
);

const Cards = ({ values, typeBusiness }: {
  values: {
    total_contacts_collected: number,
    total_new_leads: number,
    total_returning_visitors: number,
    total_page_views: number,
    total_visitors?: number,
    total_view_products?: number,
    total_abandoned_cart?: number,
    total_converted_sale?: number
  },
  typeBusiness: string
}) => {
  return (
    <Grid container spacing={{ xs: 1, sm: 2, md: 2, lg: 2 }}>
      {typeBusiness === 'd2c' ? (
        <>
          <Grid item xs={12} md={2.4}>
            <TotalLeadsCard value={values.total_contacts_collected ?? 0} typeBusiness={typeBusiness}/>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <NewCustomersCard value={values.total_visitors ?? 0} typeBusiness={typeBusiness}/>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <DemographicsCard value={values.total_view_products ?? 0} typeBusiness={typeBusiness}/>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <AbandonedCart value={values.total_abandoned_cart ?? 0} typeBusiness={typeBusiness}/>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <SalesOverTimeCard value={values.total_converted_sale ?? 0} typeBusiness={typeBusiness}/>
          </Grid>
        </>
      ) : (
        <>
          <Grid item xs={12} md={3}>
            <TotalLeadsCard value={values.total_contacts_collected} typeBusiness={typeBusiness} />
          </Grid>
          <Grid item xs={12} md={3}>
            <NewCustomersCard value={values.total_new_leads} typeBusiness={typeBusiness} />
          </Grid>
          <Grid item xs={12} md={3}>
            <DemographicsCard value={values.total_returning_visitors} typeBusiness={typeBusiness} />
          </Grid>
          <Grid item xs={12} md={3}>
            <AbandonedCart value={values.total_page_views} typeBusiness={typeBusiness} />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default Cards;
