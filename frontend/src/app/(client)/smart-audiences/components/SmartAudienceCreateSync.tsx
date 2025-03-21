import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Box, Typography, IconButton, List, ListItem, ListItemIcon, ListItemButton, Button, ListItemText, Popover, Tooltip, Tab, Slider, TextField, Card,
    CardContent } from '@mui/material';
import TabList from "@mui/lab/TabList";
import TabPanel from '@mui/lab/TabPanel';
import TabContext from "@mui/lab/TabContext";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import Image from 'next/image';
import SearchIcon from '@mui/icons-material/Search';
import ConnectKlaviyo from '@/app/(client)/data-sync/components/ConnectKlaviyo';
import ConnectSalesForce from '@/app/(client)/data-sync/components/ConnectSalesForce';
import ConnectMeta from '@/app/(client)/data-sync/components/ConnectMeta';
import KlaviyoIntegrationPopup from '@/components/KlaviyoIntegrationPopup';
import SalesForceIntegrationPopup from '@/components/SalesForceIntegrationPopup';
import SlackIntegrationPopup from '@/components/SlackIntegrationPopup';
import GoogleADSConnectPopup from '@/components/GoogleADSConnectPopup';
import WebhookConnectPopup from '@/components/WebhookConnectPopup';
import MetaConnectButton from '@/components/MetaConnectButton';
import AlivbleIntagrationsSlider from '@/components/AvalibleIntegrationsSlider';
import OmnisendConnect from '@/components/OmnisendConnect';
import MailchimpConnect from '@/components/MailchimpConnect';
import SendlaneConnect from '@/components/SendlaneConnect';
import HubspotIntegrationPopup from '@/components/HubspotIntegrationPopup';
import OnmisendDataSync from '../../data-sync/components/OmnisendDataSync';
import MailchimpDatasync from '../../data-sync/components/MailchimpDatasync';
import SlackDatasync from '../../data-sync/components/SlackDataSync';
import GoogleADSDatasync from '../../data-sync/components/GoogleADSDataSync';
import SendlaneDatasync from '../../data-sync/components/SendlaneDatasync';
import WebhookDatasync from '../../data-sync/components/WebhookDatasync';
import ZapierDataSync from '../../data-sync/components/ZapierDataSync';
import ConnectHubspot from '../../data-sync/components/HubspotDataSync';
import HubspotDataSync from '../../data-sync/components/HubspotDataSync';
import CustomizedProgressBar from '@/components/CustomizedProgressBar';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';

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

interface IntegrationBoxProps {
    image: string;
    handleClick?: () => void;
    handleDelete?: () => void;
    service_name: string;
    active?: boolean;
    is_avalible?: boolean;
    error_message?: string;
    is_failed?: boolean;
    is_integrated?: boolean;
    isEdit?: boolean;
  }

const klaviyoStyles = {
    tabHeading: {
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
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#5052B2',
            },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
    },
}

const CreateSyncPopup: React.FC<AudiencePopupProps> = ({ open, onClose, selectedLeads }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isExistingListsOpen, setIsExistingListsOpen] = useState<boolean>(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [listName, setListName] = useState<string>('');
    const [plusIconPopupOpen, setPlusIconPopupOpen] = useState(false);
    const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
    const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [isExportDisabled, setIsExportDisabled] = useState(true);
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationsCredentials[]>([])
    const [createKlaviyo, setCreateKlaviyo] = useState<boolean>(false)
    const [createHubspot, setCreateHubspot] = useState<boolean>(false)
    const [createSalesForce, setCreateSalesForce] = useState<boolean>(false)
    const [createWebhook, setCreateWebhook] = useState<boolean>(false)
    const [createSlack, setCreateSlack] = useState<boolean>(false)
    const [createGoogleAds, setCreateGoogleAds] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)
    const [openBigcommrceConnect, setOpenBigcommerceConnect] = useState(false)

    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false)
    const [googleAdsIconPopupOpen, setOpenGoogleAdsIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [openSendlaneIconPopupOpen, setOpenSendlaneIconPopupOpen] = useState(false)
    const [openWebhookIconPopupOpen, setOpenWebhookIconPopupOpen] = useState(false)
    const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false)
    const [openZapierDataSync, setOpenZapierDataSync] = useState(false)
    const [openZapierConnect, setOpenZapierConnect] = useState(false)
    const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false)
    const [omnisendIconPopupOpen, setOpenOmnisendIconPopupOpen] = useState(false)
    const [openHubspotConnect, setOpenHubspotConnect] = useState(false)
    const [hubspotIconPopupOpen, setOpenHubspotIconPopupOpen] = useState(false)

    const [search, setSearch] = useState<string>('');
    const [activeService, setActiveService] = useState<string | null>(null);
    const [openDeletePopup, setOpenDeletePopup] = useState(false);
    const [openModal, setOpenModal] = useState<string | null>(null);
    const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [value, setValue] = useState('1');
    const [isDropdownValid, setIsDropdownValid] = useState(false);

    const handleDeleteOpen = () => {
        setOpenDeletePopup(true);
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

    const handleActive = (service: string) => {
        setActiveService(service);
      };

    const handleOmnisendIconPopupOpenClose = () => {
        setOpenOmnisendConnect(false)
        setOpenOmnisendIconPopupOpen(false)
    }

    const handleHubspotIconPopupOpenClose = () => {
        setOpenHubspotConnect(false)
        setOpenHubspotIconPopupOpen(false)
    }

    const toggleFormVisibility = () => {
        setIsFormOpen(!isFormOpen);
    };

    const toggleExistingListsVisibility = () => {
        setIsExistingListsOpen(!isExistingListsOpen);
    };

    const handleCheckboxChange = (audience_id: number) => {
        setCheckedItems(prev => {
            const newCheckedItems = new Set(prev);
            if (newCheckedItems.has(audience_id)) {
                newCheckedItems.delete(audience_id);
            } else {
                newCheckedItems.add(audience_id);
            }
            return newCheckedItems;
        });
    };

    const handleListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setListName(event.target.value);
    };

    const isSaveButtonDisabled = () => {
        if (selectedOption === 'create' && listName.trim() === '') {
            return true;
        }
        if (selectedOption === 'existing' && checkedItems.size === 0) {
            return true;
        }
        if (selectedOption === null) {
            return true;
        }
        return false;
    };


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

    const handleSalesForceIconPopupOpen = () => {
        setSalesForceIconPopupOpen(true);
    };

    const handleOmnisendConnectOpen = () => {
        setOpenOmnisendConnect(true)
    }

    const handleHubspotConnectOpen = () => {
        setOpenHubspotConnect(true)
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
        setOpenOmnisendConnect(false)
        setPlusIconPopupOpen(false)
    };

    const handleSalesForceIconPopupClose = () => {
        setSalesForceIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleOpenMailchimpConnect = () => {
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

    const handleSlackConnectOpen = () => {
        setOpenSlackIconPopup(true)
    }

    const handleGoogleAdsConnectOpen = () => {
        setOpenGoogleAdsIconPopup(true)
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
            case 'Slack':
                handleSlackIconPopupIconOpen()
                break
            case 'GoogleAds':
                handleGoogleAdsIconPopupIconOpen()
            case 'Webhook':
                handleWebhookIconPopupOpen()
                break
            case 'Hubspot':
                handleHubspotIconPopupOpen()
                break
        }
    };

    const handleSendlaneIconPopupOpen = () => {
        setOpenSendlaneIconPopupOpen(true)
    }

    const handleWebhookIconPopupOpen = () => {
        setOpenWebhookIconPopupOpen(true)
    }

    const handleSendlaneIconPopupClose = () => {
        setOpenSendlaneIconPopupOpen(false)
    }

    const handleWebhookIconPopupClose = () => {
        setOpenWebhookIconPopupOpen(false)
    }

    const handleSendlaneConnectOpen = () => {
        setOpenSendlaneConnect(true)
    }

    const handleSendlaneConnectClose = () => {
        setOpenSendlaneConnect(false)
    }

    const handleCreateKlaviyoOpen = () => {
        setCreateKlaviyo(true)
    }

    const handleCreateHubspotOpen = () => {
        setCreateHubspot(true)
    }
    
    const handleCreateSalesForceOpen = () => {
        setCreateSalesForce(true)
    }

    const handleCreateKlaviyoClose = () => {
        setCreateKlaviyo(false)
    }

    const handleCreateSalesForceClose = () => {
        setCreateSalesForce(false)
    }

    const handleCreateWebhookOpen = () => {
        setCreateWebhook(true)
    }

    const handleCreateWebhookClose = () => {
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
        setOpenZapierConnect(true)
    }

    const handleCloseZapierConnect = () => {
        setOpenZapierConnect(false)
    }

    const handleCloseZapierDataSync = () => {
        setOpenZapierDataSync(false)
    }

    const handleAddIntegration = async (service_name: string) => {
        try {
          setIsLoading(true)
          const response = await axiosInstance.get('/integrations/check-limit-reached')
          if (response.status === 200 && response.data == true) {
            setUpgradePlanPopup(true)
            return 
          }
        } catch (error) {
        }
        finally {
          setIsLoading(false)
        }
    
        const isIntegrated = integrationsCredentials.some(integration_cred => integration_cred.service_name === service_name);
        if (isIntegrated) return;
        setOpenModal(service_name);
      };

    const handleCloseMetaConnectApp = () => {
        setIntegrationsCredentials(prevIntegratiosn => [...prevIntegratiosn, {
            service_name: 'Meta'
        }])
        setMetaIconPopupOpen(true)
        setMetaConnectApp(false)
    }

    const validateTab2 = () => {
        return true;
    };

    const handleNextTab = async () => {

        if (value === '1') {
            setValue((prevValue) => {
                const nextValue = String(Number(prevValue) + 1);
                return nextValue;
            })
        }
        else if (value === '2') {
            if (validateTab2()) {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        } else if (value === '3') {

            if (isDropdownValid) {
                // Proceed to next tab
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
    };

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };


    const integrationsAvailable = [
        { image: 'klaviyo.svg', service_name: 'klaviyo' },
        { image: 'meta-icon.svg', service_name: 'meta' },
        { image: 'omnisend_icon_black.svg', service_name: 'omnisend' },
        { image: 'mailchimp-icon.svg', service_name: 'mailchimp' },
        { image: 'sendlane-icon.svg', service_name: 'sendlane' },
        //{ image: 'attentive.svg', service_name: 'attentive' },
        { image: 'zapier-icon.svg', service_name: 'zapier' },
        { image: 'slack-icon.svg', service_name: 'slack' },
        { image: 'webhook-icon.svg', service_name: 'webhook' },
        { image: 'hubspot.svg', service_name: 'hubspot' },
        { image: 'google-ads.svg', service_name: 'google_ads' },
        { image: 'salesforce-icon.svg', service_name: 'sales_force' }
      ];

      const [valueContactSync, setValueContactSync] = useState<number>(1000);
      const maxContacts = 10000;
    
      const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setValueContactSync(newValue as number);
      };
    
      const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = Number(event.target.value);
        if (inputValue >= 0 && inputValue <= maxContacts) {
            setValueContactSync(inputValue);
        }
      };

      const integratedServices = integrationsCredentials.map(cred => cred.service_name);

    const IntegrationBox = ({ image, handleClick, handleDelete, service_name, active, is_avalible, is_failed, is_integrated = false, isEdit }: IntegrationBoxProps) => {
        const [anchorEl, setAnchorEl] = useState(null);
        const openPopover = Boolean(anchorEl);
        const [isHovered, setIsHovered] = useState(false);
        const [openToolTip, setOpenTooltip] = useState(false);
        const tooltipRef = useRef<HTMLDivElement | null>(null);
      
        const altImageIntegration = [
          'Cordial'
        ]
      
        const openToolTipClick = () => {
          const isMobile = window.matchMedia('(max-width:900px)').matches;
          if (isMobile && !is_integrated) {
            setOpenTooltip(true);
          }
        };
      
        const handleClickOutside = (event: MouseEvent) => {
          if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
            setOpenTooltip(false);
          }
        };
      
        useEffect(() => {
          document.addEventListener('click', handleClickOutside);
          return () => {
            document.removeEventListener('click', handleClickOutside);
          };
        }, []);
      
      
        const handleOpen = (event: any) => {
          setAnchorEl(event.currentTarget);
        };
      
        const handleClickEdit = () => {
          handleClose();
          if (handleClick) {
            handleClick();
          }
        };
      
        const handleClickDelete = () => {
          handleClose();
          if (handleDelete) {
            handleDelete();
          }
        };
      
        const handleClose = () => {
          setAnchorEl(null);
        };
      
        const formatServiceName = (name: string): string => {
          if (name === "big_commerce") {
            return "BigCommerce";
          }
          if (name === "google_ads") {
            return "GoogleAds";
          }
          if (name === "sales_force") {
            return "SalesForce";
          }
          return name
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        };
      
      
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}>
            {isLoading && <CustomizedProgressBar />}
            <Tooltip
              open={openToolTip || isHovered}
              ref={tooltipRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={openToolTipClick}
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: '#f5f5f5',
                    color: '#000',
                    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                    border: ' 0.2px rgba(0, 0, 0, 0.04)',
                    borderRadius: '4px',
                    maxHeight: '100%',
                    whiteSpace: 'normal',
                    minWidth: '200px',
                    zIndex: 99,
                    padding: '11px 10px',
                    fontSize: '12px !important',
                    fontFamily: 'Nunito Sans',
      
                  },
                },
              }}
              title={is_integrated ? `A ${service_name} account is already integrated. To connect a different account, please remove the existing ${service_name} integration first.` : ""}>
              <Box sx={{
                backgroundColor: !is_integrated ? 'rgba(0, 0, 0, 0.04)' : active
                  ? 'rgba(80, 82, 178, 0.1)'
                  : 'transparent',
                border: active ? '1px solid #5052B2' : '1px solid #E4E4E4',
                position: 'relative',
                display: 'flex',
                borderRadius: '4px',
                cursor: is_integrated ? 'default' : 'pointer',
                width: '8rem',
                height: '8rem',
                filter: !is_integrated ? 'grayscale(1)' : 'none',
                justifyContent: 'center',
                alignItems: 'center',
                transition: '0.2s',
                '&:hover': {
                  boxShadow: is_integrated ? 'none' : '0 0 4px #00000040',
                  filter: !is_integrated ? 'none' : 'none',
                  backgroundColor: !is_integrated ? 'transparent' : 'rgba(80, 82, 178, 0.1)',
                },
                '&:hover .edit-icon': {
                  opacity: 1
                },
                "@media (max-width: 900px)": {
                  width: '156px'
                },
              }}>
                {!is_avalible && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <Box onClick={handleClick} sx={{
                      position: 'absolute',
                      top: '0%',
                      left: '0%',
                      margin: '8px 0 0 8px',
                      transition: 'opacity 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      background: !is_failed ? '#EAF8DD' : '#FCDBDC',
                      height: '20px',
                      padding: '2px 8px 1px 8px',
                      borderRadius: '4px'
                    }}>
                      {!is_failed ? (
                        <Typography fontSize={'12px'} fontFamily={'Nunito Sans'} color={'#2B5B00'} fontWeight={600}>Integrated</Typography>
                      ) : (
                        <Typography fontSize={'12px'} fontFamily={'Nunito Sans'} color={'#4E0110'} fontWeight={600}>Failed</Typography>
                      )}
                    </Box>
                    <Box className="edit-icon" onClick={handleOpen} sx={{
                      position: 'absolute',
                      top: '0%',
                      right: '0%',
                      margin: '8px 8.4px 0 0',
                      opacity: openPopover ? 1 : 0,
                      transition: 'opacity 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      '&:hover': {
                        backgroundColor: '#EDEEF7'
                      },
                      "@media (max-width: 900px)": {
                        opacity: 1
                      },
                    }}>
                      <MoreVertIcon sx={{ height: '20px' }} />
                    </Box>
                  </Box>
                )}
                {!is_integrated && isHovered && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
      
                    }}
                  >
                    <AddIcon sx={{ color: "#5052B2", fontSize: 45 }} />
                  </Box>
                )}
                <Image
                  src={image}
                  width={altImageIntegration.some(int => int == service_name) ? 100 : 32}
                  height={32}
                  alt={service_name}
                  style={{
                    transition: '0.2s',
                    filter: !is_integrated && isHovered ? 'blur(10px)' : 'none',
                  }}
                />
              </Box>
            </Tooltip>
            <Typography mt={0.5} fontSize={'14px'} fontWeight={500} textAlign={'center'} fontFamily={'Nunito Sans'}>
              {formatServiceName(service_name)}
            </Typography>
            <Popover
              open={openPopover}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
            >
              <Box
                sx={{
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                  maxWidth: "160px",
                }}
              >
                <Button
                  sx={{
                    justifyContent: "flex-start",
                    width: "100%",
                    textTransform: "none",
                    fontFamily: "Nunito Sans",
                    fontSize: "14px",
                    color: "rgba(32, 33, 36, 1)",
                    fontWeight: 600,
                    ":hover": {
                      color: "rgba(80, 82, 178, 1)",
                      backgroundColor: "rgba(80, 82, 178, 0.1)",
                    },
                  }}
                  onClick={handleClickEdit}
                >
                  Edit
                </Button>
                <Button
                  sx={{
                    justifyContent: "flex-start",
                    width: "100%",
                    textTransform: "none",
                    fontFamily: "Nunito Sans",
                    fontSize: "14px",
                    color: "rgba(32, 33, 36, 1)",
                    fontWeight: 600,
                    ":hover": {
                      color: "rgba(80, 82, 178, 1)",
                      backgroundColor: "rgba(80, 82, 178, 0.1)",
                    },
                  }}
                  onClick={handleClickDelete}
                >
                  Delete
                </Button>
              </Box>
            </Popover>
          </Box>
        );
      };

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
                    <TabContext value={value}>
                        <Box sx={{ pb: 4 }}>
                            <TabList centered aria-label="Connect to Klaviyo Tabs"
                                TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
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
                                <Tab label="Destination" value="1" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                <Tab label="Contacts" value="2" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                <Tab label="Map data" value="3" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                            </TabList>
                        </Box>
                        <TabPanel value="1" sx={{ p: 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                                <Box sx={{ p:0, width: '100%' }}>
                                    <Box sx={{ px: 2, py: 3, borderRadius: '4px' }}>
                                        <Typography variant="h6" className="first-sub-title">
                                            Choose where you want to sync
                                        </Typography>
                                        <List sx={{ display: 'flex', gap: '16px', py: 2, flexWrap: 'wrap', border: 'none' }}>
                                            {integrationsAvailable
                                                .filter(integration => {
                                                    if (search) {
                                                    return integration.service_name.toLowerCase().includes(search.toLowerCase());
                                                    }
                                                    return true;
                                                })
                                                .sort((a, b) => {
                                                    const isAIntegrated = integratedServices.includes(a.service_name);
                                                    const isBIntegrated = integratedServices.includes(b.service_name);

                                                    if (isAIntegrated === isBIntegrated) {
                                                    return a.service_name.localeCompare(b.service_name);
                                                    }
                                                    return isAIntegrated ? -1 : 1;
                                                })
                                                .map((integration) => {
                                                    const isIntegrated = integratedServices.includes(integration.service_name);
                                                    const integrationCred = integrationsCredentials.find(cred => cred.service_name === integration.service_name);

                                                    if (isIntegrated) {
                                                    return (
                                                        <Box key={integration.service_name} onClick={() => handleActive(integration.service_name)}>
                                                        <IntegrationBox
                                                            image={`/${integration.image}`}
                                                            service_name={integration.service_name}
                                                            active={activeService === integration.service_name}
                                                            handleClick={() => setOpenModal(integration.service_name)}
                                                            is_integrated={true}
                                                            handleDelete={handleDeleteOpen}
                                                            is_failed={integrationCred?.is_failed}
                                                        />
                                                        </Box>
                                                    );
                                                    }

                                                    return (
                                                    <Box key={integration.service_name} onClick={() => handleAddIntegration(integration.service_name)}>
                                                        <IntegrationBox
                                                        image={`/${integration.image}`}
                                                        service_name={integration.service_name}
                                                        is_avalible={true}
                                                        is_integrated={false}
                                                        />
                                                    </Box>
                                                    );
                                                })
                                            }
                                        </List>

                                    </Box>
                                    <Box
                                        sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        width: "100%",
                                        zIndex: 1302,
                                        backgroundColor: 'rgba(255, 255, 255, 1)',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        marginTop: '1em',
                                        padding: '1em',
                                        gap: 3,
                                        borderTop: '1px solid rgba(228, 228, 228, 1)',
                                        "@media (max-width: 600px)":
                                            { width: '100%' }
                                        }}
                                    >
                                        <Button
                                        variant="contained"
                                        onClick={onClose}
                                        className='second-sub-title'
                                        sx={{
                                            color: "rgba(80, 82, 178, 1) !important",
                                            backgroundColor: '#fff',
                                            border: ' 1px solid rgba(80, 82, 178, 1)',
                                            textTransform: "none",
                                            padding: "0.75em 2.5em",
                                            '&:hover': {
                                            backgroundColor: 'transparent'
                                            }
                                        }}
                                        >
                                        Cancel
                                        </Button>
                                        <Button
                                        variant="contained"
                                        onClick={onClose}
                                        className='second-sub-title'
                                        sx={{
                                            backgroundColor: "rgba(80, 82, 178, 1)",
                                            color: 'rgba(255, 255, 255, 1) !important',
                                            textTransform: "none",
                                            padding: "0.75em 2.5em",
                                            '&:hover': {
                                            backgroundColor: 'rgba(80, 82, 178, 1)'
                                            }
                                        }}
                                        >
                                        Next
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </TabPanel>
                        <TabPanel value="2" sx={{ p: 0 }}>
                            <Box sx={{display: "flex", justifyContent: "center"}}>
                                <Card
                                    sx={{
                                        display: "flex",
                                        padding: 2,
                                        boxShadow: 2,
                                        borderRadius: "4px",
                                    }}
                                    >
                                    <CardContent>
                                        <Typography className='first-sub-title' sx={{ marginBottom: 2 }}>
                                            Choose number of contacts that you want to sync
                                        </Typography>
                                        <Typography className='black-table-header' sx={{ marginBottom: 1 }}>
                                            Active segment
                                        </Typography>
                                        <Typography className='first-sub-title' sx={{ marginBottom: 3 }}>
                                            {maxContacts.toLocaleString()}
                                        </Typography>
                                        <Typography className='black-table-headers' sx={{ marginBottom: 1 }}>
                                            How many contacts do you want to sync?
                                        </Typography>
                                        <Typography className='table-data' sx={{ marginBottom: 2 }}>
                                            Enter the number of contacts you want to sync. The cost will be calculated automatically.
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            value={valueContactSync}
                                            onChange={handleInputChange}
                                            type="number"
                                            inputProps={{
                                                min: 0,
                                                max: maxContacts,
                                                step: 1,
                                            }}
                                            sx={{ marginBottom: 2 }}
                                        />
                                        <Box>
                                        <Slider
                                            value={valueContactSync}
                                            onChange={handleSliderChange}
                                            min={0}
                                            max={maxContacts}
                                            aria-label="Contacts Sync Slider"
                                            valueLabelDisplay="auto"
                                            sx={{ color: "rgba(80, 82, 178, 1)", "&.MuiSlider-thumb": {width: "14px", height: "14px", transform: "translate(0, -50%)"},  "&.MuiSlider-rail": { backgroundColor: "rgba(231, 231, 231, 1)" }}}
                                        />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        </TabPanel>
                    </TabContext>
            </Drawer>

            {/* Data Sync */}
            <ConnectKlaviyo data={null} open={klaviyoIconPopupOpen} onClose={handleKlaviyoIconPopupClose} />
            <ConnectSalesForce data={null} open={salesForceIconPopupOpen} onClose={handleSalesForceIconPopupClose} />
            <ConnectMeta data={null} open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} isEdit={false} />
            <OnmisendDataSync open={omnisendIconPopupOpen} onClose={handleOmnisendIconPopupOpenClose} isEdit={false} data={null} />
            <HubspotDataSync open={hubspotIconPopupOpen} onClose={handleHubspotIconPopupOpenClose} isEdit={false} data={null} />
            <SendlaneDatasync open={openSendlaneIconPopupOpen} onClose={handleSendlaneIconPopupClose} data={null} isEdit={false} />
            <WebhookDatasync open={openWebhookIconPopupOpen} onClose={handleWebhookIconPopupClose} data={null} isEdit={false} />
            <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupIconClose} data={null} />
            <SlackDatasync open={slackIconPopupOpen} onClose={handleSlackIconPopupIconClose} data={null} isEdit={false} />
            <GoogleADSDatasync open={googleAdsIconPopupOpen} onClose={handleGoogleAdsIconPopupIconClose} data={null} isEdit={false} />
            <ZapierDataSync open={openZapierDataSync} handleClose={handleCloseZapierDataSync} />

            {/* Add Integration */}
            <AlivbleIntagrationsSlider open={plusIconPopupOpen} onClose={handlePlusIconPopupClose} isContactSync={true} integrations={integrations} integrationsCredentials={integrationsCredentials} handleSaveSettings={handleSaveSettings} />
            <SlackIntegrationPopup open={createSlack} handleClose={handleCreateSlackClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'slack')?.access_token} />
            <GoogleADSConnectPopup open={createGoogleAds} handlePopupClose={handleCreateGoogleAdsClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'google_ads')?.access_token} />
            <WebhookConnectPopup open={createWebhook} handleClose={handleCreateWebhookClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'webhook')?.access_token} />
            <KlaviyoIntegrationPopup open={createKlaviyo} handleClose={handleCreateKlaviyoClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'klaviyo')?.access_token} />
            <SalesForceIntegrationPopup open={createSalesForce} handleClose={handleCreateSalesForceClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sales_force')?.access_token} />
            <MailchimpConnect onSave={handleSaveSettings} open={openMailchimpConnect} handleClose={handleOpenMailchimpConnectClose} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Mailchimp')?.access_token} />
            <SendlaneConnect open={openSendlaneConnect} handleClose={handleSendlaneConnectClose} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Sendlane')?.access_token} />
            <OmnisendConnect open={openOmnisendConnect} handleClose={() => setOpenOmnisendConnect(false)} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Omnisend')?.access_token} />
            <HubspotIntegrationPopup open={createHubspot} handleClose={() => setOpenHubspotConnect(false)} onSave={handleSaveSettings} initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'hubspot')?.access_token} />
            <MetaConnectButton open={metaConnectApp} onClose={handleCloseMetaConnectApp} onSave={handleSaveSettings} />
        </>
    );
};

export default CreateSyncPopup;