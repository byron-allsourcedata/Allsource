import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person'; // You can use other icons as needed

const StatCard: React.FC<{ value: number }> = ({ value }) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#7D4DFF', // Adjust the background color to match your design
      color: 'white',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      height: '100px'
    }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '24px' }}>
          {value.toLocaleString()} {/* Formats the number with commas */}
        </Typography>
        <Typography variant="body1">
          New Users
        </Typography>
      </Box>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '50%',
        padding: '8px',
        width: '40px',
        height: '40px'
      }}>
        <PersonIcon/>
      </Box>
    </Box>
  );
};

export default StatCard;



{/* <>
<Grid item xs={3}>
  <Typography variant="h6">Total Leads</Typography>
  <TotalLeadsChart />
</Grid>
<Grid item xs={3}>
  <Typography variant="h6">New Customers</Typography>
  <NewCustomersChart />
</Grid>
<Grid item xs={3}>
  <Typography variant="h6">Demographics</Typography>
  <DemographicsChart />
</Grid>
<Grid item xs={3}>
  <Typography variant="h6">Sales Over Time</Typography>
  <SalesOverTimeChart />
</Grid>
</> */}