import React, { useEffect, useState } from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button, Divider, Link } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { companyStyles } from './companyStyles';
import Image from 'next/image'
import DownloadIcon from '@mui/icons-material/Download';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast } from '@/components/ToastNotification';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import dayjs from "dayjs";
import UnlockButton from './UnlockButton';

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
}


const PopupChargeCredits: React.FC<PopupDetailsProps> = ({ open, onClose }) => {
    const [popupData, setPopupData] = useState<any>()

    return (
        <>
            <Backdrop open={open} onClick={() => {
                    onClose()
                }
            } sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer
                anchor="right"
                open={open}
                onClose={() => {
                    onClose()
                }}
                variant="persistent"
                PaperProps={{
                    sx: {
                        width: '48%',
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
                <Box sx={{ width: '100%', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 1.35, borderBottom: '1px solid #e4e4e4', position: "sticky", top: 0, zIndex: 1400, backgroundColor: "#fff" }}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Typography sx={{ fontSize: '16px', fontFamily: 'Nunito Sans', fontWeight: 600, lineHeight: '21.82px', color: 'rgba(32, 33, 36, 1)' }}>
                            Employee Overview
                        </Typography>
                    </Box>
                    <IconButton onClick={() => {
                            onClose()
                            setPopupData(null)
                        }
                    }>
                        <CloseIcon sx={{ color: 'rgba(0, 0, 0, 1)' }} />
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
                        padding: '8px 0px',
                        width: '100%',
                    },
                }}>
                </Box>
            </Drawer>
        </>
    );
};

export default PopupChargeCredits;
