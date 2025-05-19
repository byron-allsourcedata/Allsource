import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemIcon, ListItemButton, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components//ToastNotification';
import Image from 'next/image';
import ConnectKlaviyo from '@/app/(client)/data-sync/components/ConnectKlaviyo';
import ConnectSalesForce from '@/app/(client)/data-sync/components/ConnectSalesForce';
import ConnectMeta from './SyncMetaSlider';
import KlaviyoIntegrationPopup from '@/components/KlaviyoIntegrationPopup';
import SalesForceIntegrationPopup from '@/components/SalesForceIntegrationPopup';
import BingAdsIntegrationPopup from '@/components/BingAdsIntegrationPopup';
import SlackConnectPopup from '@/components//SlackConnectPopup';
import GoogleADSConnectPopup from '@/components//GoogleADSConnectPopup';
import MetaConnectButton from '@/components//MetaConnectButton';
import AlivbleIntagrationsSlider from '@/components//AvalibleIntegrationsSlider';
import WebhookConnectPopup from '@/components//WebhookConnectPopup';
import LinkedinConnectPopup from "@/components/LinkedinConnectPopup";
import OmnisendConnect from '@/components//OmnisendConnect';
import OnmisendDataSync from '@/app/(client)/data-sync/components/OmnisendDataSync';
import MailchimpConnect from '@/components/MailchimpConnect';
import MailchimpDatasync from '@/app/(client)/data-sync/components/MailchimpDatasync';
import WebhookDatasync from '@/app/(client)/data-sync/components/WebhookDatasync';
import SlackDatasync from '@/app/(client)/data-sync/components/SlackDataSync';
import GoogleADSDatasync from '@/app/(client)/data-sync/components/GoogleADSDataSync';
import LinkedinDataSync from '@/app/(client)/data-sync/components/LinkedinDataSync';
import SendlaneConnect from '@/components/SendlaneConnect';
import S3Connect from '@/components/S3Connect';
import SendlaneDatasync from '@/app/(client)/data-sync/components/SendlaneDatasync';
import S3Datasync from '@/app/(client)/data-sync/components/S3Datasync';
import BingAdsDataSync from '@/app/(client)/data-sync/components/BingAdsDataSync';
import ZapierDataSync from '@/app/(client)/data-sync/components/ZapierDataSync';

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
    const [listItems, setListItems] = useState<ListItem[]>([]);
    const [plusIconPopupOpen, setPlusIconPopupOpen] = useState(false);
    const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
    const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [isExportDisabled, setIsExportDisabled] = useState(true);
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationsCredentials[]>([])
    const [createKlaviyo, setCreateKlaviyo] = useState<boolean>(false)
    const [createSalesForce, setCreateSalesForce] = useState<boolean>(false)
    const [createBingAds, setCreateBingAds] = useState<boolean>(false)
    const [createSlack, setCreateSlack] = useState<boolean>(false)
    const [createGoogleADS, setCreateGoogleADS] = useState<boolean>(false)
    const [createLinkedin, setCreateLinkedin] = useState<boolean>(false)
    const [createWebhook, setCreateWebhook] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [omnisendIconPopupOpen, setOpenOmnisendIconPopupOpen] = useState(false)
    const [bingAdsIconPopupOpen, setOpenBingAdsIconPopupOpen] = useState(false)
    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [webhookIconPopupOpen, setOpenWebhookIconPopup] = useState(false)
    const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false)
    const [googleADSIconPopupOpen, setOpenGoogleADSIconPopup] = useState(false)
    const [linkedinIconPopupOpen, setOpenLinkedinIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [openSendlaneIconPopupOpen, setOpenSendlaneIconPopupOpen] = useState(false)
    const [openS3IconPopupOpen, setOpenS3IconPopupOpen] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
    const [openS3Connect, setOpenS3Connect] = useState(false)
    const [openZapierDataSync, setOpenZapierDataSync] = useState(false)

    const fetchListItems = async () => {
        try {
            const response = await axiosInstance.get('/audience/list');
            setListItems(response.data);
        } catch (error) {
            showErrorToast('Error fetching list items');
        }
    };

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

    useEffect(() => {
        if (open) {
            fetchListItems();
        }
    }, [open]);


    const handleOmnisendIconPopupOpenClose = () => {
        setOpenOmnisendConnect(false)
        setOpenOmnisendIconPopupOpen(false)
    }

    const handleBingAdsIconPopupOpenClose = () => {
        setOpenBingAdsIconPopupOpen(false)
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

    const handleOmnisendIconPopupOpen = () => {
        setOpenOmnisendIconPopupOpen(true);
    };

    const handleKlaviyoIconPopupClose = () => {
        setKlaviyoIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleSalesForceIconPopupClose = () => {
        setSalesForceIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleSlackIconPopupIconOpen = () => {
        setOpenSlackIconPopup(true)
    }

    const handleGoogleAdsIconPopupIconOpen = () => {
        setOpenGoogleADSIconPopup(true)
    }

    const handleLinkedinIconPopupIconOpen = () => {
        setOpenLinkedinIconPopup(true)
    }

    const handleWebhookIconPopupIconOpen = () => {
        setOpenWebhookIconPopup(true)
    }

    const handleBingAdsIconPopupIconOpen = () => {
        setOpenBingAdsIconPopupOpen(true)
    }

    const handleMailchimpIconPopupIconOpen = () => {
        setOpenMailchimpIconPopup(true)
    }

    const handleMailchimpIconPopupIconClose = () => {
        setOpenMailchimpIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleWebhookIconPopupIconClose = () => {
        setOpenWebhookIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleSlackIconPopupIconClose = () => {
        setOpenSlackIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleGoogleADSIconPopupIconClose = () => {
        setOpenGoogleADSIconPopup(false)
        setPlusIconPopupOpen(false)
    }

    const handleLinkedinIconPopupIconClose = () => {
        setOpenLinkedinIconPopup(false)
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
            case 'Meta':
                handleMetaIconPopupOpen()
                break
            case 'Klaviyo':
                handleKlaviyoIconPopupOpen()
                break
            case 'Mailchimp':
                handleMailchimpIconPopupIconOpen()
                break
            case 'Omnisend':
                handleOmnisendIconPopupOpen()
                break
            case 'Sendlane':
                handleSendlaneIconPopupOpen()
                break
            case 'S3':
                handleS3IconPopupOpen()
                break
            case 'Slack':
                handleSlackIconPopupIconOpen()
                break
            case 'GoogleAds':
                handleGoogleAdsIconPopupIconOpen()
                break
            case 'Linedin':
                handleLinkedinIconPopupIconOpen()
                break
            case 'Webhook':
                handleWebhookIconPopupIconOpen()
                break
            case 'BingAds':
                handleBingAdsIconPopupIconOpen()
                break
        }
    };

    const handleSendlaneIconPopupOpen = () => {
        setOpenSendlaneIconPopupOpen(true)
    }

    const handleSendlaneIconPopupClose = () => {
        setOpenSendlaneIconPopupOpen(false)
    }

    const handleS3IconPopupOpen = () => {
        setOpenS3IconPopupOpen(true)
    }

    const handleS3IconPopupClose = () => {
        setOpenS3IconPopupOpen(false)
    }

    const handleSendlaneConnectClose = () => {
        setOpenSendlaneConnect(false)
    }

    const handleS3ConnectClose = () => {
        setOpenS3Connect(false)
    }

    const handleCreateKlaviyoClose = () => {
        setCreateKlaviyo(false)
    }

    const handleCreateSalesForceClose = () => {
        setCreateSalesForce(false)
    }

    const handleCreateBingAdsClose = () => {
        setCreateBingAds(false)
    }

    const handleCreateSlackClose = () => {
        setCreateSlack(false)
    }

    const handleCreateADSClose = () => {
        setCreateGoogleADS(false)
    }

    const handleLinkedinClose = () => {
        setCreateLinkedin(false)
    }

    const handleCreateWebhookClose = () => {
        setCreateWebhook(false)
    }

    const handleCloseZapierDataSync = () => {
        setOpenZapierDataSync(false)
    }

    const handleCloseMetaConnectApp = () => {
        setIntegrationsCredentials(prevIntegratiosn => [...prevIntegratiosn, {
            service_name: 'Meta'
        }])
        setMetaIconPopupOpen(true)
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
                        Audience Sync
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
                                        <ListItemButton onClick={() => setMetaIconPopupOpen(true)} sx={{ p: 0, flexDirection: 'column', px: 3, py: 1.5, width: '102px', height: '72px', justifyContent: 'center' }}>
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
            <ConnectSalesForce data={null} open={salesForceIconPopupOpen} onClose={handleSalesForceIconPopupClose} />
            <ConnectMeta data={null} open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} />
            <OnmisendDataSync open={omnisendIconPopupOpen} onClose={handleOmnisendIconPopupOpenClose} isEdit={false} data={null} />
            <BingAdsDataSync open={bingAdsIconPopupOpen} onClose={handleBingAdsIconPopupOpenClose} isEdit={false} data={null} />
            <SendlaneDatasync open={openSendlaneIconPopupOpen} onClose={handleSendlaneIconPopupClose} data={null} isEdit={false} />
            <S3Datasync open={openS3IconPopupOpen} onClose={handleS3IconPopupClose} data={null} isEdit={false} />
            <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupIconClose} data={null} />
            <WebhookDatasync open={webhookIconPopupOpen} onClose={handleWebhookIconPopupIconClose} data={null} isEdit={false} />
            <SlackDatasync open={slackIconPopupOpen} onClose={handleSlackIconPopupIconClose} data={null} isEdit={false} />
            <GoogleADSDatasync open={googleADSIconPopupOpen} onClose={handleGoogleADSIconPopupIconClose} data={null} isEdit={false} />
            <LinkedinDataSync open={linkedinIconPopupOpen} onClose={handleLinkedinIconPopupIconClose} data={null} isEdit={false} />
            <ZapierDataSync open={openZapierDataSync} handleClose={handleCloseZapierDataSync} />

            {/* Add Integration */}
            <AlivbleIntagrationsSlider open={plusIconPopupOpen} onClose={handlePlusIconPopupClose} isContactSync={true} integrations={integrations} integrationsCredentials={integrationsCredentials} handleSaveSettings={handleSaveSettings} />
            <WebhookConnectPopup open={createWebhook} handleClose={handleCreateWebhookClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'webhook')?.access_token} />
            <SlackConnectPopup open={createSlack} handlePopupClose={handleCreateSlackClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'slack')?.access_token} />
            <LinkedinConnectPopup open={createLinkedin} handlePopupClose={handleLinkedinClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'linkedin')?.access_token} />
            <GoogleADSConnectPopup open={createGoogleADS} handlePopupClose={handleCreateADSClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'google_ads')?.access_token} />
            <KlaviyoIntegrationPopup open={createKlaviyo} invalid_api_key={false} handleClose={handleCreateKlaviyoClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'klaviyo')?.access_token} />
            <SalesForceIntegrationPopup open={createSalesForce} handleClose={handleCreateSalesForceClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sales_force')?.access_token} />
            <BingAdsIntegrationPopup open={createBingAds} handleClose={handleCreateBingAdsClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'bing_ads')?.access_token} />
            <MailchimpConnect onSave={handleSaveSettings} open={openMailchimpConnect} handleClose={handleOpenMailchimpConnectClose} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'mailchimp')?.access_token} />
            <S3Connect open={openS3Connect} handleClose={handleS3ConnectClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 's3')?.access_token} />
            <SendlaneConnect open={openSendlaneConnect} handleClose={handleSendlaneConnectClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sendlane')?.access_token} />
            <OmnisendConnect open={openOmnisendConnect} handleClose={() => setOpenOmnisendConnect(false)} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'omnisend')?.access_token} />
            <MetaConnectButton open={metaConnectApp} onClose={handleCloseMetaConnectApp} onSave={handleSaveSettings} />
        </>
    );
};

export default AudiencePopup;