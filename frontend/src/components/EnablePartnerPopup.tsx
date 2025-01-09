import React, { ChangeEvent, useState, useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, TextField, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { styled } from '@mui/material/styles';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { width } from '@mui/system';

interface PartnerData {
    id: number;
    partner_name: string;
    email: string;
    join_date: Date;
    commission: string;
    subscription: string;
    sources: string;
    last_payment_date: string;
    status: string;
}

interface FormUploadPopupProps {
    enabledData: {id: number, fullName?: string};
    open: boolean;
    onClose: () => void;
    removePartnerById:  (id: number) => void
    updateOrAddAsset: (partner: PartnerData) => void
}

const EnablePartnerPopup: React.FC<FormUploadPopupProps> = ({ enabledData, open, onClose, removePartnerById, updateOrAddAsset }) => {
    const [action, setAction] = useState("Disable");
    const [buttonContain, setButtonContain] = useState(false);
    const [fullName, setFullName] = useState("");
    const [message, setMessage] = useState(""); 
    const [id, setId] = useState(0);
    const [processing, setProcessing] = useState(false)

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
        setAction("Disable")
        setMessage(""); 
    }

    const handleDeletePartner = async () => {
        setProcessing(true)
        

        try {
        const response = await axiosInstance.delete(`admin-partners/${id}`, {params: { message }});
            if (response.status === 200) {
                removePartnerById(id);
                showToast("Partner successfully deleted!")
            }
        } catch {
            showErrorToast("Failed to delete partner. Please try again later.");
        } finally {
            handleClose();
            setProcessing(false)
        }
    }

    const handleSubmit = async () => {
        setProcessing(true);
        setButtonContain(false);
    
        try {
            const response = await axiosInstance.put(`admin-partners/${id}/`, {status: "inactive", message}, {
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.status === 200) {
                updateOrAddAsset(response.data);
                showToast("Partner status successfully updated!");
            }
        } catch {
            showErrorToast("Failed to update status. Please try again.");
        } finally {
            handleClose();
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (enabledData) {
            const { fullName, id } = enabledData;
    
            if (fullName) {
                setFullName(fullName);
                setId(id);
                setAction("Terminate");
            } else {
                setAction("Disable");
                setId(id);
            }
        } else {
            setAction("Disable");
        }
    }, [enabledData]);

    useEffect(() => {
        setButtonContain(message.trim().length > 0);
    }, [message]);
    
    return (
        <Drawer anchor="right" open={open}>
        {processing && (
            <Box
                sx={{
                width: '100%',
                position: 'fixed',
                top: '5rem',
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
                    lineHeight: "21.82px"
                }}
                >
                {action} account
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "row" }}>
                    <IconButton onClick={handleClose}>
                        <CloseIcon  sx={{ width: "16px", height: "16px" }}/>
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
                            {action == "Disable" 
                            ? "Are you sure you want to disable account?"
                            : "Are you sure you want to terminate account?"
                            }
                        </Typography>

                        {action == "Terminate" && <TextField
                            disabled
                            id="outlined-required"
                            label="Account name"
                            placeholder='Account name'
                            sx={{
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 50%) scale(1)",
                                },  
                            }}
                            value={fullName}
                        />}
                                        
                        <TextField
                            id="outlined-required"
                            label={`Enter the reason for ${action.toLowerCase()} account`}
                            placeholder='Need to custom my plan according to my usage'
                            sx={{
                                width: "556px",
                                paddingBottom: "24px",
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 50%) scale(1)",
                                },  
                            }}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
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
                <Button variant="contained" onClick={action === "Terminate" ? handleDeletePartner : handleSubmit} disabled={!buttonContain}  sx={{
                    backgroundColor: "rgba(80, 82, 178, 1)",
                    width: "70px",
                    height: "40px",
                    ":hover": {
                        backgroundColor: "rgba(8, 83, 196, 1)"},
                    ":active": {
                        backgroundColor: "rgba(20, 110, 246, 1)",
                        border: "2px solid rgba(157, 194, 251, 1)"},
                    ":disabled": {
                        backgroundColor: "rgba(20, 110, 246, 1)",
                        opacity: 0.4,
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
                <Button variant="outlined" onClick={handleClose} disabled={!buttonContain}  sx={{
                    borderColor: "rgba(80, 82, 178, 1)",
                    width: "67px",
                    height: "40px",
                    ":hover": {
                        borderColor: "rgba(8, 83, 196, 1)"},
                    ":active": {
                        borderColor: "rgba(20, 110, 246, 1)",
                        border: "1px solid rgba(157, 194, 251, 1)"},
                    ":disabled": {
                        borderColor: "rgba(20, 110, 246, 1)",
                        opacity: 0.4,
                    },
                }}>
                    <Typography
                        sx={{
                        textAlign: "center",
                        color: "rgba(80, 82, 178, 1)",
                        textTransform: "none",
                        fontFamily: "Nunito Sans",
                        fontWeight: "600",
                        fontSize: "14px",
                        lineHeight: "19.6px",
                        }}
                    >
                        No
                    </Typography>
                </Button> 
            </Box>
        </Drawer>
    )
};

export default EnablePartnerPopup;