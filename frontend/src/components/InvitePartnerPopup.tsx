import React, { ChangeEvent, useState, useEffect } from 'react';
import { Drawer, Backdrop, Box, Typography, Button, IconButton, TextField, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { styled } from '@mui/material/styles';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { fontFamily } from '@mui/system';

interface PartnerData {
    id: number;
    partner_name: string;
    email: string;
    join_date: Date | string;
    commission: number;
    subscription: string;
    company_name: string;
    sources: string;
    last_payment_date: Date | string;
    status: string;
    count: number;
    reward_payout_date: Date | string;
    reward_status: string;
    reward_amount: number;
    isActive: boolean;
}

interface FormUploadPopupProps {
    maxCommission?: number;
    masterId?: number;
    isMaster?: boolean;
    open: boolean;
    fileData?: {id: number, email: string, fullName: string, companyName: string, commission: string}
    onClose: () => void;
    updateOrAddPartner: (partner: PartnerData) => void
}

interface RequestData {
    commission: number;
    email?: string;
    name: string;
    company_name: string;
    is_master?: boolean;
    master_id?: number;
}

const InvitePartnerPopup: React.FC<FormUploadPopupProps> = ({ maxCommission, masterId, isMaster, open, fileData, onClose, updateOrAddPartner }) => {
    const [action, setAction] = useState("Add");
    const [buttonContain, setButtonContain] = useState(false);
    const [fullName, setFullName] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [companyName, setCompanyName] = useState(""); 
    const [commission, setCommission] = useState(""); 
    const [processing, setProcessing] = useState(false)
    const [emailError, setEmailError] = useState(false);
    const [commissionError, setCommissionError] = useState(false);
  
    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEmail(value);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(!emailRegex.test(value) && value !== "");
    };
  
    const handleCommissionChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const comissionUpLine = maxCommission ? maxCommission - 1 : 70;
        const numericValue = Number(value);
        const isValid = numericValue >= 1 && numericValue <= comissionUpLine;
        setCommissionError(!isValid && value !== "");
        if (isValid || value === "") {
            setCommission(value);
        }
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
        setAction("Add")
        setFullName(""); 
        setEmail(""); 
        setCompanyName(""); 
        setCommission(""); 
    }

    const handleSubmit = async () => {
        setProcessing(true);
        setButtonContain(false);
    
        const requestData: RequestData = {
            commission: parseInt(commission),
            name: fullName.trim(),
            company_name: companyName.trim()
        };
        
    
        try {
            let response;
    
            if (action === "Edit" && fileData && fileData.id) {
                if(masterId) {
                    response = await axiosInstance.put(`partners/${fileData.id}`, requestData, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                response = await axiosInstance.put(`admin-partners/${fileData.id}/`, requestData, {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                requestData.email = email.trim();
                requestData.is_master = isMaster;
                if(masterId) {
                    requestData.master_id = masterId;
                    response = await axiosInstance.post(`partners/`, requestData, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                else {
                    response = await axiosInstance.post(`admin-partners/`, requestData, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            }
            if (response.status === 200) {
                if (response.data.data) {
                    updateOrAddPartner(response.data.data);
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
            setCompanyName(""); 
            setCommission(""); 
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (fileData && fileData.email) {
            setEmail(fileData.email);
            setCommission(fileData.commission.toString());
            setCompanyName(fileData.companyName);
            setFullName(fileData.fullName);
            setButtonContain(true)
            setAction("Edit")
        }
    }, [fileData]);

    useEffect(() => {
        setButtonContain([email, fullName, companyName, commission].every(field => typeof field === "string" && field.trim().length > 0));
    }, [email, fullName, companyName, commission]);
    
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
                    {action === "Add" ? "Invite" : "Edit"} {isMaster ? "master" : "" } partner details
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
                                {action == "Add" 
                                ? `Invite your contacts to become official ${isMaster ? "master" : ""} partners and grow together.`
                                : "Edit partner information to ensure accuracy and relevance."
                                }
                            </Typography>    
                                            
                            <TextField
                                disabled={action === "Edit"}
                                id="outlined-required"
                                label="Full name"
                                placeholder='Full name'
                                InputLabelProps={{
                                    sx: {
                                        color: 'rgba(17, 17, 19, 0.6)',
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: 400,
                                        fontSize: '15px',
                                        padding:0,
                                        top: '-1px',
                                        margin:0
                                }}}
                                sx={{
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "rgba(17, 17, 19, 0.6)",
                                    },
                                    "& .MuiInputLabel-root[data-shrink='false']": {
                                        transform: "translate(16px, 50%) scale(1)",
                                    },
                                    "& .MuiOutlinedInput-root":{
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
                                disabled={action === "Edit"}
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
                                        padding:0,
                                        top: '-1px',
                                        margin:0
                                }}}
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
                                    "& .MuiOutlinedInput-root":{
                                        maxHeight: '40px'
                                    }
                                }}
                                value={email}
                                onChange={handleEmailChange}
                                error={emailError}
                                helperText={emailError ? "Please enter a valid email address" : ""}
                            />

                            <TextField
                                disabled={action === "Edit"}
                                id="outlined-required"
                                label="Company name"
                                placeholder='Company name'
                                InputLabelProps={{
                                    sx: {
                                        color: 'rgba(17, 17, 19, 0.6)',
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: 400,
                                        fontSize: '15px',
                                        padding:0,
                                        top: '-1px',
                                        margin:0
                                }}}
                                sx={{
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "rgba(17, 17, 19, 0.6)",
                                    },
                                    "& .MuiInputLabel-root[data-shrink='false']": {
                                        transform: "translate(16px, 50%) scale(1)",
                                    },
                                    "& .MuiOutlinedInput-root":{
                                        maxHeight: '40px'
                                    }
                                }}
                                InputProps={{
                                    className: "form-input"
                                }}
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />

                            <TextField
                                id="outlined-required"
                                label="Commission %"
                                placeholder='Commission'
                                InputLabelProps={{
                                    sx: {
                                        color: 'rgba(17, 17, 19, 0.6)',
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: 400,
                                        fontSize: '15px',
                                        top: '-1px',
                                        padding:0,
                                        margin:0
                                }}}
                                sx={{
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: "rgba(17, 17, 19, 0.6)",
                                    },
                                    "& .MuiInputLabel-root[data-shrink='false']": {
                                        transform: "translate(16px, 50%) scale(1)",
                                    },
                                    "& .MuiOutlinedInput-root":{
                                        maxHeight: '40px'
                                    }
                                }}
                                InputProps={{
                                    className: "form-input"
                                }}

                                value={commission}
                                onChange={handleCommissionChange}
                                error={commissionError}
                                helperText={
                                commissionError ? `Commission must be a number between 1 and ${maxCommission ?? 70}` : ""
                                }
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
                    <Button variant="outlined" onClick={handleClose}  sx={{
                        borderColor: "rgba(56, 152, 252, 1)",
                        width: "92px",
                        height: "40px",
                        ":hover": {
                            borderColor: "rgba(30, 136, 229, 1)"},
                        ":active": {
                            borderColor: "rgba(56, 152, 252, 1)"},
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
                            ":hover": {color: "rgba(30, 136, 229, 1)"},
                            }}
                        >
                            Cancel
                        </Typography>
                    </Button> 
                    <Button variant="contained" onClick={handleSubmit} disabled={!buttonContain}  sx={{
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        width: "120px",
                        height: "40px",
                        ":hover": {
                            backgroundColor: "rgba(30, 136, 229, 1)"},
                        ":active": {
                            backgroundColor: "rgba(56, 152, 252, 1)"},
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
                            {action === "Edit" ? "Update" : "Send"} 
                        </Typography>
                    </Button> 
                </Box>
            </Drawer>
        </>
    )
};

export default InvitePartnerPopup;