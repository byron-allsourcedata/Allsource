import React, { useEffect, useState } from "react";
import { Drawer, Box, Typography, Link, IconButton, Divider } from "@mui/material";
import CustomizedProgressBar from './CustomizedProgressBar';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface NotificationPopupProps {
    open: boolean;
    onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
        setLoading(true)
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
          const fetchData = async () => {
            try {
              const response = await axiosInstance.get("/notification");
              console.log(response)
            } catch (error) {
            } finally {
              setLoading(false);
            }
          };
        
          fetchData();
        }
    }
      }, [open]);

return (
    <>
    {loading && <CustomizedProgressBar />}
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: '620px',
                    position: 'fixed',
                    zIndex: 1301,
                    top: 0,
                    bottom: 0,
                    '@media (max-width: 900px)': {
                        width: '100%'
                    }
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                    Notifications
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
            </Box>
            <Divider />
            <Box sx={{ margin: '16px 24px 24px 24px', border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                <Box sx={{ width: '100%', position: 'relative', padding: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderBottom: '1px solid #E8E9EB',
                    '&:last-child': {
                        borderBottom: 'none'
                    }
                 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'relative',
                        pl: 2,
                        '&:before': {
                            content: '""',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#5052B2',
                            position: 'absolute',
                            left: 0,
                            top: '6px'

                        }
                    }}>
                        <Typography variant="h6" className="second-sub-title" sx={{
                            fontWeight: '500 !important',
                            lineHeight: '20px !important'
                        }}>
                            Your plan is expiring soon!
                        </Typography>
                        <Typography variant="body1" className='paragraph' sx={{
                            fontWeight: '500 !important',
                            lineHeight: '16px !important',
                            color: '#5F6368 !important'
                        }} >
                            5h ago
                        </Typography>
                    </Box>
                    <Typography variant="body1" className='paragraph' sx={{ 
                        lineHeight: '16px !important',
                        color: '#5F6368 !important'
                    }} >
                    Please upgrade your basic plan by October 1st to continue using our services.
                        {' '}<Link
                        sx={{
                            textDecoration: 'none',
                            color: '#146EF6 !important'
                        }}
                        href='/settings?section=subscription'
                        >
                        Choose Plan
                        </Link>
                        </Typography>
                </Box>

                <Box sx={{ width: '100%', position: 'relative', padding: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderBottom: '1px solid #E8E9EB',
                    '&:last-child': {
                        borderBottom: 'none'
                    }
                 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'relative',
                        pl: 2,
                        '&:before': {
                            content: '""',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#5052B2',
                            position: 'absolute',
                            left: 0,
                            top: '6px'

                        }
                    }}>
                        <Typography variant="h6" className="second-sub-title" sx={{
                            fontWeight: '500 !important',
                            lineHeight: '20px !important'
                        }}>
                            Blocked invoice overdue soon
                        </Typography>
                        <Typography variant="body1" className='paragraph' sx={{
                            fontWeight: '500 !important',
                            lineHeight: '16px !important',
                            color: '#5F6368 !important'
                        }} >
                            12h ago
                        </Typography>
                    </Box>
                    <Typography variant="body1" className='paragraph' sx={{ 
                        lineHeight: '16px !important',
                        color: '#5F6368 !important'
                    }} >
                    Invoice 1234243 is blocked for payment and will soon be overdue. Risk of late payment fee.
                        </Typography>
                </Box>

                <Box sx={{ width: '100%', position: 'relative', padding: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderBottom: '1px solid #E8E9EB',
                    '&:last-child': {
                        borderBottom: 'none'
                    }
                 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Typography variant="h6" className="second-sub-title" sx={{
                            fontWeight: '500 !important',
                            lineHeight: '20px !important'
                        }}>
                            Jolla deo - admin added one team member to Maximiz
                        </Typography>
                        <Typography variant="body1" className='paragraph' sx={{
                            fontWeight: '500 !important',
                            lineHeight: '16px !important',
                            color: '#5F6368 !important'
                        }} >
                            Oct 21
                        </Typography>
                    </Box>
                    <Typography variant="body1" className='paragraph' sx={{ 
                        lineHeight: '16px !important',
                        color: '#5F6368 !important'
                    }} >
                    Through invitation 1 team member added to the portal successfully.
                        </Typography>
                </Box>
                
                <Box sx={{ width: '100%', position: 'relative', padding: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    borderBottom: '1px solid #E8E9EB',
                    '&:last-child': {
                        borderBottom: 'none'
                    }
                 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Typography variant="h6" className="second-sub-title" sx={{
                            fontWeight: '500 !important',
                            lineHeight: '20px !important'
                        }}>
                            Blocked invoice overdue soon
                        </Typography>
                        <Typography variant="body1" className='paragraph' sx={{
                            fontWeight: '500 !important',
                            lineHeight: '16px !important',
                            color: '#5F6368 !important'
                        }} >
                            Oct 21
                        </Typography>
                    </Box>
                    <Typography variant="body1" className='paragraph' sx={{ 
                        lineHeight: '16px !important',
                        color: '#5F6368 !important'
                    }} >
                    Invoice 1234243 is blocked for payment and will soon be overdue. Risk of late payment fee.
                        </Typography>
                </Box>
                
            </Box>
        </Drawer>
    </>
)
}

export default NotificationPopup;