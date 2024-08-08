import React, { useEffect } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { accountStyles } from '../css/accountDetails';

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
    rowData: any;
}

const PopupDetails: React.FC<PopupDetailsProps> = ({ open, onClose, rowData }) => {
    const lead = rowData?.lead || {};
    return (
        <>
            <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                variant="persistent"
                PaperProps={{
                    sx: {
                        width: '40%',
                        position: 'fixed',
                        zIndex: 1301,
                        top: 0,
                        bottom: 0,
                        '@media (max-width: 600px)': {
                            width: '100%',
                        }
                    },
                }}
            >

                <Box sx={{width: '100%', boxSizing: 'border-box' ,display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mt: '0.5em', borderBottom: '1px solid #e4e4e4' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', fontFamily: 'Nunito', fontWeight: '600', fontSize: '18px', lineHeight: '25.2px', color: 'rgba(80, 82, 178, 1)', borderBottom: '2.5px solid rgba(80, 82, 178, 1)' }}>
                        Personal
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'start',
                    padding: '16px',
                    boxSizing: 'border-box',
                    '@media (max-width: 600px)': {
                        padding: '8px',
                        width: '100%',
                    },
                }}>
                    <Box sx={{
                        p: 3,
                        gap: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'start',
                        width: '100%',
                        maxWidth: '90%',
                        border: '3px solid rgba(228, 228, 228, 1)',
                        flexDirection: 'row',
                        '@media (max-width: 600px)': {
                            width: '100%',
                        },
                    }}>
                        <Box
                            sx={{
                                width: 70,
                                height: 70,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                mb: 2, // Margin bottom for spacing on mobile
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f0f0f0',
                                border: '2px solid #000000',
                            }}
                        >
                            <img
                                src={lead.photo || '/avatar.jpg'}
                                alt="Lead"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'start' }}>
                            <Typography variant="body1" gutterBottom sx={{ ...accountStyles.name, pb: 1 }}>
                                {lead.first_name} {lead.last_name}
                            </Typography>
                            <Typography variant="body1" gutterBottom sx={{ ...accountStyles.text, pb: 1 }}>
                                {lead.business_email || 'N/A'}
                            </Typography>
                            <Typography variant="body1" gutterBottom sx={accountStyles.text}>
                                {lead.mobile_phone || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{
                        mt: 2,
                        padding: '16px',
                        gap: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        maxWidth: '90%',
                        border: '3px solid rgba(228, 228, 228, 1)',
                        '@media (max-width: 600px)': {
                            padding: '8px',
                            width: '100%',
                        },
                    }}>
                        <Typography sx={accountStyles.title}>
                            Basic Details
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography variant="body1" sx={{ ...accountStyles.text }}>
                                {lead.business_email || 'N/A'}
                            </Typography>
                            <Typography sx={accountStyles.title}>
                                Basic Details
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default PopupDetails;
