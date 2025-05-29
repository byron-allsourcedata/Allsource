import React, { ChangeEvent, useState, useEffect } from 'react';
import { Drawer, Backdrop, Box, Typography, Button, IconButton, TextField, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { styled } from '@mui/material/styles';
import { showErrorToast, showToast } from '@/components/ToastNotification';

interface FormUploadPopupProps {
    open: boolean;
    onClose: () => void;
}

interface RequestData {
    email: string;
    name: string;
}

const InviteAdmin: React.FC<FormUploadPopupProps> = ({ open, onClose }) => {
    const [fullName, setFullName] = useState("");
    const [buttonContain, setButtonContain] = useState(false);
    const [email, setEmail] = useState("");
    const [processing, setProcessing] = useState(false)
    const [emailError, setEmailError] = useState(false);

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailError(!emailRegex.test(value) && value !== "");
    };

    const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
        height: 4,
        borderRadius: 0,
        backgroundColor: '#c6dafc',
        '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            backgroundColor: '#4285f4',
        },
    }));


    const handleClose = () => {
        onClose()
        setFullName("");
        setEmail("");
    }

    const handleSubmit = async () => {
        setButtonContain(false);
        const requestData: RequestData = {
            name: fullName.trim(),
            email: email.trim()
        };
        try {
            setProcessing(true);
            let response = await axiosInstance.post(`admin/invite-user`, requestData, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.status === 200) {
                if (response.data.data) {
                    showToast("Partner successfully submitted!");
                }
                if (response.data.message) {
                    showErrorToast(response.data.message);
                }
            }

        } catch {
            showErrorToast("Failed to submit the invite. Please try again.");
        } finally {
            handleClose();
            setFullName("");
            setEmail("");
            setProcessing(false);
        }
    };

    useEffect(() => {
        setButtonContain([email, fullName].every(field => typeof field === "string" && field.trim().length > 0));
    }, [email, fullName]);

    return (
        <>
            <Backdrop open={open} onClick={onClose} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer anchor="right" onClose={onClose}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.01)'
                        }
                    }
                }}
                open={open}>
                {processing && (
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
                        padding: "24px",
                        pb: '11px',
                        borderBottom: "1px solid #e4e4e4",
                        position: "sticky",
                        top: 0,
                        zIndex: 9900,
                        backgroundColor: "#fff",
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "Nunito Sans",
                            fontSize: "16px",
                            fontWeight: "600",
                            lineHeight: "21.82px",
                            color: "#202124"
                        }}
                    >
                        Invite admin details
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                        <IconButton onClick={handleClose}>
                            <CloseIcon sx={{ width: "16px", height: "16px" }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box
                    sx={{
                        padding: "0 32px"
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "32px"
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
                            Invite your contacts to become official admins and grow together
                        </Typography>

                        <TextField
                            id="outlined-required"
                            label="Full name"
                            placeholder='Full name'
                            InputLabelProps={{
                                sx: {
                                    color: 'rgba(17, 17, 19, 0.6)',
                                    fontFamily: 'Nunito Sans',
                                    fontWeight: 400,
                                    fontSize: '15px',
                                    padding: 0,
                                    top: '-1px',
                                    margin: 0
                                }
                            }}
                            sx={{
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 50%) scale(1)",
                                },
                                "& .MuiOutlinedInput-root": {
                                    maxHeight: '40px'
                                }
                            }}
                            InputProps={{
                                className: "form-input"
                            }}
                            value={fullName}
                            size='small'
                            onChange={(e) => setFullName(e.target.value)}
                        />

                        <TextField
                            id="outlined-required"
                            label="Email"
                            type="email"
                            placeholder='Email'
                            InputLabelProps={{
                                sx: {
                                    color: 'rgba(17, 17, 19, 0.6)',
                                    fontFamily: 'Nunito Sans',
                                    fontWeight: 400,
                                    fontSize: '15px',
                                    padding: 0,
                                    top: '-1px',
                                    margin: 0
                                }
                            }}
                            InputProps={{
                                className: "form-input"
                            }}
                            sx={{
                                width: "556px",
                                "@media (max-width: 620px)": { width: "calc(100vw - 64px)" },
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 50%) scale(1)",
                                },
                                "& .MuiOutlinedInput-root": {
                                    maxHeight: '40px'
                                }
                            }}
                            value={email}
                            onChange={handleEmailChange}
                            error={emailError}
                            helperText={emailError ? "Please enter a valid email address" : ""}
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
                            Cancel
                        </Typography>
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={!buttonContain} sx={{
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
                            Send
                        </Typography>
                    </Button>
                </Box>
            </Drawer>
        </>
    )
};

export default InviteAdmin;