import { Typography, Box, ListItem, LinearProgress, List, ListItemIcon, ListItemText } from "@mui/material";
import Image from "next/image";


export const ProgressSection: React.FC = () => (
  <Box sx={{ display: "flex", justifyContent: 'center', alignItems: 'center' }}>
    <Box sx={{ width: '50%', padding: '2rem', marginTop: '2em', border: '1px solid #e4e4e4', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
      <Typography variant="h6" component="div" mb={2}>
        Activation steps
      </Typography>
      <LinearProgress variant="determinate" color="success" value={14} sx={{ height: '8px', borderRadius: '4px' }} />
      <Typography variant="body2" color="textSecondary" mt={1}>
        14% complete
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <Image src={'/Setup1.svg'} alt="Setup pixel" width={20} height={20} />
          </ListItemIcon>
          <ListItemText primary="Setup pixel" />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Image src={'/Setup2.svg'} alt="E-Commerce store" width={20} height={20} />
          </ListItemIcon>
          <ListItemText primary="E-Commerce store" />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Image src={'/Setup3.svg'} alt="Connect CRM" width={20} height={20} />
          </ListItemIcon>
          <ListItemText primary="Connect CRM" />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Image src={'/Setup4.svg'} alt="Connect Meta ads" width={20} height={20} />
          </ListItemIcon>
          <ListItemText primary="Connect Meta ads" />
    </ListItem>
      </List>
    </Box>
    </Box>
  );
  