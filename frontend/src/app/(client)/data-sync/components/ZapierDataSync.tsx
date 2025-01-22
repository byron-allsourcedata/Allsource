import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, List, ListItem, TextField, Tooltip, Typography, Drawer, Backdrop, Link, IconButton, Button, RadioGroup, FormControl, FormControlLabel, Radio, FormLabel, Divider, Tab, Switch, LinearProgress } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "../../../../components/CustomizedProgressBar";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showToast } from "../../../../components/ToastNotification";

interface CreateKlaviyoProps {
    handleClose: () => void
    open: boolean
}

interface IntegrationsCredentials {
    id: number
    access_token: string
    ad_account_id: string
    shop_domain: string
    data_center: string
    service_name: string
    is_with_suppression: boolean
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
        pointerEvents: 'none',
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

const ZapierDataSync = ({ handleClose, open }: CreateKlaviyoProps) => {
    const [value, setValue] = useState<string>('1')

    const instructions = [
        { id: 'unique-id-1', text: 'Go to the Zapier website and log into your account.' },
        { id: 'unique-id-2', text: 'Click on the Zap option located in your Zapier account options.' },
        { id: 'unique-id-3', text: 'Click Create New Zap' },
        { id: 'unique-id-4', text: 'Configure the new Zap according to the instructions'},
        { id: 'unique-id-5', text: 'Click Publish.' },
        { id: 'unique-id-6', text: 'Run a new zap' },
        { id: 'unique-id-7', text: 'A new Data Sync is automatically created in Maximiz' },
    ];

    type HighlightConfig = {
        [keyword: string]: { color?: string; fontWeight?: string };
    };

    const highlightText = (text: string, highlightConfig: HighlightConfig) => {
        let parts: (string | JSX.Element)[] = [text];

        Object.keys(highlightConfig).forEach((keyword, keywordIndex) => {
            const { color, fontWeight } = highlightConfig[keyword];
            parts = parts.flatMap((part, partIndex) =>
                typeof part === 'string' && part.includes(keyword)
                    ? part.split(keyword).flatMap((segment, index, array) =>
                        index < array.length - 1
                            ? [
                                segment,
                                <span
                                    style={{
                                        color: color || 'inherit',
                                        fontWeight: fontWeight || 'normal'
                                    }}
                                    key={`highlight-${keywordIndex}-${partIndex}-${index}`}
                                >
                                    {keyword}
                                </span>
                            ]
                            : [segment]
                    )
                    : [part]
            );
        });

        return <>{parts}</>;
    };

    const highlightConfig: HighlightConfig = {
        'Klaviyo': { color: '#5052B2', fontWeight: '500' },
        'Settings': { color: '#707071', fontWeight: '500' },
        'Create Private API Key': { color: '#707071', fontWeight: '500' },
        'Lists': { color: '#707071', fontWeight: '500' },
        'Profiles': { color: '#707071', fontWeight: '500' },
        'Metrics': { color: '#707071', fontWeight: '500' },
        'Events': { color: '#707071', fontWeight: '500' },
        'Templates': { color: '#707071', fontWeight: '500' },
        'Create': { color: '#707071', fontWeight: '500' },
        'API Key': { color: '#707071', fontWeight: '500' },
        'Connect': { color: '#707071', fontWeight: '500' },
        'Export': { color: '#707071', fontWeight: '500' }
    };

    const handleNextTab = async () => {

        if (value === '1') {
            setValue((prevValue) => {
                const nextValue = String(Number(prevValue) + 1);
                return nextValue;
            })
        }
    };


    const getButton = (tabValue: string) => {
        switch (tabValue) {
            case '1':
                return (
                    <Button
                        variant="contained"
                        onClick={handleClose}
                        sx={{
                            backgroundColor: '#5052B2',
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
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}
                    >
                        Close
                    </Button>
                );
            default:
                return null;
        }
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
                            backgroundColor: 'rgba(0, 0, 0, 0.01)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4' }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: '#202124', fontFamily: 'Nunito Sans', fontWeight: '600', fontSize: '16px', lineHeight: 'normal' }}>
                        Connect to Zapier
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/integrate-zapier-to-maximiz" target="_blank"rel="noopener noreferrer" 
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontSize: '14px',
                                fontWeight: '600',
                                lineHeight: '20px',
                                color: '#5052b2',
                                textDecorationColor: '#5052b2'
                            }}>Tutorial</Link>
                        <IconButton onClick={handleClose} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ width: '100%', padding: '16px 24px 24px 24px', position: 'relative' }}>
                                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
            
                                <Box sx={{ background: '#f0f0f0', border: '1px solid #efefef', borderRadius: '4px', p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
                                        <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                                        <Typography variant="subtitle1" sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#202124',
                                            lineHeight: 'normal'
                                        }}>How to sync with Zapier</Typography>
                                    </Box>
                                    <List dense sx={{ p: 0 }}>
                                        {instructions.map((instruction, index) => (
                                            <ListItem key={instruction.id} sx={{ p: 0, alignItems: 'flex-start' }}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        display: 'inline-block',
                                                        marginRight: '4px',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        color: '#808080',
                                                        lineHeight: '24px'
                                                    }}
                                                >
                                                    {index + 1}.
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        display: 'inline',
                                                        fontFamily: 'Roboto',
                                                        fontSize: '12px',
                                                        fontWeight: '400',
                                                        color: '#808080',
                                                        lineHeight: '24px'
                                                    }}
                                                >
                                                    {highlightText(instruction.text, highlightConfig)}
                                                </Typography>
                                                
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/integrate-klaviyo-to-maximiz" target="_blank"rel="noopener noreferrer" 
                                                    sx={{
                                                        fontFamily: 'Nunito Sans',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        lineHeight: '20px',
                                                        color: '#5052b2',
                                                        textDecorationColor: '#5052b2'
                                                    }}>Learn More</Link>
                                </Box>
                                </Box>

                    </Box>
                    <Box sx={{ px: 2, py: 3.5, width: '100%', border: '1px solid #e4e4e4' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                            {getButton(value)}
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}

export default ZapierDataSync;