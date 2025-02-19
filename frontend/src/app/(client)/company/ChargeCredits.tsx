import React from 'react';
import { Drawer, Backdrop, Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../../axios/axiosInterceptorInstance';

interface PopupDetailsProps {
    open: boolean;
    onClose: () => void;
    updateEmployeeCallback: (id: number) => void
    id: number | null
}


const PopupChargeCredits: React.FC<PopupDetailsProps> = ({ open, onClose, updateEmployeeCallback, id }) => {
    
    const handleSubmit = async () => {
        try {
            const response = await axiosInstance.put('/subscriptions/charge-credit')
            console.log({response})
            if (response.status === 200 && id){
                console.log({id})
                updateEmployeeCallback(id)
            }
        } 
        catch {
        }
        finally {
            onClose()
        }
    }

    return (
        <>
            <Backdrop open={open} onClick={() => {
                    onClose()
                }
            } sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer anchor="right" open={open} onClose={onClose}>
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
                        lineHeight: "21.82px",
                        width: "620px",
                    }}
                    >
                    Unlock Contact Confirmation
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                        <IconButton onClick={onClose}>
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
                                To unlock this contact, 1 credit will be deducted from your account balance. 
                                <br/>
                                Please confirm if you wish to proceed with this action.
                            </Typography>
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
                                Are you sure you want to unlock this contact?
                            </Typography>
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
                    <Button variant="outlined" onClick={onClose} sx={{
                        borderColor: "rgba(80, 82, 178, 1)",
                        width: "67px",
                        height: "40px",
                        ":hover": {
                            borderColor: "rgba(62, 64, 142, 1)"},
                        ":active": {
                            borderColor: "rgba(80, 82, 178, 1)"},
                        ":disabled": {
                            borderColor: "rgba(80, 82, 178, 1)",
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
                            Cancel
                        </Typography>
                    </Button> 
                    <Button variant="contained" onClick={handleSubmit} sx={{
                        backgroundColor: "rgba(80, 82, 178, 1)",
                        width: "70px",
                        height: "40px",
                        ":hover": {
                            backgroundColor: "rgba(62, 64, 142, 1)"},
                        ":active": {
                            backgroundColor: "rgba(80, 82, 178, 1)"},
                        ":disabled": {
                            backgroundColor: "rgba(80, 82, 178, 1)",
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
                            Unlock
                        </Typography>
                    </Button> 
                </Box>
            </Drawer>
        </>
    );
};

export default PopupChargeCredits;
