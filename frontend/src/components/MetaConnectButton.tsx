import FacebookLogin from "@greatsumini/react-facebook-login";
import { Box, Button, Drawer, IconButton, Link, TextField, Typography } from "@mui/material";
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import { showToast } from "./ToastNotification";
import axiosInstance from '@/axios/axiosInterceptorInstance';

interface MetaConnectPopupProps {
    open: boolean
    onClose: () => void
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

const MetaConnectButton = ({open, onClose}: MetaConnectPopupProps) => {
    const [accessToken, setAccessToken] = useState('')
    const [adId, setAdId] = useState('');
    const [adIdError, setAdIdError] = useState(false);
    const [loading, setLoading] = useState(false)
    const handleAdIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAdId(event.target.value);
        setAdIdError(event.target.value === ''); // Set error if API Key is empty
    };

    const handleCreateIntegration = async(userID?: string, fullName?: string) => {
        setLoading(true)
        const response = await axiosInstance.post('/integrations/', {
            meta: {
                ad_account_id: adId,
                access_token: accessToken,
                platform_user_id: userID,
                full_name: fullName
            }
        }, {
            params: {
                service_name: 'meta'
            }
        })
        if(response.status === 200) {
            showToast('Connect to Meta Successfuly')
        }
        setLoading(false)
        onClose()
    }

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
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3.5, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Connect to Meta
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href="#" sx={{
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
            login to your Facebook
            </Typography>
            <TextField
                label="AD ID"
                variant="outlined"
                fullWidth
                margin="normal"
                error={adIdError}
                helperText={adIdError ? 'AD ID is required' : ''}
                value={adId}
                onChange={handleAdIdChange}
                InputLabelProps={{ sx: metaStyles.inputLabel }}
                InputProps={{ sx: metaStyles.formInput }}
                sx={{ margin: 0}}
                />
            <FacebookLogin
                appId="470766002467450"
                scope='ads_read,ads_management'
                onSuccess={(response) => {
                    setAccessToken(response.accessToken)
                }}
                onFail={(error) => {
                console.log('Login Failed!', error);
                }}
                onProfileSuccess={(response) => {
                    handleCreateIntegration(response.id, response.name)
                }}
                render={({ onClick, logout }) => (
                <Box>
                    
                    <Button
                    fullWidth
                    disabled={!adId}
                    onClick={onClick}
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
                )}/>                            
        </Box>
    </Box>
</Box>
</Drawer>
     );
}
 
export default MetaConnectButton;