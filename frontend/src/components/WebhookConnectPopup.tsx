import React from "react";
import { Box, Typography, Drawer, Link, IconButton, Button, LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from "./ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";
import { CompressOutlined } from "@mui/icons-material";

interface CreateWebhookProps {
    handleClose: () => void
    onSave?: (new_integration: any) => void
    open: boolean
    initApiKey?: string;
    boxShadow?: string;
    invalid_api_key?: boolean;
}

const WebhookConnectPopup = ({ handleClose, open, onSave, initApiKey, boxShadow, invalid_api_key }: CreateWebhookProps) => {
    const { triggerSync } = useIntegrationContext();
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState<string>('1')

    const handleApiKeySave = async () => {
        try {
            setLoading(true)
            const response = await axiosInstance.post('/integrations/', {

            }, { params: { service_name: 'webhook' } })
            if (response.status === 200 && response.data === "SUCCESS") {
                showToast('Integration Webhook Successfully')
                if (onSave) {
                    onSave({ 'service_name': 'webhook', 'is_failed': false })
                }
                handleClose()
                triggerSync();
            } else {
                showErrorToast("Error connect webhook")
            }
        } catch (error) {
        }
        finally {
            setLoading(false)
        }
    }

    const getButton = (tabValue: string) => {
        switch (tabValue) {
            case '1':
                return (
                    <Button
                        variant="contained"
                        onClick={handleApiKeySave}
                        sx={{
                            backgroundColor: 'rgba(56, 152, 252, 1)',
                            fontFamily: "Nunito Sans",
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: 'rgba(56, 152, 252, 1)'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Connect
                    </Button>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {loading && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1400,
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ width: '100%', top: 0, height: '100vh' }}>
                        <LinearProgress />
                    </Box>
                </Box>
            )}
            <Drawer
                anchor="right"
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: '620px',
                        position: 'fixed',
                        zIndex: 1301,
                        top: 0,
                        boxShadow: boxShadow ? '0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)' : 'none',
                        bottom: 0,
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': {
                            display: 'none',
                        },
                        '@media (max-width: 600px)': {
                            width: '100%',
                        }
                    },
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: boxShadow ? boxShadow : 'rgba(0, 0, 0, 0.01)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                        Connect to Webhook
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        <Link href="https://allsourceio.zohodesk.com/portal/en/kb/allsource"
                            target="_blank"
                            rel="noopener refferer"
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: '600',
                                lineHeight: '20px',
                                color: 'rgba(56, 152, 252, 1)',
                                textDecorationColor: 'rgba(56, 152, 252, 1)'
                            }}>Tutorial</Link>
                        <IconButton onClick={handleClose} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ px: 2, py: 2, width: '100%', borderTop: '1px solid #e4e4e4' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                            {getButton(value)}
                        </Box>
                        {invalid_api_key && (
                            <Typography color="error" sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                fontWeight: "600",
                                lineHeight: "21.82px",
                                marginTop: "10px"
                            }}>
                                Invalid API Key detected. Please reconnect to Webhook and try again
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}

export default WebhookConnectPopup;