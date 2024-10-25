import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Link, Typography } from "@mui/material";
import ArrowForwardIosSharpIcon  from '@mui/icons-material/ExpandMore';
import { useState } from "react";
import ManualPopup from "./ManualPopup";

const buttonStyles = {
    backgroundColor: '#fff',
    display: "flex",
    flexDirection: 'column',
    alignItems: 'self-start',
    padding: '0.5rem',
    borderColor: 'rgba(228, 228, 228, 1)',
    border: '1px solid rgba(228, 228, 228, 1)',
    width: '100%',
    '@media (max-width: 1199px)': {
      maxHeight: '82px',
      },
  };


const RevenueTracking = () => {
    const [expanded, setExpanded] = useState<string | false>('panel1');

    const handleChange =
      (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
        setExpanded(newExpanded ? panel : false);
      };
      const [openmanually, setOpenManually] = useState(true)
    const handleButtonClick = () => { }
    return ( 
        <Box
        sx={{
          padding: "1rem",
          border: "1px solid #e4e4e4",
          borderRadius: "8px",
          overflow: 'hidden',
          backgroundColor: "rgba(247, 247, 247, 1)",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          '@media (max-width: 900px)': {
            marginBottom: "1.5rem",
            padding: '1rem'
          }
        }}
      >
        <Typography variant="h6" component="div" mb={1} className="first-sub-title" sx={{
        fontFamily: 'Nunito',
        fontWeight: '700',
        lineHeight: '21.82px',
        textAlign: 'left',
        color: '#1c1c1c',
        fontSize: '1rem',
        '@media (max-width: 1199px)': {
          fontSize: '1rem',
          lineHeight: 'normal',
          marginBottom: '0.25rem'
      }
        }}>
        3. Track Revenue
      </Typography>
      <Typography variant="body2" color="textSecondary" className="table-data" mb={2}
      sx={{
        fontFamily: 'Nunito',
        fontWeight: '500',
        color: 'rgba(128, 128, 128, 1)',
        fontSize: '12px',
        '@media (max-width: 1199px)': {
          fontSize: '0.875rem',
          lineHeight: 'normal',
        }
        }}
      >
        Additional script installation required! Follow the instructions &nbsp; 
        <Link href="#" className="main-text" sx={{
                        fontSize: '14px',
                        fontWeight: '600',
                        lineHeight: '20px',
                        color: '#5052b2',
                        textDecorationColor: '#5052b2'
                    }}>here</Link>
      </Typography>
      </Box>
     );
}
 
export default RevenueTracking