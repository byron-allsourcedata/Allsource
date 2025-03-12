import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import { Box, Typography, Drawer, IconButton, Button, LinearProgress } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import { useAxiosHook } from "@/hooks/AxiosHooks";
import { useIntegrationContext } from "@/context/IntegrationContext";

interface CreateSalesForceProps {
    handleClose: () => void
    onSave?: (integration: IntegrationsCredentials) => void
    open: boolean
    initApiKey?: string
    boxShadow?: string;
    isEdit?: boolean;
    Invalid_api_key?: boolean;
}

interface IntegrationsCredentials {
    id?: number
    access_token: string
    ad_account_id?: string
    shop_domain?: string
    data_center?: string
    service_name: string
    is_with_suppression?: boolean
}

const klaviyoStyles = {
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

const BingAdsIntegrationPopup = ({ handleClose, open, boxShadow }: CreateSalesForceProps) => {
    const [value, setValue] = useState("1");

    const handleLogin = async () => {
        const client_id = 'ВАШ_CLIENT_ID';
        const redirect_uri = `${process.env.NEXT_PUBLIC_BASE_URL}/bing-ads-landing`;
        const authority = 'https://login.microsoftonline.com/common';
        const scope = 'bingads.manage';

        const authorizationUrl = `${authority}/oauth2/v2.0/authorize?` +
            `client_id=${client_id}` +
            `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${Math.random().toString(36).substring(7)}` +
            `&response_mode=query`;

        window.location.href = authorizationUrl;
    };

    return (
        <>
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
                            backgroundColor: boxShadow ? boxShadow : 'rgba(0, 0, 0, 0.01)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                        Connect to BingAds
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        {/* <Link href={initApiKey ?
                            "https://maximizai.zohodesk.eu/portal/en/kb/articles/update-klaviyo-integration-configuration" :
                            "https://maximizai.zohodesk.eu/portal/en/kb/articles/integrate-klaviyo-to-maximiz"
                        }
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: '600',
                                lineHeight: '20px',
                                color: '#5052b2',
                                textDecorationColor: '#5052b2'
                            }}>Tutorial</Link> */}
                        <IconButton onClick={handleClose} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                        <TabContext value={value}>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }} mt={2} mb={2}>
                                        <Image src='/bingads-icon.svg' alt='bingads' height={24} width={24} />
                                        <Typography variant="h6" sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#202124',
                                            lineHeight: 'normal'
                                        }}>
                                            Login to your BingAds
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Button
                                            fullWidth
                                            onClick={handleLogin}
                                            variant="contained"
                                            startIcon={<Image src='/bingads-icon.svg' alt='bingads' height={24} width={24} />}
                                            sx={{
                                                backgroundColor: '#040404;',
                                                fontFamily: "Nunito Sans",
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                lineHeight: '17px',
                                                letterSpacing: '0.25px',
                                                color: "#fff",
                                                textTransform: 'none',
                                                padding: '14.5px 24px',
                                                '&:hover': {
                                                    backgroundColor: '#4a4545'
                                                },
                                                borderRadius: '6px',
                                                border: '1px solid #040404;',
                                            }}
                                        >
                                            Connect to BingAds
                                        </Button>
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}

export default BingAdsIntegrationPopup;