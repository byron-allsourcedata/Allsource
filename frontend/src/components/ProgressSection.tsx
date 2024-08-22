import { Typography, Box, Button, LinearProgress, List, ListItemIcon, ListItemText } from "@mui/material";
import Image from "next/image";
import { styled } from "@mui/material/styles";
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CodeIcon from '@mui/icons-material/Code';
import AppsIcon from '@mui/icons-material/Apps';


const CustomButton = styled(Button)(({ theme }) => ({
  width: '100%',
  height: '68.25px',
  padding: '16px 8px',
  gap: '10px',
  borderRadius: '4px 0px 0px 0px',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  border: '1px solid rgba(228, 228, 228, 1)',
  boxShadow: '0px 1px 2px 0px rgba(158, 158, 158, 0.2)',
  textAlign: 'left',
  marginBottom: '8px',
  textTransform: 'none',
  fontFamily: 'Nunito',
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: '600',
  color: 'rgba(74, 74, 74, 1)',
}));


const CustomListItemIcon = styled(ListItemIcon)(({ theme }) => ({
  paddingLeft: '0.5em',
  minWidth: 0
}));

export const ProgressSection: React.FC = () => (
  <Box sx={{ display: "flex", justifyContent: 'center', alignItems: 'center' }}>
    <Box sx={{
      width: '70%',
      height:'100%',
      padding: '2rem',
      marginTop: '2em',
      border: '1px solid #e4e4e4',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem',
      '@media (max-width: 1199px)': {
        width: '100%',
        padding: '1.5rem',
        margin: '1.5rem 0'
      }
      }}>
      <Typography variant="h6" component="div" mb={2} sx={{
        '@media (max-width: 1199px)': {
          fontSize: '16px',
          fontFamily: 'Nunito',
          color: '#4a4a4a',
          fontWeight: '600',
          lineHeight: 'normal',
          marginBottom: '8px'
        }
      }}>
        Activation steps
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="textSecondary" 
        sx={{
          '@media (max-width: 1199px)': {
            fontSize: '14px',
            fontFamily: 'Nunito',
            color: '#787878',
            fontWeight: '700',
            lineHeight: 'normal'
          }
        }}
        >
          Progress
        </Typography>
        <Box sx={{ flexGrow: 1, mx: 2 }}>
  <LinearProgress
    variant="determinate"
    value={33}
    sx={{
      height: '8px',
      borderRadius: '4px',
      '& .MuiLinearProgress-bar': {
        backgroundColor: 'rgba(110, 193, 37, 1)',
      },
    }}
  />
</Box>

        <Typography variant="body2" color="textSecondary" sx={{
          '@media (max-width: 1199px)': {
            fontSize: '14px',
            fontFamily: 'Nunito',
            color: '#000',
            fontWeight: '400',
            lineHeight: 'normal'
          }
        }}>
          33% complete
        </Typography>
      </Box>
      <List sx={{ mt: 3 }}>
        <CustomButton sx={{ 
          borderRadius: '4px',
          '@media (max-width: 1199px)': {
            mb: '16px'
          }
          }}>
          <CustomListItemIcon >
            <HourglassEmptyIcon sx={{backgroundColor: 'rgba(220, 220, 239, 1)'}} />
          </CustomListItemIcon>
          <ListItemText primary="Activate Trial" />
        </CustomButton>
        <CustomButton sx={{ 
          borderRadius: '4px',
          '@media (max-width: 1199px)': {
            mb: '16px'
          }
          }}>
          <CustomListItemIcon>
            <CodeIcon sx={{backgroundColor: 'rgba(220, 220, 239, 1)'}} />
          </CustomListItemIcon>
          <ListItemText primary="Setup pixel" />
        </CustomButton>
        <CustomButton sx={{ 
          borderRadius: '4px'
          }}>
          <CustomListItemIcon>
            <AppsIcon sx={{backgroundColor: 'rgba(220, 220, 239, 1)'}} />
          </CustomListItemIcon>
          <ListItemText primary="Integrate" />
          <Image src={'/logos_meta-icon.svg'} alt="Meta" width={24} height={24} />
          <Image src={'/crm1.svg'} alt="Shopify" width={20} height={20} />
          <Image src={'/crm2.svg'} alt="Woo" width={20} height={20} />
          <Image src={'/crm3.svg'} alt="Bigcommerce" width={20} height={20} />
        </CustomButton>
      </List>
    </Box>
  </Box>
);
