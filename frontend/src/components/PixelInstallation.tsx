import { Box, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";

export const PixelInstallation: React.FC = () => (
    <Box sx={{ padding: '1rem', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
      <Typography variant="h6" component="div" mb={2}>
        1. Pixel Installation
      </Typography>
      <Typography variant="body2" color="textSecondary" mb={2}>
        Select how you would like to install the pixel
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth>
            <Image src={'/install_manually.svg'} alt="Install Manually" width={20} height={20} />
            Install Manually
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth>
            <Image src={'/install_gtm.svg'} alt="Install on Google Tag Manager" width={20} height={20} />
            Install on Google Tag Manager
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button variant="outlined" fullWidth>
            <Image src={'/install_cms1.svg'} alt="Install on CMS" width={20} height={20} />
            <Image src={'/install_cms2.svg'} alt="Install on CMS" width={20} height={20} />
            Install on CMS
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
  