import React, { ChangeEvent, useState, useEffect } from 'react';
import { Drawer, Box, Typography, Button, IconButton, TextField, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { styled } from '@mui/material/styles';
import { showErrorToast, showToast } from '@/components/ToastNotification';

interface FormUploadPopupProps {
    enabledData: any;
    open: boolean;
    onClose: () => void;
    removePartnerById:  any
}

interface FileObject extends File{   
    name: string;
    type: string; 
    sizesStr: string; 
}

const EnablePartnerPopup: React.FC<FormUploadPopupProps> = ({ enabledData, open, onClose, removePartnerById }) => {
    const [action, setAction] = useState("Disable");
    const [actionType, setActionType] = useState<keyof typeof allowedExtensions>("video");
    const [dragActive, setDragActive] = useState(false);
    const [buttonContain, setButtonContain] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileObject, setFileobjet] = useState<FileObject | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileSizeError, setFileSizeError] = useState(false); 
    const [fullName, setFullName] = useState(""); 
    const [account, setAccount] = useState(""); 
    const [companyName, setCompanyName] = useState(""); 
    const [commission, setCommission] = useState(""); 
    const [processing, setProcessing] = useState(false)

    const allowedExtensions = {
        image: ["jpg", "png", "jpeg", "gif", "webp", "svg", "tiff", "bmp", "heic", "heif"],
        video: ["mp4", "mov", "avi", "mkv"],
        document: ["pdf", "xslx"],
        presentation: ["pptx"],
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
        setCompanyName(""); 
        setCommission(""); 
    }

    const handleDeletePartner = async (id: number) => {
        setProcessing(true)
        try {
            const response = await axiosInstance.delete(`admin-partners/${id}`);
            const status = response.data.status;
            if (status.status === "SUCCESS") {
                removePartnerById(id);
                showToast("Partner successfully deleted!")
            }
        } catch {
            showErrorToast("Failed to delete partner. Please try again later.");
        } finally {
            setProcessing(false)
        }
    }

    const handleSubmit = async () => {
        setProcessing(true);
        setButtonContain(false);
    
        const formData = new FormData();
        formData.append("commission", commission);
        
    
        try {
            let response;
    
            if (action === "Disable") {
                response = await axiosInstance.put(`admin-partners/${enabledData.id}/`, formData);
            } else {
                formData.append("full_name", fullName);
                formData.append("company_name", companyName);
                response = await axiosInstance.post(`admin-partners/`, formData);
            }
            if (response.data.status === "SUCCESS") {
                removePartnerById(enabledData.id);
                showToast("Partner successfully submitted!");
            }
        } catch {
            showErrorToast("Failed to submit the asset. Please try again.");
        } finally {
            handleClose();
            setFullName(""); 
            setCompanyName(""); 
            setCommission(""); 
            setProcessing(false);
        }
    };

    // useEffect(() => {
    //     if (fileData) {
    //         setCommission(fileData.commission);
    //         setCompanyName(fileData.companyName);
    //         setFullName(fileData.fullName);
    //         setButtonContain(true)
    //         setAction("Edit")
    //     }
    // }, [fileData]);

    useEffect(() => {
        setButtonContain([fullName, companyName, commission].every(field => typeof field === "string" && field.trim().length > 0));
    }, [fullName, companyName, commission]);
    
    return (
        <>
        <Drawer anchor="right" open={open}>
        {processing && (
            <Box
                sx={{
                width: '100%',
                position: 'fixed',
                top: '3.5rem',
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
            padding: "0.75em 1em 0.25em 1em",
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
                        <CloseIcon />
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
                        flexDirection: "column"
                    }}>
                        <Typography
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "16px",
                                fontWeight: "600",
                                lineHeight: "21.82px",
                                margin: "24px 0 40px"
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
                                paddingBottom: "24px",
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(15%, 50%) scale(1)",
                                },  
                            }}
                            value={account}
                        />}
                                        
                        <TextField
                            disabled={action === "Edit"}
                            id="outlined-required"
                            label="Enter the reason for disable account"
                            placeholder='Need to custom my plan according to my usage'
                            sx={{
                                paddingBottom: "24px",
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                },
                                "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(15%, 50%) scale(1)",
                                },  
                            }}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
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
                <Button variant="outlined" onClick={handleClose} disabled={!buttonContain}  sx={{
                    borderColor: "rgba(80, 82, 178, 1)",
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
                        Cancel
                    </Typography>
                </Button> 
                <Button variant="contained" onClick={handleSubmit} disabled={!buttonContain}  sx={{
                    backgroundColor: "rgba(80, 82, 178, 1)"
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

export default EnablePartnerPopup;