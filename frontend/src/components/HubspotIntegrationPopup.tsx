import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box, List, ListItem, TextField, Tooltip, Typography, Drawer, Backdrop, Link, IconButton, Button, RadioGroup, FormControl, FormControlLabel, Radio, FormLabel, Divider, Tab, Switch, LinearProgress, Tabs } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "./CustomizedProgressBar";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from "./ToastNotification";
import { useAxiosHook } from "@/hooks/AxiosHooks";
import { useIntegrationContext } from "@/context/IntegrationContext";

interface CreateHubspotProps {
    handleClose: () => void
    onSave?: (integration: IntegrationsCredentials) => void
    open: boolean
    initApiKey?: string
    boxShadow?: string;
    isEdit?: boolean;
    invalid_api_key?: boolean;
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

const hubspotStyles = {
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

const HubspotIntegrationPopup = ({ handleClose, open, onSave, initApiKey, boxShadow, invalid_api_key }: CreateHubspotProps) => {
    const { triggerSync } = useIntegrationContext();
    const [apiKey, setApiKey] = useState('');
    const [apiKeyError, setApiKeyError] = useState(false);
    const [checked, setChecked] = useState(false);
    const [tab2Error, setTab2Error] = useState(false);
    const [disableButton, setDisableButton] = useState(false);
    const label = { inputProps: { 'aria-label': 'Switch demo' } };
    const { data, loading, error, sendRequest } = useAxiosHook();


    const [value, setValue] = useState("1");

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    useEffect(() => {
        setApiKey(initApiKey || '')
    }, [initApiKey])


    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setApiKey(value);
        setApiKeyError(!value.trim());
    };

    const instructions = [
        { id: 'unique-id-1', text: 'Go to the Hubspot website and log into your account.' },
        { id: 'unique-id-2', text: 'Click on the settings icon in the top navigation bar.' },
        { id: 'unique-id-3', text: 'Navigate to "Integrations" and select "Private Apps".' },
        { id: 'unique-id-4', text: 'Click on "Create a private app".' },
        { id: 'unique-id-5', text: 'Enter "Maximiz" as the app name.' },
        { id: 'unique-id-6', text: 'Assign full access permissions to "CRM", "Contacts", and "Objects".' },
        { id: 'unique-id-7', text: 'Click "Create app" and confirm your selection.' },
        { id: 'unique-id-8', text: 'Copy the generated API key and paste it into the API Key field in the Maximiz Hubspot section.' },
        { id: 'unique-id-9', text: 'Click "Connect" to complete the integration process.' },
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

    const handleApiKeySave = async () => {
        try {
            setDisableButton(true)
            const response = await sendRequest({
                url: "/integrations/",
                method: "POST",
                data: {
                    hubspot: {
                        access_token: apiKey,
                    },
                },
                params: { service_name: "hubspot" },
            });
            if (response?.status === 200) {
                if (onSave) {
                    onSave({
                        service_name: 'hubspot',
                        access_token: apiKey,
                    })
                }
                showToast("Integration Hubspot Successfully");
                triggerSync();
                handleNextTab();
            }
        } catch (err) {
        } finally {
            setDisableButton(false)
        }
    };


    const highlightConfig: HighlightConfig = {
        'Hubspot': { color: '#5052B2', fontWeight: '500' },
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

    const handleSave = async () => {
        if (onSave) {
            onSave({
                id: -1,
                'service_name': 'hubspot',
                data_center: '',
                access_token: apiKey,
                is_with_suppression: checked,
                ad_account_id: '',
                shop_domain: ''
            })
        }
        handleClose()
    }

    const getButton = (tabValue: string) => {
        switch (tabValue) {
            case '1':
                return (
                    <Button
                        variant="contained"
                        onClick={handleApiKeySave}
                        disabled={!apiKey || disableButton || apiKeyError}
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
                        Connect
                    </Button>
                );
            case '2':
                return (
                    <Button
                        variant="contained"
                        onClick={handleSave}
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
                        Save
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
                        Connect to Hubspot
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                            {/* <Link href={initApiKey ?
                                "https://maximizai.zohodesk.eu/portal/en/kb/articles/update-hubspot-integration-configuration" :
                                "https://maximizai.zohodesk.eu/portal/en/kb/articles/integrate-hubspot-to-maximiz"
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
                            <Box sx={{ pb: 4 }}>
                                <Tabs
                                    value={value}
                                    onChange={handleChange}
                                    centered
                                    aria-label="Connect to Hubspot Tabs"
                                    TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
                                    sx={{
                                        cursor: 'pointer',
                                        "& .MuiTabs-scroller": {
                                            overflowX: 'auto !important',
                                        },
                                        "& .MuiTabs-flexContainer": {
                                            justifyContent: 'center',
                                            '@media (max-width: 600px)': {
                                                gap: '16px',
                                                justifyContent: 'flex-start',
                                            },
                                        },
                                    }}
                                >
                                    <Tab
                                        label="API Key"
                                        value="1"
                                        sx={{ ...hubspotStyles.tabHeading, cursor: 'pointer' }}
                                    />
                                    <Tab
                                        label="Suppression Sync"
                                        value="2"
                                        sx={{ ...hubspotStyles.tabHeading, cursor: 'pointer' }}
                                    />
                                </Tabs>

                            </Box>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Image src='/hubspot.svg' alt='hubspot' height={26} width={32} />
                                        <Typography variant="h6" sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#202124'
                                        }}>API Key</Typography>
                                        <Tooltip title="Enter the API key provided by Hubspot" placement="right">
                                            <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                        </Tooltip>
                                    </Box>
                                    <TextField
                                        label="Enter API Key"
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                        error={invalid_api_key}
                                        helperText={invalid_api_key ? 'Invalid API Key' : ''}
                                        value={apiKey}
                                        onChange={handleApiKeyChange}
                                        InputLabelProps={{ sx: hubspotStyles.inputLabel }}
                                        InputProps={{ sx: { ...hubspotStyles.formInput, borderColor: invalid_api_key ? 'red' : 'inherit' }, }}
                                    />
                                </Box>
                                <Box sx={{ background: '#f0f0f0', border: '1px solid #efefef', borderRadius: '4px', p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
                                        <Image src='/info-circle.svg' alt='info-circle' height={20} width={20} />
                                        <Typography variant="subtitle1" sx={{
                                            fontFamily: 'Nunito Sans',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#202124',
                                            lineHeight: 'normal'
                                        }}>How to integrate Hubspot</Typography>
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
                                </Box>
                            </TabPanel>
                            <TabPanel value="2" sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Image src='/hubspot.svg' alt='hubspot' height={26} width={32} />
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
                                            Newly added contacts in Hubspot will be automatically suppressed each day.</Typography>


                                        <Box sx={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
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
                                                <Switch
                                                    {...label}
                                                    checked={checked}
                                                    onChange={handleSwitchChange}
                                                    sx={{
                                                        width: 54, // Increase width to fit "Yes" and "No"
                                                        height: 24,
                                                        padding: 0,
                                                        '& .MuiSwitch-switchBase': {
                                                            padding: 0,
                                                            top: '2px',
                                                            left: '3px',
                                                            '&.Mui-checked': {
                                                                left: 0,
                                                                transform: 'translateX(32px)', // Adjust for larger width
                                                                color: '#fff',
                                                                '&+.MuiSwitch-track': {
                                                                    backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                                    opacity: checked ? '1' : '1',
                                                                }
                                                            },
                                                        },
                                                        '& .MuiSwitch-thumb': {
                                                            width: 20,
                                                            height: 20,
                                                        },
                                                        '& .MuiSwitch-track': {
                                                            borderRadius: 20 / 2,
                                                            backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                            opacity: checked ? '1' : '1',
                                                            '& .MuiSwitch-track.Mui-checked': {
                                                                backgroundColor: checked ? '#5052b2' : '#7b7b7b',
                                                                opacity: checked ? '1' : '1',
                                                            }
                                                        },
                                                    }}
                                                />
                                                <Box sx={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "0px",
                                                    width: "100%",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    transform: "translateY(-50%)",
                                                    pointerEvents: "none"
                                                }}>
                                                    {/* Conditional Rendering of Text */}
                                                    {!checked && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'Roboto',
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                fontWeight: '400',
                                                                marginRight: '8px',
                                                                lineHeight: 'normal',
                                                                width: '100%',
                                                                textAlign: 'right',
                                                            }}
                                                        >
                                                            No
                                                        </Typography>
                                                    )}

                                                    {checked && (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontFamily: 'Roboto',
                                                                fontSize: '12px',
                                                                color: '#fff',
                                                                fontWeight: '400',
                                                                marginLeft: '6px',
                                                                lineHeight: 'normal'
                                                            }}
                                                        >
                                                            Yes
                                                        </Typography>
                                                    )}
                                                </Box>
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
                                            }}>By performing this action, all your Hubspot contacts will be added to your Grow suppression list, and new contacts will be imported daily around 6pm EST.</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>
                    <Box sx={{ px: 2, py: 3.5, width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                            {getButton(value)}
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}

export default HubspotIntegrationPopup;