import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemIcon, ListItemButton, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from './ToastNotification';
import Image from 'next/image';
import SearchIcon from '@mui/icons-material/Search';
import ConnectKlaviyo from '@/app/(client)/data-sync/components/ConnectKlaviyo';
import ConnectSalesForce from '@/app/(client)/data-sync/components/ConnectSalesForce';
import ConnectMeta from '@/app/(client)/data-sync/components/ConnectMeta';
import KlaviyoIntegrationPopup from './KlaviyoIntegrationPopup';
import ZapierConnectPopup from './ZapierConnectPopup';
import SalesForceIntegrationPopup from './SalesForceIntegrationPopup';
import BingAdsIntegrationPopup from './BingAdsIntegrationPopup';
import SlackConnectPopup from './SlackConnectPopup';
import GoogleADSConnectPopup from './GoogleADSConnectPopup';
import WebhookConnectPopup from './WebhookConnectPopup';
import MetaConnectButton from './MetaConnectButton';
import AlivbleIntagrationsSlider from './AvalibleIntegrationsSlider';
import OmnisendConnect from './OmnisendConnect';
import OnmisendDataSync from '../app/(client)/data-sync/components/OmnisendDataSync';
import BingAdsDataSync from '../app/(client)/data-sync/components/BingAdsDataSync';
import MailchimpConnect from './MailchimpConnect';
import MailchimpDatasync from '../app/(client)/data-sync/components/MailchimpDatasync';
import SlackDatasync from '../app/(client)/data-sync/components/SlackDataSync';
import GoogleADSDatasync from '../app/(client)/data-sync/components/GoogleADSDataSync';
import SendlaneConnect from './SendlaneConnect';
import S3Connect from './S3Connect';
import SendlaneDatasync from '../app/(client)/data-sync/components/SendlaneDatasync';
import S3Datasync from '../app/(client)/data-sync/components/S3Datasync';
import WebhookDatasync from '../app/(client)/data-sync/components/WebhookDatasync';
import ZapierDataSync from '../app/(client)/data-sync/components/ZapierDataSync';
import ConnectHubspot from '../app/(client)/data-sync/components/HubspotDataSync';
import HubspotDataSync from '../app/(client)/data-sync/components/HubspotDataSync';
import HubspotIntegrationPopup from './HubspotIntegrationPopup';

interface AudiencePopupProps {
    open: boolean;
    onClose: () => void;
    selectedLeads?: number[];
}

interface ListItem {
    audience_id: number;
    audience_name: string;
    leads_count: number;
}


interface IntegrationsCredentials {
    id?: number
    access_token?: string
    shop_domain?: string
    data_center?: string
    service_name: string
    is_with_suppression?: boolean
    is_failed?: boolean
}

interface Integrations {
    id: number
    service_name: string
    data_sync: boolean
}

const AudiencePopup: React.FC<AudiencePopupProps> = ({ open, onClose, selectedLeads }) => {
    const [plusIconPopupOpen, setPlusIconPopupOpen] = useState(false);
    const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
    const [bingAdsIconPopupOpen, setBingAdsIconPopupOpen] = useState(false);
    const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [isExportDisabled, setIsExportDisabled] = useState(true);
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationsCredentials[]>([])
    const [createKlaviyo, setCreateKlaviyo] = useState<boolean>(false)
    const [createBingAds, setCreateBingAds] = useState<boolean>(false)
    const [createHubspot, setCreateHubspot] = useState<boolean>(false)
    const [createSalesForce, setCreateSalesForce] = useState<boolean>(false)
    const [createWebhook, setCreateWebhook] = useState<boolean>(false)
    const [createSlack, setCreateSlack] = useState<boolean>(false)
    const [createGoogleAds, setCreateGoogleAds] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)
    const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false)
    const [googleAdsIconPopupOpen, setOpenGoogleAdsIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [openSendlaneIconPopupOpen, setOpenSendlaneIconPopupOpen] = useState(false)
    const [openS3IconPopupOpen, setOpenS3IconPopupOpen] = useState(false)
    const [openWebhookIconPopupOpen, setOpenWebhookIconPopupOpen] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
    const [openS3Connect, setOpenS3Connect] = useState(false)
    const [openZapierDataSync, setOpenZapierDataSync] = useState(false)
    const [openZapierConnect, setOpenZapierConnect] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [openBingAdsConnect, setOpenBingAdsConnect] = useState(false)
    const [omnisendIconPopupOpen, setOpenOmnisendIconPopupOpen] = useState(false)
    const [hubspotIconPopupOpen, setOpenHubspotIconPopupOpen] = useState(false)


    useEffect(() => {
        const fetchData = async () => {
            const response = await axiosInstance.get('/integrations/')
            if (response.status === 200) {
                setIntegrations(response.data)
            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInstance.get('/integrations/credentials/')
                if (response.status === 200) {
                    setIntegrationsCredentials(response.data)
                }
            } catch (error) {

            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

    const handleOmnisendIconPopupOpenClose = () => {
        setOpenOmnisendIconPopupOpen(false)
    }

    const handleHubspotIconPopupOpenClose = () => {
        setOpenHubspotIconPopupOpen(false)
    }


    const handlePlusIconPopupOpen = () => {
        setPlusIconPopupOpen(true);
        setSelectedIntegration(null); // Reset the selection
        setIsExportDisabled(true); // Disable export button when the plus icon is clicked

    };

    const handlePlusIconPopupClose = () => {
        setPlusIconPopupOpen(false);
    };

    const handleKlaviyoIconPopupOpen = () => {
        setKlaviyoIconPopupOpen(true);
    };

    const handleBingAdsIconPopupOpen = () => {
        setBingAdsIconPopupOpen(true);
    };

    const handleBingAdsIconPopupClose = () => {
        setBingAdsIconPopupOpen(false);
    };

    const handleSalesForceIconPopupOpen = () => {
        setSalesForceIconPopupOpen(true);
    };

    const handleOmnisendConnectOpen = () => {
        setIsInvalidApiKey(true)
        setOpenOmnisendConnect(true)
    }

    const handleOmnisendConnectClose = () => {
        setOpenOmnisendConnect(false)
        handleOmnisendIconPopupOpen()
    }

    const handleOmnisendIconPopupOpen = () => {
        setOpenOmnisendIconPopupOpen(true);
    };

    const handleHubspotIconPopupOpen = () => {
        setOpenHubspotIconPopupOpen(true);
    };

    const handleKlaviyoIconPopupClose = () => {
        setKlaviyoIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleSalesForceIconPopupClose = () => {
        setSalesForceIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleOpenMailchimpConnect = () => {
        setIsInvalidApiKey(true)
        setOpenmailchimpConnect(true)
    }

    const handleSlackIconPopupIconOpen = () => {
        setOpenSlackIconPopup(true)
    }

    const handleGoogleAdsIconPopupIconOpen = () => {
        setOpenGoogleAdsIconPopup(true)
    }

    const handleMailchimpIconPopupIconOpen = () => {
        setOpenMailchimpIconPopup(true)
    }

    const handleCreateSlackOpen = () => {
        setIsInvalidApiKey(true)
        setCreateSlack(true)
    }

    const handleCreateGoogleAdsOpen = () => {
        setIsInvalidApiKey(true)
        setCreateGoogleAds(true)
    }

    const handleMailchimpIconPopupIconClose = () => {
        setOpenMailchimpIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleSlackIconPopupIconClose = () => {
        setOpenSlackIconPopup(false)
        setPlusIconPopupOpen(false)
    }
    const handleGoogleAdsIconPopupIconClose = () => {
        setOpenGoogleAdsIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleMetaIconPopupOpen = () => {
        setMetaIconPopupOpen(true);
    };

    const handleMetaIconPopupClose = () => {
        setMetaIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleOpenMailchimpConnectClose = () => {
        setOpenmailchimpConnect(false)
    }

    const handleIntegrationSelect = (integration: string) => {
        setSelectedIntegration(integration);
        setIsExportDisabled(false); // Enable export button when an integration is selected
    };

    const handleSaveSettings = (newIntegration: any) => {
        setIntegrationsCredentials(prevIntegrations => {
            if (prevIntegrations.some(integration => integration.service_name === newIntegration.service_name)) {
                return prevIntegrations.map(integration =>
                    integration.service_name === newIntegration.service_name ? newIntegration : integration
                );
            } else {
                return [...prevIntegrations, newIntegration];
            }
        });
        const service = newIntegration.service_name
        switch (service) {
            case 'meta':
                handleMetaIconPopupOpen()
                break
            case 'klaviyo':
                handleKlaviyoIconPopupOpen()
                break
            case 'bing_ads':
                handleBingAdsIconPopupOpen()
                break
            case 'mailchimp':
                handleMailchimpIconPopupIconOpen()
                break
            case 'omnisend':
                handleOmnisendIconPopupOpen()
                break
            case 'sendlane':
                handleSendlaneIconPopupOpen()
                break
            case 's3':
                handleS3IconPopupOpen()
                break
            case 'slack':
                handleSlackIconPopupIconOpen()
                break
            case 'google_ads':
                handleGoogleAdsIconPopupIconOpen()
            case 'webhook':
                handleWebhookIconPopupOpen()
                break
            case 'hubspot':
                handleHubspotIconPopupOpen()
                break
        }
    };

    const handleSendlaneIconPopupOpen = () => {
        setOpenSendlaneIconPopupOpen(true)
    }

    const handleS3IconPopupOpen = () => {
        setOpenS3IconPopupOpen(true)
    }

    const handleWebhookIconPopupOpen = () => {
        setOpenWebhookIconPopupOpen(true)
    }

    const handleSendlaneIconPopupClose = () => {
        setOpenSendlaneIconPopupOpen(false)
    }

    const handleS3IconPopupClose = () => {
        setOpenS3IconPopupOpen(false)
    }

    const handleWebhookIconPopupClose = () => {
        setOpenWebhookIconPopupOpen(false)
    }

    const handleSendlaneConnectOpen = () => {
        setIsInvalidApiKey(true)
        setOpenSendlaneConnect(true)
    }

    const handleSendlaneConnectClose = () => {
        setOpenSendlaneConnect(false)
    }

    const handleS3ConnectOpen = () => {
        setIsInvalidApiKey(true)
        setOpenS3Connect(true)
    }

    const handleS3ConnectClose = () => {
        setOpenS3Connect(false)
    }

    const handleCreateKlaviyoOpen = () => {
        setIsInvalidApiKey(true)
        setCreateKlaviyo(true)
    }

    const handleCreateBingAdsOpen = () => {
        setIsInvalidApiKey(true)
        setCreateBingAds(true)
    }

    const handleCreateBingAdsClose = () => {
        setCreateBingAds(false)
    }

    const handleCreateHubspotOpen = () => {
        setIsInvalidApiKey(true)
        setCreateHubspot(true)
    }

    const handleCreateMetaOpen = () => {
        setIsInvalidApiKey(true)
        setMetaConnectApp(true)
    }

    const handleCreateSalesForceOpen = () => {
        setIsInvalidApiKey(true)
        setCreateSalesForce(true)
    }

    const handleCreateKlaviyoClose = () => {
        setIsInvalidApiKey(false)
        setCreateKlaviyo(false)
    }

    const handleCreateSalesForceClose = () => {
        setCreateSalesForce(false)
    }

    const handleCreateWebhookOpen = () => {
        setIsInvalidApiKey(true)
        setCreateWebhook(true)
    }

    const handleCreateWebhookClose = () => {
        setIsInvalidApiKey(false)
        setCreateWebhook(false)
    }

    const handleCreateSlackClose = () => {
        setCreateSlack(false)
    }

    const handleCreateGoogleAdsClose = () => {
        setCreateGoogleAds(false)
    }

    const handleOpenZapierDataSync = () => {
        setOpenZapierDataSync(true)
    }

    const handleOpenZapierConnect = () => {
        setIsInvalidApiKey(true)
        setOpenZapierConnect(true)
    }

    const handleCloseZapierConnect = () => {
        setOpenZapierConnect(false)
    }

    const handleCloseZapierDataSync = () => {
        setOpenZapierDataSync(false)
    }

    const handleCloseMetaConnectApp = () => {
        setIntegrationsCredentials(prevIntegratiosn => [...prevIntegratiosn, {
            service_name: 'meta'
        }])
        setMetaConnectApp(false)
    }

    return (
        <>
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
                        '@media (max-width: 600px)': {
                            width: '100%',
                        }
                    },
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.125)'
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center', }}>
                        Create contact sync
                    </Typography>
                    <IconButton onClick={onClose} sx={{ p: 0 }}>
                        <CloseIcon sx={{ width: '20px', height: '20px' }} />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                    <Box sx={{ px: 3, py: 2, width: '100%' }}>
                        <Box sx={{ px: 2, py: 3, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                            <Typography variant="h6" className="first-sub-title">
                                Choose from integrated platform
                            </Typography>
                            <List sx={{ display: 'flex', gap: '16px', py: 2, flexWrap: 'wrap' }}>
                                {/* Meta */}
                                {integrationsCredentials.some(integration => integration.service_name === 'meta') && (
                                    <ListItem sx={{
                                        p: 0, borderRadius: '4px', border: '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'meta')?.is_failed
                                            ? handleMetaIconPopupOpen
                                            : handleCreateMetaOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'hubspot' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/meta-icon.svg" alt="meta" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Meta" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px"
                                                }
                                            }} />
                                        </ListItemButton>
                                    </ListItem>)}
                                {/* HubSpot */}
                                {integrationsCredentials.some(integration => integration.service_name === 'hubspot') && (
                                    <ListItem sx={{
                                        p: 0, borderRadius: '4px', border: selectedIntegration === 'hubspot' ? '1px solid #5052B2' : '1px solid #e4e4e4', width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)'
                                        }
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'hubspot')?.is_failed
                                            ? handleHubspotIconPopupOpen
                                            : handleCreateHubspotOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'hubspot' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/hubspot.svg" alt="hubspot" height={28} width={27} />
                                            </ListItemIcon>
                                            <ListItemText primary="hubspot" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px"
                                                }
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Klaviyo */}
                                {integrationsCredentials.some(integration => integration.service_name === 'klaviyo') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'klaviyo' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'klaviyo')?.is_failed
                                            ? handleKlaviyoIconPopupOpen
                                            : handleCreateKlaviyoOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'klaviyo' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/klaviyo.svg" alt="klaviyo" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Klaviyo" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* BingAds */}
                                {integrationsCredentials.some(integration => integration.service_name === 'bing_ads') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'klaviyo' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'bing_ads')?.is_failed
                                            ? handleBingAdsIconPopupOpen
                                            : handleCreateBingAdsOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'bing_ads' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/bing-ads.svg" alt="bingads" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="BingAds" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* SalesForce */}
                                {integrationsCredentials.some(integration => integration.service_name === 'sales_force') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'sales_force' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'sales_force')?.is_failed
                                            ? handleSalesForceIconPopupOpen
                                            : handleCreateSalesForceOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'sales_force' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/salesforce-icon.svg" alt="salesforse" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="SalesForce" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Webhook */}
                                {integrationsCredentials.some(integration => integration.service_name === 'webhook') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'webhook' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'webhook')?.is_failed
                                            ? handleWebhookIconPopupOpen
                                            : handleCreateWebhookOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'omnisend' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/webhook-icon.svg" alt="webhook" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Webhook" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Omnisend */}
                                {integrationsCredentials.some(integration => integration.service_name === 'omnisend') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'omnisend' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'omnisend')?.is_failed
                                            ? handleOmnisendIconPopupOpen
                                            : handleOmnisendConnectOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'omnisend' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/omnisend_icon_black.svg" alt="omnisend" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Omnisend" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Slack */}
                                {integrationsCredentials.some(integration => integration.service_name === 'slack') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'omnisend' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'slack')?.is_failed
                                            ? handleSlackIconPopupIconOpen
                                            : handleCreateSlackOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'omnisend' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/slack-icon.svg" alt="Slack" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Slack" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* GoogleAds */}
                                {integrationsCredentials.some(integration => integration.service_name === 'google_ads') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'google_ads' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'google_ads')?.is_failed
                                            ? handleGoogleAdsIconPopupIconOpen
                                            : handleCreateGoogleAdsOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'google_ads' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/google-ads.svg" alt="Slack" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="GoogleAds" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Mailchimp */}
                                {integrationsCredentials.some(integration => integration.service_name === 'mailchimp') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'mailchimp' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'mailchimp')?.is_failed
                                            ? handleMailchimpIconPopupIconOpen
                                            : handleOpenMailchimpConnect
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'mailchimp' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/mailchimp-icon.svg" alt="mailchimp" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Mailchimp" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* Sendlane */}
                                {integrationsCredentials.some(integration => integration.service_name === 'sendlane') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'sendlane' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'sendlane')?.is_failed
                                            ? handleSendlaneIconPopupOpen
                                            : handleSendlaneConnectOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'sendlane' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/sendlane-icon.svg" alt="sendlane" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="Sendlane" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {/* S3 */}
                                {integrationsCredentials.some(integration => integration.service_name === 's3') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 's3' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 's3')?.is_failed
                                            ? handleS3IconPopupOpen
                                            : handleS3ConnectOpen
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 's3' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/s3-icon.svg" alt="s3" height={26} width={32} />
                                            </ListItemIcon>
                                            <ListItemText primary="S3" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                {integrationsCredentials.some(integration => integration.service_name === 'zapier') && (
                                    <ListItem sx={{
                                        p: 0,
                                        borderRadius: '4px',
                                        border: selectedIntegration === 'sendlane' ? '1px solid #5052B2' : '1px solid #e4e4e4',
                                        width: 'auto',
                                        '@media (max-width:600px)': {
                                            flexBasis: 'calc(50% - 8px)',
                                        },
                                    }}>
                                        <ListItemButton onClick={!integrationsCredentials.find(integration => integration.service_name === 'zapier')?.is_failed
                                            ? handleOpenZapierDataSync
                                            : handleOpenZapierConnect
                                        } sx={{
                                            p: 0,
                                            flexDirection: 'column',
                                            px: 3,
                                            py: 1.5,
                                            width: '102px',
                                            height: '72px',
                                            justifyContent: 'center',
                                            backgroundColor: selectedIntegration === 'zapier' ? 'rgba(80, 82, 178, 0.10)' : 'transparent',
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 'auto' }}>
                                                <Image src="/zapier-icon.svg" alt="zapier" height={26} width={26} />
                                            </ListItemIcon>
                                            <ListItemText primary="Zapier" primaryTypographyProps={{
                                                sx: {
                                                    fontFamily: "Nunito Sans",
                                                    fontSize: "14px",
                                                    color: "#4a4a4a",
                                                    fontWeight: "500",
                                                    lineHeight: "20px",
                                                },
                                            }} />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                                <ListItem sx={{
                                    p: 0,
                                    borderRadius: '4px',
                                    border: '1px dotted #5052B2',
                                    width: 'auto',
                                    '@media (max-width:600px)': {
                                        flexBasis: 'calc(50% - 8px)',
                                    },
                                }}>
                                    <ListItemButton onClick={handlePlusIconPopupOpen} sx={{
                                        p: 0,
                                        flexDirection: 'column',
                                        px: 3,
                                        py: 1.5,
                                        width: '102px',
                                        height: '72px',
                                        justifyContent: 'center',
                                    }}>
                                        <ListItemIcon sx={{ minWidth: 'auto' }}>
                                            <Image src="/add-square.svg" alt="add-square" height={36} width={40} />
                                        </ListItemIcon>
                                    </ListItemButton>
                                </ListItem>

                            </List>

                        </Box>
                    </Box>
                </Box>
            </Drawer>

            {/* Data Sync */}
            <ConnectKlaviyo data={null} open={klaviyoIconPopupOpen} onClose={handleKlaviyoIconPopupClose} />
            <BingAdsDataSync open={bingAdsIconPopupOpen} onClose={handleBingAdsIconPopupClose} isEdit={false} data={null} />
            <ConnectSalesForce data={null} open={salesForceIconPopupOpen} onClose={handleSalesForceIconPopupClose} />
            <ConnectMeta data={null} open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} isEdit={false} />
            <OnmisendDataSync open={omnisendIconPopupOpen} onClose={handleOmnisendIconPopupOpenClose} isEdit={false} data={null} />
            <HubspotDataSync open={hubspotIconPopupOpen} onClose={handleHubspotIconPopupOpenClose} isEdit={false} data={null} />
            <SendlaneDatasync open={openSendlaneIconPopupOpen} onClose={handleSendlaneIconPopupClose} data={null} isEdit={false} />
            <S3Datasync open={openS3IconPopupOpen} onClose={handleS3IconPopupClose} data={null} isEdit={false} />
            <WebhookDatasync open={openWebhookIconPopupOpen} onClose={handleWebhookIconPopupClose} data={null} isEdit={false} />
            <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupIconClose} data={null} />
            <SlackDatasync open={slackIconPopupOpen} onClose={handleSlackIconPopupIconClose} data={null} isEdit={false} />
            <GoogleADSDatasync open={googleAdsIconPopupOpen} onClose={handleGoogleAdsIconPopupIconClose} data={null} isEdit={false} />
            <ZapierDataSync open={openZapierDataSync} handleClose={handleCloseZapierDataSync} />

            {/* Add Integration */}
            <AlivbleIntagrationsSlider open={plusIconPopupOpen} onClose={handlePlusIconPopupClose} isContactSync={true} integrations={integrations} integrationsCredentials={integrationsCredentials} handleSaveSettings={handleSaveSettings} />
            <SlackConnectPopup open={createSlack} handlePopupClose={handleCreateSlackClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'slack')?.access_token} />
            <GoogleADSConnectPopup open={createGoogleAds} handlePopupClose={handleCreateGoogleAdsClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'google_ads')?.access_token} />
            <WebhookConnectPopup open={createWebhook} handleClose={handleCreateWebhookClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'webhook')?.access_token} />
            <KlaviyoIntegrationPopup open={createKlaviyo} handleClose={handleCreateKlaviyoClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'klaviyo')?.access_token} />
            <ZapierConnectPopup open={openZapierConnect} handlePopupClose={handleCloseZapierConnect} invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)" />
            <BingAdsIntegrationPopup open={createBingAds} handleClose={handleCreateBingAdsClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'bing_ads')?.access_token} />
            <SalesForceIntegrationPopup open={createSalesForce} handleClose={handleCreateSalesForceClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sales_force')?.access_token} />
            <MailchimpConnect onSave={handleSaveSettings} open={openMailchimpConnect} handleClose={handleOpenMailchimpConnectClose} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'mailchimp')?.access_token} />
            <S3Connect open={openS3Connect} handleClose={handleS3ConnectClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 's3')?.access_token} />
            <SendlaneConnect open={openSendlaneConnect} handleClose={handleSendlaneConnectClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sendlane')?.access_token} />
            <OmnisendConnect open={openOmnisendConnect} handleClose={handleOmnisendConnectClose} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'omnisend')?.access_token} />
            <HubspotIntegrationPopup open={createHubspot} handleClose={() => setCreateHubspot(false)} onSave={handleSaveSettings} invalid_api_key={isInvalidApiKey} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'hubspot')?.access_token} />
            <MetaConnectButton open={metaConnectApp} onClose={handleCloseMetaConnectApp} invalid_api_key={isInvalidApiKey} onSave={handleSaveSettings} />
        </>
    );
};

export default AudiencePopup;