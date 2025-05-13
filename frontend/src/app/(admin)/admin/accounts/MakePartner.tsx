"use client"
import React, { useState } from 'react';
import { Drawer, Box, Typography, IconButton, Backdrop, Button, TextField, LinearProgress, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '../../../../components/ToastNotification';


interface SliderProps {
    isOpen: boolean;
    onClose: () => void;
    user_id?: number;
    onSumbit: () => void;
    is_master?: boolean;
}

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: '#c6dafc',
    '& .MuiLinearProgress-bar': {
        borderRadius: 5,
        backgroundColor: '#4285f4',
    },
}));


const MakePartner: React.FC<SliderProps> = ({ isOpen, onClose, user_id, onSumbit, is_master }) => {
    const [commission, setCommission] = useState("");
    const [processing, setProcessing] = useState(false)
    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async () => {
        setProcessing(true);
        try {
            const response = await axiosInstance.put('/admin/user', {
                user_id: user_id,
                is_partner: true,
                commission: commission,
                is_master: is_master ? true : false
            });
            onSumbit()
            showToast('User updated succesfuly')
        } catch {
            showErrorToast('Error updating user');
        } finally {
            handleClose();
            setCommission("");
            setProcessing(false);
        }
    };


    return (
        <>
            <Backdrop open={isOpen} onClick={handleClose} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer anchor="right" onClose={handleClose} open={isOpen} PaperProps={{
                sx: {
                    width: '40%',
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    '@media (max-width: 600px)': {
                        width: '100%',
                    }
                },
            }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.125)'
                        }
                    }
                }}>
                {processing && (
                    <Box
                        sx={{
                            width: '100%',
                            position: 'fixed',
                            top: '4.25rem',
                            zIndex: 1200,
                        }}
                    >
                        <BorderLinearProgress variant="indeterminate" />
                    </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 1.4, borderBottom: '1px solid #e4e4e4' }}>
                    <Typography className='first-sub-title' sx={{ textAlign: 'center', '@media (max-width: 600px)': { fontSize: '16px', textAlign: 'left' }, '@media (min-width: 1500px)': { fontSize: '22px !important', lineHeight: '25.2px !important' } }}>
                       Make {is_master ? 'Master' : ''} partner
                    </Typography>
                    <IconButton onClick={handleClose}>
                        <CloseIcon sx={{ '@media (min-width: 1500px)': { fontSize: '28px !important', lineHeight: '25.2px !important' } }} />
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        padding: "0 32px"
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "18px"
                        }}>
                        <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "16px",
                                fontWeight: "600",
                                lineHeight: "21.82px",
                                marginTop: "24px"
                            }}
                        >
                            Are you sure you want to make the user a {is_master ? 'Master' : ''} partner?
                        </Typography>

                        <TextField
                            id="outlined-required"
                            label="Enter the commision for reward payout"
                            placeholder='Enter the commision for reward payout'
                            sx={{
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 50%) scale(1)",
                                },
                            }}
                            value={commission}
                            onChange={(e) => setCommission(e.target.value)}
                        />

                    </Box>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "16px",
                        borderTop: "1px solid #e4e4e4",
                        position: "absolute",
                        width: "100%",
                        bottom: 0,
                        zIndex: 9901,
                        padding: "20px 1em",
                    }}
                >
                    <Button variant="outlined" onClick={handleClose} sx={{
                        borderColor: "rgba(56, 152, 252, 1)",
                        width: "92px",
                        height: "40px",
                        ":hover": {
                            borderColor: "rgba(62, 64, 142, 1)"
                        },
                        ":active": {
                            borderColor: "rgba(56, 152, 252, 1)"
                        },
                        ":disabled": {
                            borderColor: "rgba(56, 152, 252, 1)",
                            opacity: 0.4,
                        },
                    }}>
                        <Typography
                            sx={{
                                textAlign: "center",
                                color: "rgba(56, 152, 252, 1)",
                                textTransform: "none",
                                fontFamily: "Nunito Sans",
                                fontWeight: "600",
                                fontSize: "14px",
                                lineHeight: "19.6px",
                                ":hover": { color: "rgba(62, 64, 142, 1)" },
                            }}
                        >
                            No
                        </Typography>
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} sx={{
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        width: "120px",
                        height: "40px",
                        ":hover": {
                            backgroundColor: "rgba(62, 64, 142, 1)"
                        },
                        ":active": {
                            backgroundColor: "rgba(56, 152, 252, 1)"
                        },
                        ":disabled": {
                            backgroundColor: "rgba(56, 152, 252, 1)",
                            opacity: 0.6,
                        },
                    }}>
                        <Typography
                            sx={{
                                textAlign: "center",
                                color: "rgba(255, 255, 255, 1)",
                                fontFamily: "Nunito Sans",
                                textTransform: "none",
                                fontWeight: "600",
                                fontSize: "14px",
                                lineHeight: "19.6px",
                            }}
                        >
                            Yes
                        </Typography>
                    </Button>
                </Box>
            </Drawer>
        </>
    );
};

export default MakePartner;
