import FacebookLogin from "@greatsumini/react-facebook-login";
import { Box, Button, Drawer, IconButton, Link, TextField, Typography } from "@mui/material";
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";
import { showToast } from "./ToastNotification";
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { useIntegrationContext } from "@/context/IntegrationContext";


interface MetaConnectPopupProps {
    open: boolean
    onClose: () => void
    onSave: (integration: any) => void
    isEdit?: boolean
    boxShadow?: string
}

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: {
            init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
            login: (callback: (response: fb.AuthResponse) => void, options?: { scope?: string, config_id?: string, response_type?: string, override_default_response_type?: boolean }) => void;
            api: (
                path: string,
                method: string,
                params: Record<string, string>,
                callback: (response: fb.ApiResponse) => void
            ) => void;
            getAuthResponse: () => fb.AuthResponse;
        };
    }
}

namespace fb {
    export interface AuthResponse {
        status: string;
        authResponse: {
            code: string;
            userID?: string;
        };
    }

    export interface ApiResponse {
        id?: string;
        name?: string;
        error?: any;
    }
}

const metaStyles = {
    tabHeading: {
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        color: '#707071',
        fontWeight: '500',
        lineHeight: '20px',
        textTransform: 'none',
        cursor: 'pointer',
        padding: 0,
        minWidth: 'auto',
        px: 2,
        '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            p: 0
        },
        '&.Mui-selected': {
            color: '#5052b2',
            fontWeight: '700'
        }
    },
    inputLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        lineHeight: '16px',
        color: 'rgba(17, 17, 19, 0.60)',
        '&.Mui-focused': {
            color: '#0000FF',
          },
    },
    formInput: {
        '&.MuiOutlinedInput-root': {
          height: '48px',
          '& .MuiOutlinedInput-input': {
            padding: '12px 16px 13px 16px',
            fontFamily: 'Roboto',
            color: '#202124',
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: '400'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A3B0C2',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A3B0C2',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0000FF',
          },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
      },
      
}

const MetaConnectButton = ({open, onClose, onSave, isEdit, boxShadow}: MetaConnectPopupProps) => {
    const { triggerSync } = useIntegrationContext();
    const [accessToken, setAccessToken] = useState('')
    const [loading, setLoading] = useState(false)
    const appID = process.env.NEXT_PUBLIC_META_APP_ID
    const configID = process.env.NEXT_PUBLIC_META_LOGIN_CONFIG


    useEffect(() => {
        const loadFacebookSDK = () => {
            window.fbAsyncInit = () => {
                window.FB.init({
                    appId: appID ?? '',
                    cookie: true,
                    xfbml: true,
                    version: 'v20.0',
                });
            };
            (function (d, s, id) {
                const fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                const js = d.createElement(s) as HTMLScriptElement;
                js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs?.parentNode?.insertBefore(js, fjs);
            })(document, 'script', 'facebook-jssdk');
        };
        if(open) { loadFacebookSDK(); }
    }, [appID, open]);

    const handleLogin = () => {
        window.FB.login(
            (response) => {
                if (response.status === 'connected') {
                    setAccessToken(response.authResponse.code);
                } else {
                }
            },
            { config_id: configID, response_type: 'code',
                override_default_response_type: true}
        );
    };

    useEffect(() => {
        if (accessToken) {
            const saveMeta = async() => {
                await handleCreateIntegration();
                onSave({'service_name': 'Meta', is_failed: false})
            }
            saveMeta()
        }
    }, [accessToken]);

    const handleCreateIntegration = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('/integrations/', {
                meta: {
                    access_token: accessToken,
                },
            }, {
                params: { service_name: 'meta' },
            });
            if (response.status === 200) {
                showToast('Connect to Meta Successfuly');
            }
            triggerSync();
        } finally {
            setLoading(false);
            onClose();
        }
    };


    return (
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
                    boxShadow: boxShadow ? '0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)' : 'none',
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
                    backgroundColor: boxShadow? boxShadow : 'rgba(0, 0, 0, 0.01)',
                  }
                }
              }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Connect to Meta
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href={isEdit? 
                        "https://maximizai.zohodesk.eu/portal/en/kb/articles/update-meta-integration-configuration" :
                        "https://maximizai.zohodesk.eu/portal/en/kb/articles/integrate-meta-to-maximiz"
                        }
                        target="_blank"
                        rel="noopener referrer"
                        sx={{
                        fontFamily: 'Nunito Sans',
                        fontSize: '14px',
                        fontWeight: '600',
                        lineHeight: '20px',
                        color: '#5052b2',
                        textDecorationColor: '#5052b2'
                    }}>Tutorial</Link>
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%',
                '@media (max-width: 480px)': {
                    height: 'auto'
                }
             }}>
                <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative', height: '100%', marginBottom: '100px',
                    '@media (max-width: 480px)': {
                        height: 'auto'
                    }
                 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
            <Image src='/meta-icon.svg' alt='meta-icon' height={24} width={36} />
            <Typography variant="h6" sx={{
            fontFamily: 'Nunito Sans',
            fontSize: '16px',
            fontWeight: '600',
            color: '#202124',
            marginTop: '12px',
            lineHeight: 'normal'
            }}>
            Login to your Facebook
            </Typography>
            <Box>
                <Button
                fullWidth
                onClick={handleLogin}
                variant="contained"
                startIcon={<Image src='/facebook-icon.svg' alt='facebook' height={24} width={24} />}
                sx={{
                    backgroundColor: '#0066ff',
                    fontFamily: "Nunito Sans",
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '17px',
                    letterSpacing: '0.25px',
                    color: "#fff",
                    textTransform: 'none',
                    padding: '14.5px 24px',
                    '&:hover': {
                    backgroundColor: '#0066ff'
                    },
                    borderRadius: '6px',
                    border: '1px solid #0066ff',
                }}
                >
                Connect to Facebook
                </Button>
            </Box>                  
        </Box>
    </Box>
</Box>
</Drawer>
     );
}
 
export default MetaConnectButton;

function setUserID(id: any) {
    throw new Error("Function not implemented.");
}
