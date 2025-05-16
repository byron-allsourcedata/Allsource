import { Box, Button, Divider, Drawer, IconButton, InputAdornment, Link, Switch, Tab, TextField, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import Image from "next/image";
import TabPanel from '@mui/lab/TabPanel';
import TabList from '@mui/lab/TabList';
import TabContext from '@mui/lab/TabContext';
import { useState } from 'react';
import CustomizedProgressBar from "@/components/ProgressBar";


const slackStyles = {
    tabHeading: {
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        color: '#707071',
        fontWeight: '500',
        lineHeight: '20px',
        textTransform: 'none',
        padding: 0,
        minWidth: 'auto',
        px: 2,
        pointerEvents: 'none',
        '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            p: 0
        },
        '&.Mui-selected': {
            color: 'rgba(56, 152, 252, 1)',
            fontWeight: '700'
        }
    },
    inputLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: '14px',
        lineHeight: '16px',
        left: '2px',
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
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                borderColor: 'red',
            },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
    },
}

interface GoogleADSConnectProps {
    handlePopupClose: () => void
    onSave?: (new_integration: any) => void
    open: boolean
    initApiKey?: string;
    boxShadow?: string;
    invalid_api_key?: boolean;
}

const GoogleADSConnectPopup = ({ open, handlePopupClose, boxShadow, invalid_api_key }: GoogleADSConnectProps) => {
    const [value, setValue] = useState('1')
    const [loading, setLoading] = useState(false);

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    const handleLogin = async () => {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/google-ads-landing`;
        const scope = "https://www.googleapis.com/auth/adwords";
        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleClientId}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
        window.location.href = authUrl;
    };

    if (!open) {
        return
    }

    if (loading) {
        return <CustomizedProgressBar />;
    }

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={handlePopupClose}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                    Connect to GoogleAds
                </Typography>
                <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                    <Link href="https://allsourceio.zohodesk.com/portal/en/kb/articles/connect-to-googleads" target="_blank" rel="noopener noreferrer"
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: 'rgba(56, 152, 252, 1)',
                            textDecorationColor: 'rgba(56, 152, 252, 1)'
                        }}>Tutorial</Link>
                    <IconButton onClick={handlePopupClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                    <TabContext value={value}>
                        <Box sx={{ pb: 4 }}>
                            <TabList centered aria-label="Connect to Slack Tabs"
                                TabIndicatorProps={{ sx: { backgroundColor: "rgba(56, 152, 252, 1)" } }}
                                sx={{
                                    "& .MuiTabs-scroller": {
                                        overflowX: 'auto !important',
                                    },
                                    "& .MuiTabs-flexContainer": {
                                        justifyContent: 'center',
                                        '@media (max-width: 600px)': {
                                            gap: '16px',
                                            justifyContent: 'flex-start'
                                        }
                                    }
                                }} onChange={handleChangeTab}>
                                <Tab label="Connection" value="1" className='tab-heading' sx={slackStyles.tabHeading} onClick={() => setValue('1')} />
                            </TabList>
                        </Box>
                        <TabPanel value="1" sx={{ p: 0 }}>
                            <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }} mt={2} mb={2}>
                                    <Image src='/google-ads.svg' alt='googleAds' height={24} width={24} />
                                    <Typography variant="h6" sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#202124',
                                        lineHeight: 'normal'
                                    }}>
                                        Login to your GoogleAds
                                    </Typography>
                                </Box>
                                <Box>
                                    <Button
                                        fullWidth
                                        onClick={handleLogin}
                                        variant="contained"
                                        startIcon={<Image src='/google-ads.svg' alt='googleAds' height={24} width={24} />}
                                        sx={{
                                            backgroundColor: 'rgba(56, 152, 252, 1)',
                                            fontFamily: "Nunito Sans",
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            lineHeight: '17px',
                                            letterSpacing: '0.25px',
                                            color: "#fff",
                                            textTransform: 'none',
                                            padding: '14.5px 24px',
                                            '&:hover': {
                                                backgroundColor: '#2F3076'
                                            },
                                            borderRadius: '6px',
                                            border: '1px solid rgba(56, 152, 252, 1)',
                                        }}
                                    >
                                        Connect to GoogleAds
                                    </Button>
                                    {invalid_api_key && (
                                        <Typography color="error" sx={{
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            lineHeight: "21.82px",
                                            marginTop: "10px"
                                        }}>
                                            Invalid API Key detected. Please reconnect to GoogleAds and try again
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                        </TabPanel>
                        <TabPanel value="2" sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Image src='/slack-icon.svg' alt='Slack' height={26} width={32} />
                                        <Typography variant="h6" sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#202124',
                                            lineHeight: 'normal'
                                        }}>Eliminate Redundancy: Stop Paying for Contacts You Already Own</Typography>
                                    </Box>
                                    <Typography variant="subtitle1" sx={{
                                        fontFamily: 'Roboto',
                                        fontSize: '12px',
                                        fontWeight: '400',
                                        color: '#808080',
                                        lineHeight: '20px',
                                        letterSpacing: '0.06px'
                                    }}>Sync your current list to avoid collecting contacts you already possess.
                                        Newly added contacts in Slack will be automatically suppressed each day.</Typography>


                                    <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" sx={{
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            color: '#808080',
                                            lineHeight: 'normal',
                                            letterSpacing: '0.06px'
                                        }}>
                                            Enable Automatic Contact Suppression
                                        </Typography>

                                        {/* Switch Control with Yes/No Labels */}
                                        <Box position="relative" display="inline-block">
                                            <Link variant='h6' sx={{
                                                fontFamily: 'Nunito Sans',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                lineHeight: '20px',
                                                color: 'rgba(56, 152, 252, 1)',
                                                cursor: 'pointer',
                                                textDecorationColor: 'rgba(56, 152, 252, 1)'
                                            }}>Tutorial</Link>
                                        </Box>
                                    </Box>




                                </Box>
                                <Box sx={{ background: '#efefef', borderRadius: '4px', px: 1.5, py: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                                        <Typography variant="subtitle1" sx={{
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            color: '#808080',
                                            lineHeight: '20px',
                                            letterSpacing: '0.06px'
                                        }}>By performing this action, all your Slack contacts will be added to your Grow suppression list, and new contacts will be imported daily around 6pm EST.</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </TabPanel>
                    </TabContext>
                </Box>
                <Box sx={{ px: 2, py: 2, width: '100%', borderTop: '1px solid #e4e4e4' }}>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            onClick={handlePopupClose}
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
                            Close
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Drawer>
    );
}

export default GoogleADSConnectPopup;