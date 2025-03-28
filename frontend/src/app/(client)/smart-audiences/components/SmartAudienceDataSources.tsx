import React, { useEffect, useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import DownloadIcon from '@mui/icons-material/Download';


interface DetailsPopupProps {
  open: boolean;
  onClose: () => void;
  id?: string
}

const BorderLinearProgress = styled(LinearProgress)(() => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: '#c6dafc',
    '& .MuiLinearProgress-bar': {
      borderRadius: 5,
      backgroundColor: '#4285f4',
    },
  }));



const DetailsPopup: React.FC<DetailsPopupProps> = ({ open, onClose, id }) => {
    const [isLoading, setIsLoading] = useState(false);

    const fetchDataSources = async () => {
        setIsLoading(true)
        try {
            const response = await axiosInstance.get('/audience-smarts/search', {
                // params: { start_letter: query },
              });
            const formattedContacts = response.data.map((contact: string) => ({ name: contact }));
            // setContacts(formattedContacts);
        } 
        catch {
        }
        finally {
            setIsLoading(false)
        }
    }
 

  useEffect(() => {
    fetchDataSources()
  }, [open]);




  return (
    <>
      <Backdrop open={open} sx={{ zIndex: 100, color: "#fff" }} />
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "40%",
            position: "fixed",
            top: 0,
            bottom: 0,
            "@media (max-width: 600px)": {
              width: "100%",
            },
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.01)'
            }
          }
        }}
      >
        {isLoading && (
            <Box
                sx={{
                width: '100%',
                position: 'fixed',
                top: '4.2rem',
                zIndex: 1200,   
                }}
            >
                <BorderLinearProgress variant="indeterminate" />
            </Box>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75em 1em 0.925em 1em",
            borderBottom: "1px solid #e4e4e4",
            position: "sticky",
            top: 0,
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h6"
            className='first-sub-title'
            sx={{
              textAlign: "center",
            }}
          >
            Smart Audience
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row" }}>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

        </Box>
        <Box
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            position: "relative",
            height: '100%',
            width: '100%'
          }}
        >
            <Box sx={{ width: "100%", pt: 3, pb: 2, px: 3, border: "1px solid rgba(240, 240, 240, 1)"}}>
                <Box sx={{ width: "100%", display: 'flex', alignItems: "center", justifyContent: "space-between", py: "20px", px: "24px", border: "1px solid rgba(240, 240, 240, 1)", boxShadow: "rgba(0, 0, 0, 0.2)"}}>
                    <Typography className='first-sub-title'>Audience 1</Typography>
                    <IconButton size="small">
                        <DownloadIcon fontSize='medium' sx={{color: 'rgba(128, 128, 128, 1)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2, px: 3}}>
                <Box>
                <Box sx={{ width: "100%", display: 'flex', alignItems: "center", justifyContent: "space-between", py: "20px", px: "24px", border: "1px solid rgba(240, 240, 240, 1)", boxShadow: "rgba(0, 0, 0, 0.2)"}}>
                    <Typography className='first-sub-title'>Included</Typography>
                </Box>
                <Box sx={{ width: "100%", display: 'flex', flexDirection: "column", alignItems: "center", justifyContent: "space-between", py: "20px", px: "24px", border: "1px solid rgba(240, 240, 240, 1)", borderTop: "none", boxShadow: "rgba(0, 0, 0, 0.2)"}}>
                    <Box sx={{width: "100%", py: 1, borderBottom: "1px solid rgba(240, 240, 240, 1)", display: "flex", justifyContent: "space-between"}}>
                        <Typography className='table-data'>Name</Typography>
                        <Typography className='table-data'>Type</Typography>
                        <Typography className='table-data'>Size</Typography>
                    </Box>
                    <Box sx={{width: "100%", py: "12px", borderBottom: "1px solid rgba(240, 240, 240, 1)", display: "flex", justifyContent: "space-between"}}>
                        <Typography className='black-table-header'>My orders</Typography>
                        <Typography className='black-table-header'>Customer Conversions</Typography>
                        <Typography className='black-table-header'>10,000</Typography>
                    </Box>
                </Box>
                </Box>
                <Box sx={{ width: "100%", display: 'flex', alignItems: "center", justifyContent: "space-between", py: "20px", px: "24px", border: "1px solid rgba(240, 240, 240, 1)", boxShadow: "rgba(0, 0, 0, 0.2)"}}>
                    <Typography className='first-sub-title'>Excluded</Typography>
                </Box>
            </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default DetailsPopup;
