import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Box, Typography, IconButton, List, LinearProgress, Grid, ListItem, ListItemIcon, ListItemButton, 
        Button, ListItemText, Popover, Tooltip, Tab, Slider, TextField, Card, CardContent, ClickAwayListener, 
        InputAdornment, MenuItem, Menu, Divider, 
        Link} from '@mui/material';
import TabList from "@mui/lab/TabList";
import TabPanel from '@mui/lab/TabPanel';
import TabContext from "@mui/lab/TabContext";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import Image from 'next/image';
import ConnectSalesForce from '@/app/(client)/data-sync/components/ConnectSalesForce';
import ConnectMeta from '@/app/(client)/data-sync/components/ConnectMeta';
import SalesForceIntegrationPopup from '@/components/SalesForceIntegrationPopup';
import GoogleADSConnectPopup from '@/components/GoogleADSConnectPopup';
import MetaConnectButton from '@/components/MetaConnectButton';
import AlivbleIntagrationsSlider from '@/components/AvalibleIntegrationsSlider';
import MailchimpConnect from '@/components/MailchimpConnect';
import HubspotIntegrationPopup from '@/components/HubspotIntegrationPopup';
import MailchimpDatasync from '../../data-sync/components/MailchimpDatasync';
import GoogleADSDatasync from '../../data-sync/components/GoogleADSDataSync';
import HubspotDataSync from '../../data-sync/components/HubspotDataSync';
import { UpgradePlanPopup } from '@/app/(client)/components/UpgradePlanPopup';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import { useIntegrationContext } from "@/context/IntegrationContext";

interface AudiencePopupProps {
    open: boolean;
    onClose: () => void;
    integrationsList?: string[];
    id?: string
    activeSegmentRecords?: number
}

interface ListItem {
    audience_id: number;
    audience_name: string;
    leads_count: number;
}

type KlaviyoList = {
    id: string
    list_name: string
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

interface Row {
    id: number;
    type: string;
    value: string;
    selectValue?: string;
    canDelete?: boolean;
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

interface MetaAuidece {
    id: string
    list_name: string
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

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: '#c6dafc',
    '& .MuiLinearProgress-bar': {
      borderRadius: 5,
      backgroundColor: '#4285f4',
    },
  }));

const CreateSyncPopup: React.FC<AudiencePopupProps> = ({ open, onClose, integrationsList: integ = [], id, activeSegmentRecords }) => {
    const { triggerSync } = useIntegrationContext();
    const integrationsList = ["CSV", "s3", ...integ]
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isExistingListsOpen, setIsExistingListsOpen] = useState<boolean>(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [listName, setListName] = useState<string>('');
    const [plusIconPopupOpen, setPlusIconPopupOpen] = useState(false);
    const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [isExportDisabled, setIsExportDisabled] = useState(true);
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationsCredentials[]>([])
    const [createHubspot, setCreateHubspot] = useState<boolean>(false)
    const [createSalesForce, setCreateSalesForce] = useState<boolean>(false)
    const [createGoogleAds, setCreateGoogleAds] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)

    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [googleAdsIconPopupOpen, setOpenGoogleAdsIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [openHubspotConnect, setOpenHubspotConnect] = useState(false)
    const [hubspotIconPopupOpen, setOpenHubspotIconPopupOpen] = useState(false)
    const [contactSyncTab, setContactSyncTab] = useState(false)

    const [search, setSearch] = useState<string>('');
    const [activeService, setActiveService] = useState<string | null>(null);
    const [openDeletePopup, setOpenDeletePopup] = useState(false);
    const [openModal, setOpenModal] = useState<string | null>(null);
    const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [value, setValue] = useState('1');
    const [isDropdownValid, setIsDropdownValid] = useState(false);
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

    const [selectedOptionMap, setSelectedOptionMap] = useState<MetaAuidece | null>(null);
    const [customFields, setCustomFields] = useState<{ type: string, value: string }[]>([]);

    const handleChangeField = (index: number, field: string, value: string) => {

        setCustomFields(customFields.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const handleAddField = () => {
        setCustomFields([...customFields, { type: '', value: '' }]);
    };

    const handleDeleteField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const customFieldsList: Row[] = [
        { id: 7, type: 'Gender', value: 'gender' },
        { id: 8, type: 'Company Name', value: 'company_name' },
        { id: 9, type: 'Company Domain', value: 'company_domain' },
        { id: 10, type: 'Company SIC', value: 'company_sic' },
        { id: 11, type: 'Company LinkedIn URL', value: 'company_linkedin_url' },
        { id: 12, type: 'Company Revenue', value: 'company_revenue' },
        { id: 13, type: 'Company Employee Count', value: 'company_employee_count' },
        { id: 14, type: 'Net Worth', value: 'net_worth' },
        { id: 15, type: 'Last Updated', value: 'last_updated' },
        { id: 16, type: 'Personal Emails Last Seen', value: 'personal_emails_last_seen' },
        { id: 17, type: 'Company Last Updated', value: 'company_last_updated' },
        { id: 18, type: 'Job Title Last Updated', value: 'job_title_last_updated' },
        { id: 19, type: 'Age Min', value: 'age_min' },
        { id: 20, type: 'Age Max', value: 'age_max' },
        { id: 21, type: 'Additional Personal Emails', value: 'additional_personal_emails' },
        { id: 22, type: 'LinkedIn URL', value: 'linkedin_url' },
        { id: 23, type: 'Married', value: 'married' },
        { id: 24, type: 'Children', value: 'children' },
        { id: 25, type: 'Income Range', value: 'income_range' },
        { id: 26, type: 'Homeowner', value: 'homeowner' },
        { id: 27, type: 'Seniority Level', value: 'seniority_level' },
        { id: 28, type: 'Department', value: 'department' },
        { id: 29, type: 'Primary Industry', value: 'primary_industry' },
        { id: 30, type: 'Work History', value: 'work_history' },
        { id: 31, type: 'Education History', value: 'education_history' },
        { id: 32, type: 'Company Description', value: 'company_description' },
        { id: 33, type: 'Related Domains', value: 'related_domains' },
        { id: 34, type: 'Social Connections', value: 'social_connections' },
        { id: 35, type: 'URL Visited', value: 'url_visited' },
        { id: 36, type: 'Time on site', value: 'time_on_site' },
        { id: 37, type: 'DPV Code', value: 'dpv_code' }
    ]

    const defaultRows: Row[] = [
        { id: 1, type: 'Email', value: 'Email' },
        { id: 2, type: 'Phone number', value: 'Phone number' },
        { id: 3, type: 'First name', value: 'First name' },
        { id: 4, type: 'Second name', value: 'Second name' },
        { id: 5, type: 'Job Title', value: 'Job Title' },
        { id: 6, type: 'Location', value: 'Location' }
    ];

    const handleDeleteOpen = () => {
        setOpenDeletePopup(true);
      };

    // useEffect(() => {
    //     const fetchData = async () => {
    //         const response = await axiosInstance.get('/integrations/smart-audience-sync/', {
    //             params: {
    //                 integration_list: integ.join(","),
    //             },
    //         });
    //         if (response.status === 200) {
    //             console.log("1", response.data)
    //             setIntegrations(response.data);
    //         }
    //     };
    //     if (open) {
    //         fetchData();
    //     }
    // }, [open]);
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await axiosInstance.get('/integrations/credentials/')
                if (response.status === 200) {
                    setIntegrationsCredentials(response.data)
                }
            } catch {
            }
            finally {
                setIsLoading(false)
            }
        }
        if (open) {
            fetchData()
        }
    }, [open])

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

    const handleHubspotIconPopupOpen = () => {
        setOpenHubspotIconPopupOpen(true);
    };

    const handleSalesForceIconPopupClose = () => {
        setSalesForceIconPopupOpen(false);
        setPlusIconPopupOpen(false)
    };

    const handleOpenMailchimpConnect = () => {
        setOpenmailchimpConnect(true)
    }

    const handleGoogleAdsIconPopupIconOpen = () => {
        setOpenGoogleAdsIconPopup(true)
    }

    const handleMailchimpIconPopupIconOpen = () => {
        setOpenMailchimpIconPopup(true)
    }

    const handleGoogleAdsConnectOpen = () => {
        setOpenGoogleAdsIconPopup(true)
    }

    const handleMailchimpIconPopupIconClose = () => {
        setOpenMailchimpIconPopup(false)
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
            case 'Mailchimp':
                handleMailchimpIconPopupIconOpen()
                break
            case 'GoogleAds':
                handleGoogleAdsIconPopupIconOpen()
            case 'Hubspot':
                handleHubspotIconPopupOpen()
                break
        }
    };

    const handleCreateHubspotOpen = () => {
        setCreateHubspot(true)
    }
    
    const handleCreateSalesForceOpen = () => {
        setCreateSalesForce(true)
    }

    const handleCreateSalesForceClose = () => {
        setCreateSalesForce(false)
    }

    const handleCreateHubspotClose = () => {
        setCreateHubspot(false)
    }

    const handleCreateGoogleAdsClose = () => {
        setCreateGoogleAds(false)
    }

    type ServiceHandlers = {
        hubspot: () => void;
        mailchimp: () => void;
        salesForce: () => void;
        googleAds: () => void;
      };

    const handlers: ServiceHandlers = {
        hubspot: handleCreateHubspotOpen,
        mailchimp: handleOpenMailchimpConnect,
        salesForce: handleCreateSalesForceOpen,
        googleAds: handleCreateGoogleAdsClose,
      };

    const toCamelCase = (name: string) => {
        const updatedName = name.split('_').map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
        return updatedName
    }

    const handleActive = (service: string) => {
        const handlerPart = toCamelCase(service)
        setActiveService(handlerPart);
        handleNextTab()
        if (handlerPart === "mailchimp") {
            setContactSyncTab(true)
            getList()
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }
    };


    const handleAddIntegration = async (service_name: string) => {
        try {
          setIsLoading(true)
          const response = await axiosInstance.get('/integrations/check-limit-reached')
          if (response.status === 200 && response.data) {
            setUpgradePlanPopup(true)
            return 
          }
        } catch {
        }
        finally {
          setIsLoading(false)
        }
    
        const isIntegrated = integrationsCredentials.some(integration_cred => integration_cred.service_name === service_name);
        if (isIntegrated) return;
        
        const handlerPart = toCamelCase(service_name)
        if (service_name === "meta") {
            setMetaConnectApp(true)
        } else if (handlerPart in handlers) {
            handlers[handlerPart as keyof ServiceHandlers]();
          }
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
    
    const sendDataSync = () => {
        return value === '4' || !contactSyncTab
    };

    const createNewList = async () => {
        try {

            const newListResponse = await axiosInstance.post('/integrations/sync/list/', {
                name: selectedOptionMailchimp?.list_name
            }, {
                params: {
                    service_name: 'mailchimp'
                }
            });
            if (newListResponse.data.status === 'CREATED_IS_FAILED') {
                showErrorToast("You've hit your audience limit. You already have the max amount of audiences allowed in your plan.")
                throw new Error("You've hit your audience limit. You already have the max amount of audiences allowed in your plan.")
            }
            else if (newListResponse.data.status === 'CREDENTIALS_INVALID') {
                showErrorToast("Credentials invalid, try updating the key.")
                throw new Error("Credentials invalid, try updating the key.")
            }

            return newListResponse.data;
        } catch (error) { }

    };

    const createDataSync = async () => {
        setIsLoading(true);
        let list: KlaviyoList | null = null;
        try {
            if (selectedOptionMailchimp && selectedOptionMailchimp.id === '-1') {
                list = await createNewList();
            } else if (selectedOptionMailchimp) {
                list = selectedOptionMailchimp;
            } else {
                showToast('Please select a valid option.');
                return;
            }

            if (list) {
                const response = await axiosInstance.post('/data-sync/create-smart-audience-sync', {
                    list_id: list?.id,
                    list_name: list?.list_name,
                    sent_contacts: valueContactSync,
                    smart_audience_id: id,
                    data_map: customFields
                }, {
                    params: {
                        service_name: 'mailchimp'
                    }
                });
                if (response.status === 201 || response.status === 200) {
                    onClose();
                    showToast('Data sync created successfully');
                    triggerSync();
                }
            }
        } catch {
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectOption = (value: KlaviyoList | string) => {
        if (value === 'createNew') {
            setShowCreateForm(prev => !prev);
            if (!showCreateForm) {
                setAnchorElMailchimp(textFieldRef.current);
            }
        } else if (isKlaviyoList(value)) {
            // Проверка, является ли value объектом KlaviyoList
            setSelectedOptionMailchimp({
                id: value.id,
                list_name: value.list_name
            });
            setIsDropdownValid(true);
            handleCloseSelectMailchimp();
        } else {
            setIsDropdownValid(false);
            setSelectedOptionMailchimp(null);
        }
    };


    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [newListName, setNewListName] = useState<string>('');
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [listNameError, setListNameError] = useState(false);
    const [isShrunk, setIsShrunk] = useState<boolean>(false);
    const [anchorElMailchimp, setAnchorElMailchimp] = useState<null | HTMLElement>(null);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const [klaviyoList, setKlaviyoList] = useState<KlaviyoList[]>([])
    const [selectedOptionMailchimp, setSelectedOptionMailchimp] = useState<KlaviyoList | null>(null);

    const handleClickMailchimp = (event: React.MouseEvent<HTMLInputElement>) => {
        setIsShrunk(true);
        setIsDropdownOpen(prev => !prev);
        setAnchorElMailchimp(event.currentTarget);
        setShowCreateForm(false); // Reset form when menu opens
    };

    const handleCloseSelectMailchimp = () => {
        setAnchorElMailchimp(null);
        setShowCreateForm(false);
        setIsDropdownOpen(false);
        setNewListName(''); // Clear new list name when closing
    };

    const isKlaviyoList = (value: any): value is KlaviyoList => {
        return value !== null &&
            typeof value === 'object' &&
            'id' in value &&
            'list_name' in value;
    };

    const handleDropdownToggle = (event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent triggering the input field click
        setIsDropdownOpen(prev => !prev);
        setAnchorElMailchimp(textFieldRef.current);
    };

    const handleSave = async () => {
        let valid = true;

        // Validate List Name
        if (newListName.trim() === '') {
            setListNameError(true);
            valid = false;
        } else {
            setListNameError(false);
        }

        // If valid, save and close
        if (valid) {
            const newKlaviyoList = { id: '-1', list_name: newListName }
            setSelectedOptionMailchimp(newKlaviyoList);
            if (isKlaviyoList(newKlaviyoList)) {
                setIsDropdownValid(true);
            }
            handleCloseSelectMailchimp();
        }
    };

    const getList = async () => {
        try {
            setIsLoading(true)
            const response = await axiosInstance.get('/integrations/sync/list/', {
                params: {
                    service_name: 'mailchimp'
                }
            })
            setKlaviyoList(response.data)
        } catch {
        } finally {
            setIsLoading(false)
        }

    }

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
        } else if (value === '3' || value === '4') {
            if (sendDataSync()) {
                createDataSync()
            }
            else {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
    };

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };


    const integrationsAvailable = [
        { image: 'csv-icon.svg', service_name: 'CSV' },
        { image: 'meta-icon.svg', service_name: 'meta' },
        { image: 'mailchimp-icon.svg', service_name: 'mailchimp' },
        { image: 'hubspot.svg', service_name: 'hubspot' },
        { image: 'google-ads.svg', service_name: 'google_ads' },
        { image: 'salesforce-icon.svg', service_name: 'sales_force' },
        { image: 's3.svg', service_name: 's3' }
      ];

      const [valueContactSync, setValueContactSync] = useState<number>();
      const maxContacts = activeSegmentRecords ?? 0;
    
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
              <Box 
                sx={{
                    backgroundColor: !is_integrated ? 'rgba(0, 0, 0, 0.04)' : active
                    ? 'rgba(80, 82, 178, 0.1)'
                    : 'transparent',
                    border: active ? '1px solid #5052B2' : '1px solid #E4E4E4',
                    position: 'relative',
                    display: 'flex',
                    borderRadius: '4px',
                    cursor: is_integrated ? 'default' : 'pointer',
                    // width: '8rem',
                    width: '100%',
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

    const [rows, setRows] = useState(defaultRows);

    const handleMapListChange = (id: number, field: 'value' | 'type', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleClickOpen = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setDeleteAnchorEl(event.currentTarget);
        setSelectedRowId(id);
    };

    const handleDeleteClose = () => {
        setDeleteAnchorEl(null);
        setSelectedRowId(null);
    };

    const handleDelete = () => {
        if (selectedRowId !== null) {
            setRows(rows.filter(row => row.id !== selectedRowId));
            handleDeleteClose();
        }
    };

    const deleteOpen = Boolean(deleteAnchorEl);
    const deleteId = deleteOpen ? 'delete-popover' : undefined;

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
                {isLoading && (
                    <Box
                        sx={{
                        width: '100%',
                        position: 'fixed',
                        top: '4.2rem',
                        zIndex: 1200,   
                        }}
                    >
                        <BorderLinearProgress variant="indeterminate" />
                    </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: '9', backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                        Create smart audience sync
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        <Link href="#" className="main-text" sx={{
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
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ width: '100%', position: 'relative' }}>
                        <TabContext value={value}>
                            <Box sx={{ pb: 2}}>
                                <TabList centered
                                    TabIndicatorProps={{ sx: { backgroundColor: "#5052b2"} }}
                                    sx={{
                                        gap: 3,
                                        "& .MuiTabs-scroller": {
                                            overflowX: 'auto !important',
                                        },
                                        "& .MuiTabs-flexContainer": {
                                            justifyContent: 'center',
                                            '@media (max-width: 600px)': {
                                                gap: 2,
                                            }
                                        }
                                    }} onChange={handleChangeTab}>
                                    <Tab label="Destination" value="1" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                    <Tab label="Contacts" value="2" className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                    {contactSyncTab && <Tab label="Contacts Sync" value="3" className='tab-heading' sx={klaviyoStyles.tabHeading} />}
                                    <Tab label="Map data" value={contactSyncTab ? "4" : "3"} className='tab-heading' sx={klaviyoStyles.tabHeading} />
                                </TabList>
                            </Box>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                                    <Box sx={{ p:0, width: '100%' }}>
                                        <Box sx={{ px: 2, py: 3, display: "flex", flexDirection: "column", gap: 3, borderRadius: '4px' }}>
                                            <Typography variant="h6" className="first-sub-title">
                                                Choose where you want to sync
                                            </Typography>
                                            <List sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap', border: 'none' }}>
                                                {integrationsAvailable
                                                    .filter((integration) => 
                                                        integrationsList?.includes(integration.service_name) && 
                                                        (!search || integration.service_name.toLowerCase().includes(search.toLowerCase()))
                                                    )
                                                    .map((integration) => {
                                                        let isIntegrated = integratedServices.includes(integration.service_name);
                                                        if (integration.service_name === 'CSV') {  
                                                            isIntegrated = true
                                                        }
                                                        const integrationCred = integrationsCredentials.find(cred => cred.service_name === integration.service_name);

                                                        if (isIntegrated) {
                                                        return (
                                                            <Box key={integration.service_name} onClick={() => handleActive(integration.service_name)} sx={{width: "135px"}}>
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
                                                        <Box key={integration.service_name} onClick={() => handleAddIntegration(integration.service_name)} sx={{width: "135px"}}>
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
                            {contactSyncTab && 
                                <TabPanel value="3" sx={{ p: 0 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                                                <Image src='/mailchimp-icon.svg' alt='mailchimp' height={26} width={32} />
                                                <Typography variant="h6" className='first-sub-title'>Contact sync</Typography>
                                                <Tooltip title="Sync data with list" placement="right">
                                                    <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                                </Tooltip>
                                            </Box>


                                            <ClickAwayListener onClickAway={handleCloseSelectMailchimp}>
                                                <Box>
                                                    <TextField
                                                        ref={textFieldRef}
                                                        variant="outlined"
                                                        value={selectedOptionMailchimp?.list_name}
                                                        onClick={handleClickMailchimp}
                                                        size="small"
                                                        fullWidth
                                                        label={selectedOptionMailchimp ? '' : 'Select or Create new list'}
                                                        InputLabelProps={{
                                                            shrink: selectedOptionMailchimp ? false : isShrunk,
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                letterSpacing: '0.06px',
                                                                top: '5px',
                                                                '&.Mui-focused': {
                                                                    color: '#0000FF',
                                                                },
                                                            }
                                                        }}
                                                        InputProps={{

                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton onClick={handleDropdownToggle} edge="end">
                                                                        {isDropdownOpen ? <Image src='/chevron-drop-up.svg' alt='chevron-drop-up' height={24} width={24} /> : <Image src='/chevron-drop-down.svg' alt='chevron-drop-down' height={24} width={24} />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                            sx: klaviyoStyles.formInput
                                                        }}
                                                        sx={{
                                                            '& input': {
                                                                caretColor: 'transparent', // Hide caret with transparent color
                                                                fontFamily: "Nunito Sans",
                                                                fontSize: "14px",
                                                                color: "rgba(0, 0, 0, 0.89)",
                                                                fontWeight: "600",
                                                                lineHeight: "normal",
                                                            },
                                                            '& .MuiOutlinedInput-input': {
                                                                cursor: 'default', // Prevent showing caret on input field
                                                                top: '5px'
                                                            },

                                                        }}
                                                    />

                                                    <Menu
                                                        anchorEl={anchorElMailchimp}
                                                        open={Boolean(anchorElMailchimp) && isDropdownOpen}
                                                        onClose={handleCloseSelectMailchimp}
                                                        PaperProps={{
                                                            sx: {
                                                                width: anchorElMailchimp ? `${anchorElMailchimp.clientWidth}px` : '538px', borderRadius: '4px',
                                                                border: '1px solid #e4e4e4'
                                                            }, // Match dropdown width to input
                                                        }}
                                                        sx={{

                                                        }}
                                                    >
                                                        {/* Show "Create New List" option */}
                                                        <MenuItem onClick={() => handleSelectOption('createNew')} sx={{
                                                            borderBottom: showCreateForm ? "none" : "1px solid #cdcdcd",
                                                            '&:hover': {
                                                                background: 'rgba(80, 82, 178, 0.10)'
                                                            }
                                                        }}>
                                                            <ListItemText primary={`+ Create new list`} primaryTypographyProps={{
                                                                sx: {
                                                                    fontFamily: "Nunito Sans",
                                                                    fontSize: "14px",
                                                                    color: showCreateForm ? "#5052B2" : "#202124",
                                                                    fontWeight: "500",
                                                                    lineHeight: "20px",

                                                                }
                                                            }} />
                                                        </MenuItem>

                                                        {/* Show Create New List form if 'showCreateForm' is true */}
                                                        {showCreateForm && (
                                                            <Box>
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '24px',
                                                                    p: 2,
                                                                    width: anchorElMailchimp ? `${anchorElMailchimp.clientWidth}px` : '538px',
                                                                    pt: 0
                                                                }}>
                                                                    <Box
                                                                        sx={{


                                                                            mt: 1, // Margin-top to separate form from menu item
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            gap: '16px',
                                                                            '@media (max-width: 600px)': {
                                                                                flexDirection: 'column'
                                                                            },
                                                                        }}
                                                                    >
                                                                        <TextField
                                                                            label="List Name"
                                                                            variant="outlined"
                                                                            value={newListName}
                                                                            onChange={(e) => setNewListName(e.target.value)}
                                                                            size="small"
                                                                            fullWidth
                                                                            onKeyDown={(e) => e.stopPropagation()}
                                                                            error={listNameError}
                                                                            helperText={listNameError ? 'List Name is required' : ''}
                                                                            InputLabelProps={{
                                                                                sx: {
                                                                                    fontFamily: 'Nunito Sans',
                                                                                    fontSize: '12px',
                                                                                    lineHeight: '16px',
                                                                                    fontWeight: '400',
                                                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                                                    '&.Mui-focused': {
                                                                                        color: '#0000FF',
                                                                                    },
                                                                                }
                                                                            }}
                                                                            InputProps={{

                                                                                endAdornment: (
                                                                                    newListName && ( // Conditionally render close icon if input is not empty
                                                                                        <InputAdornment position="end">
                                                                                            <IconButton
                                                                                                edge="end"
                                                                                                onClick={() => setNewListName('')} // Clear the text field when clicked
                                                                                            >
                                                                                                <Image
                                                                                                    src='/close-circle.svg'
                                                                                                    alt='close-circle'
                                                                                                    height={18}
                                                                                                    width={18} // Adjust the size as needed
                                                                                                />
                                                                                            </IconButton>
                                                                                        </InputAdornment>
                                                                                    )
                                                                                ),
                                                                                sx: {
                                                                                    '&.MuiOutlinedInput-root': {
                                                                                        height: '32px',
                                                                                        '& .MuiOutlinedInput-input': {
                                                                                            padding: '5px 16px 4px 16px',
                                                                                            fontFamily: 'Roboto',
                                                                                            color: '#202124',
                                                                                            fontSize: '14px',
                                                                                            fontWeight: '400',
                                                                                            lineHeight: '20px'
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
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                    <Box sx={{ textAlign: 'right' }}>
                                                                        <Button variant="contained" onClick={handleSave}
                                                                            disabled={listNameError || !newListName}
                                                                            sx={{
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #5052B2',
                                                                                background: '#fff',
                                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                                fontFamily: 'Nunito Sans',
                                                                                fontSize: '14px',
                                                                                fontWeight: '600',
                                                                                lineHeight: '20px',
                                                                                color: '#5052b2',
                                                                                textTransform: 'none',
                                                                                padding: '4px 22px',
                                                                                '&:hover': {
                                                                                    background: 'transparent'
                                                                                },
                                                                                '&.Mui-disabled': {
                                                                                    background: 'transparent',
                                                                                    color: '#5052b2'
                                                                                }
                                                                            }}>
                                                                            Save
                                                                        </Button>
                                                                    </Box>

                                                                </Box>


                                                                {/* Add a Divider to separate form from options */}
                                                                <Divider sx={{ borderColor: '#cdcdcd' }} />
                                                            </Box>
                                                        )}

                                                        {/* Show static options */}
                                                        {klaviyoList && klaviyoList.map((klaviyo, option) => (
                                                            <MenuItem key={klaviyo.id} onClick={() => handleSelectOption(klaviyo)} sx={{
                                                                '&:hover': {
                                                                    background: 'rgba(80, 82, 178, 0.10)'
                                                                }
                                                            }}>
                                                                <ListItemText primary={klaviyo.list_name} primaryTypographyProps={{
                                                                    sx: {
                                                                        fontFamily: "Nunito Sans",
                                                                        fontSize: "14px",
                                                                        color: "#202124",
                                                                        fontWeight: "500",
                                                                        lineHeight: "20px"
                                                                    }
                                                                }} />
                                                            </MenuItem>
                                                        ))}
                                                    </Menu>
                                                </Box>
                                            </ClickAwayListener>

                                        </Box>
                                    </Box>
                                </TabPanel>
                            }
                            <TabPanel value={contactSyncTab ? "4" : "3"} sx={{ p: 0 }}>
                                <Box sx={{
                                        borderRadius: '4px',
                                        padding: '16px 24px',
                                        overflowX: 'auto'
                                    }}>
                                        <Box sx={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                            <Typography variant="h6" className='first-sub-title'>Map list</Typography>
                                            {selectedOptionMap?.list_name && <Typography variant='h6' sx={{
                                                background: '#EDEDF7',
                                                borderRadius: '3px',
                                                fontFamily: 'Roboto',
                                                fontSize: '12px',
                                                fontWeight: '400',
                                                color: '#5f6368',
                                                padding: '2px 4px',
                                                lineHeight: '16px'
                                            }}>
                                                {selectedOptionMap?.list_name}
                                            </Typography>}
                                        </Box>

                                        <Grid container alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, marginBottom: '14px' }}>
                                            <Grid item xs="auto" sm={5} sx={{
                                                textAlign: 'center',
                                                '@media (max-width:599px)': {
                                                    minWidth: '196px'
                                                }
                                            }}>
                                                <Image src='/logo.svg' alt='logo' height={22} width={34} />
                                            </Grid>
                                            <Grid item xs="auto" sm={1} sx={{
                                                '@media (max-width:599px)': {
                                                    minWidth: '50px'
                                                }
                                            }}>&nbsp;</Grid>
                                            <Grid item xs="auto" sm={5} sx={{
                                                textAlign: 'center',
                                                '@media (max-width:599px)': {
                                                    minWidth: '196px'
                                                }
                                            }}>
                                                <Image src='/meta-icon.svg' alt='meta-icon' height={20} width={30} />
                                            </Grid>
                                            <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                                        </Grid>

                                        {defaultRows.map((row, index) => (
                                            <Box key={row.id} sx={{ mb: 2 }}> {/* Add margin between rows */}
                                                <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                                    {/* Left Input Field */}
                                                    <Grid item xs="auto" sm={5}>
                                                        <TextField
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={true}
                                                            value={row.value}
                                                            onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                                            InputLabelProps={{
                                                                sx: {
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                                    top: '-5px',
                                                                    '&.Mui-focused': {
                                                                        color: '#0000FF',
                                                                        top: 0
                                                                    },
                                                                    '&.MuiInputLabel-shrink': {
                                                                        top: 0
                                                                    }
                                                                }
                                                            }}
                                                            InputProps={{

                                                                sx: {
                                                                    '&.MuiOutlinedInput-root': {
                                                                        height: '36px',
                                                                        '& .MuiOutlinedInput-input': {
                                                                            padding: '6.5px 8px',
                                                                            fontFamily: 'Roboto',
                                                                            color: '#202124',
                                                                            fontSize: '12px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '20px'
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
                                                                }
                                                            }}
                                                        />
                                                    </Grid>
                                                    {/* Middle Icon Toggle (Right Arrow or Close Icon) */}
                                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                                        {row.selectValue !== undefined ? (
                                                            row.selectValue ? (
                                                                <Image
                                                                    src='/chevron-right-purple.svg'
                                                                    alt='chevron-right-purple'
                                                                    height={18}
                                                                    width={18} // Adjust the size as needed
                                                                />

                                                            ) : (
                                                                <Image
                                                                    src='/close-circle.svg'
                                                                    alt='close-circle'
                                                                    height={18}
                                                                    width={18} // Adjust the size as needed
                                                                />
                                                            )
                                                        ) : (
                                                            <Image
                                                                src='/chevron-right-purple.svg'
                                                                alt='chevron-right-purple'
                                                                height={18}
                                                                width={18} // Adjust the size as needed
                                                            /> // For the first two rows, always show the right arrow
                                                        )}
                                                    </Grid>

                                                    {/* Right Side Input or Dropdown */}
                                                    <Grid item xs="auto" sm={5}>
                                                        <TextField
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={true}
                                                            value={row.type}
                                                            onChange={(e) => handleMapListChange(row.id, 'type', e.target.value)}
                                                            InputLabelProps={{
                                                                sx: {
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                                    top: '-5px',
                                                                    '&.Mui-focused': {
                                                                        color: '#0000FF',
                                                                        top: 0
                                                                    },
                                                                    '&.MuiInputLabel-shrink': {
                                                                        top: 0
                                                                    }
                                                                }
                                                            }}
                                                            InputProps={{

                                                                sx: {
                                                                    '&.MuiOutlinedInput-root': {
                                                                        height: '36px',
                                                                        '& .MuiOutlinedInput-input': {
                                                                            padding: '6.5px 8px',
                                                                            fontFamily: 'Roboto',
                                                                            color: '#202124',
                                                                            fontSize: '12px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '20px'
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
                                                                }
                                                            }}
                                                        />
                                                    </Grid>

                                                    {/* Delete Icon */}
                                                    <Grid item xs="auto" sm={1} container justifyContent="center">
                                                        {row.canDelete && (
                                                            <>
                                                                <IconButton onClick={(event) => handleClickOpen(event, row.id)}>
                                                                    <Image
                                                                        src='/trash-icon-filled.svg'
                                                                        alt='trash-icon-filled'
                                                                        height={18}
                                                                        width={18} // Adjust the size as needed
                                                                    />
                                                                </IconButton>
                                                                <Popover
                                                                    id={deleteId}
                                                                    open={deleteOpen}
                                                                    anchorEl={deleteAnchorEl}
                                                                    onClose={handleDeleteClose}
                                                                    anchorOrigin={{
                                                                        vertical: 'bottom',
                                                                        horizontal: 'center',
                                                                    }}
                                                                    transformOrigin={{
                                                                        vertical: 'top',
                                                                        horizontal: 'right',
                                                                    }}
                                                                >
                                                                    <Box sx={{
                                                                        minWidth: '254px',
                                                                        borderRadius: '4px',
                                                                        border: '0.2px solid #afafaf',
                                                                        background: '#fff',
                                                                        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.12)',
                                                                        padding: '16px 21px 16px 16px'
                                                                    }}>
                                                                        <Typography variant="body1" className='first-sub-title' sx={{
                                                                            paddingBottom: '12px'
                                                                        }}>Confirm Deletion</Typography>
                                                                        <Typography variant="body2" sx={{
                                                                            color: '#5f6368',
                                                                            fontFamily: 'Roboto',
                                                                            fontSize: '12px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '16px',
                                                                            paddingBottom: '26px'
                                                                        }}>
                                                                            Are you sure you want to delete this <br /> map data?
                                                                        </Typography>
                                                                        <Box display="flex" justifyContent="flex-end" mt={2}>
                                                                            <Button onClick={handleDeleteClose} sx={{
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #5052b2',
                                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                                color: '#5052b2',
                                                                                fontFamily: 'Nunito Sans',
                                                                                fontSize: '14px',
                                                                                fontWeight: '600',
                                                                                lineHeight: '20px',
                                                                                marginRight: '16px',
                                                                                textTransform: 'none'
                                                                            }}>
                                                                                Clear
                                                                            </Button>
                                                                            <Button onClick={handleDelete} sx={{
                                                                                background: '#5052B2',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #5052b2',
                                                                                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                                color: '#fff',
                                                                                fontFamily: 'Nunito Sans',
                                                                                fontSize: '14px',
                                                                                fontWeight: '600',
                                                                                lineHeight: '20px',
                                                                                textTransform: 'none',
                                                                                '&:hover': {
                                                                                    color: '#5052B2'
                                                                                }
                                                                            }}>
                                                                                Delete
                                                                            </Button>
                                                                        </Box>
                                                                    </Box>
                                                                </Popover>
                                                            </>
                                                        )}

                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        ))}
                                        <Box sx={{ mb: 2 }}>
                                            {customFields.map((field, index) => (
                                                <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }} key={index}>
                                                    <Grid item xs="auto" sm={5} mb={2}>
                                                        <TextField
                                                            select
                                                            fullWidth
                                                            variant="outlined"
                                                            label='Custom Field'
                                                            value={field.type}
                                                            onChange={(e) => handleChangeField(index, 'type', e.target.value)}
                                                            InputLabelProps={{
                                                                sx: {
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                                    top: '-5px',
                                                                    '&.Mui-focused': {
                                                                        color: '#0000FF',
                                                                        top: 0
                                                                    },
                                                                    '&.MuiInputLabel-shrink': {
                                                                        top: 0
                                                                    }
                                                                }
                                                            }}
                                                            InputProps={{
                                                                sx: {
                                                                    '&.MuiOutlinedInput-root': {
                                                                        height: '36px',
                                                                        '& .MuiOutlinedInput-input': {
                                                                            padding: '6.5px 8px',
                                                                            fontFamily: 'Roboto',
                                                                            color: '#202124',
                                                                            fontSize: '14px',
                                                                            fontWeight: '400',
                                                                            lineHeight: '20px'
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
                                                                }
                                                            }}
                                                        >

                                                            {customFieldsList.map((item) => (
                                                                <MenuItem
                                                                    key={item.value}
                                                                    value={item.value}
                                                                    disabled={customFields.some(f => f.type === item.value)} // Дизейблим выбранные
                                                                >
                                                                    {item.type}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                    </Grid>
                                                    <Grid item xs="auto" sm={1} mb={2} container justifyContent="center">
                                                        <Image
                                                            src='/chevron-right-purple.svg'
                                                            alt='chevron-right-purple'
                                                            height={18}
                                                            width={18}
                                                        />
                                                    </Grid>
                                                    <Grid item xs="auto" sm={5} mb={2}>
                                                        <TextField
                                                            fullWidth
                                                            variant="outlined"
                                                            value={field.value}
                                                            onChange={(e) => handleChangeField(index, 'value', e.target.value)}
                                                            placeholder="Enter value"
                                                            InputLabelProps={{
                                                                sx: {
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontSize: '12px',
                                                                    lineHeight: '16px',
                                                                    color: 'rgba(17, 17, 19, 0.60)',
                                                                    top: '-5px',
                                                                    '&.Mui-focused': {
                                                                        color: '#0000FF',
                                                                        top: 0,
                                                                    },
                                                                    '&.MuiInputLabel-shrink': {
                                                                        top: 0,
                                                                    },
                                                                },
                                                            }}
                                                            InputProps={{
                                                                sx: {
                                                                    height: '36px',
                                                                    '& .MuiOutlinedInput-input': {
                                                                        padding: '6.5px 8px',
                                                                        fontFamily: 'Roboto',
                                                                        color: '#202124',
                                                                        fontSize: '14px',
                                                                        fontWeight: '400',
                                                                        lineHeight: '20px',
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
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs="auto" mb={2} sm={1} container justifyContent="center">
                                                        <IconButton onClick={() => handleDeleteField(index)}>
                                                            <Image
                                                                src='/trash-icon-filled.svg'
                                                                alt='trash-icon-filled'
                                                                height={18}
                                                                width={18}
                                                            />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                            ))}
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr: 6 }}>
                                                <Button
                                                    onClick={handleAddField}
                                                    aria-haspopup="true"
                                                    sx={{
                                                        textTransform: 'none',
                                                        border: '1px solid rgba(80, 82, 178, 1)',
                                                        borderRadius: '4px',
                                                        padding: '9px 16px',
                                                        minWidth: 'auto',
                                                        '@media (max-width: 900px)': {
                                                            display: 'none'
                                                        }
                                                    }}
                                                >
                                                    <Typography sx={{
                                                        marginRight: '0.5em',
                                                        fontFamily: 'Nunito Sans',
                                                        lineHeight: '22.4px',
                                                        fontSize: '16px',
                                                        textAlign: 'left',
                                                        fontWeight: '500',
                                                        color: '#5052B2'
                                                    }}>
                                                        Add
                                                    </Typography>
                                                </Button>
                                            </Box>
                                        </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>
                    <Box sx={{ width: '100%', border: '1px solid #e4e4e4' }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                            <Box
                                sx={{
                                position: 'sticky',
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
                                    onClick={handleNextTab}
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
                </Box>
            </Drawer>

            {/* Data Sync */}
            <ConnectSalesForce data={null} open={salesForceIconPopupOpen} onClose={handleSalesForceIconPopupClose} />
            <ConnectMeta data={null} open={metaIconPopupOpen} onClose={handleMetaIconPopupClose} isEdit={false} />
            <HubspotDataSync open={hubspotIconPopupOpen} onClose={handleHubspotIconPopupOpenClose} isEdit={false} data={null} />
            <MailchimpDatasync open={mailchimpIconPopupOpen} onClose={handleMailchimpIconPopupIconClose} data={null} />
            <GoogleADSDatasync open={googleAdsIconPopupOpen} onClose={handleGoogleAdsIconPopupIconClose} data={null} isEdit={false} />

            {/* Add Integration */}
            <GoogleADSConnectPopup 
                open={createGoogleAds} 
                handlePopupClose={handleCreateGoogleAdsClose} 
                onSave={handleSaveSettings} 
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'google_ads')?.access_token} />
            <SalesForceIntegrationPopup 
                open={createSalesForce} 
                handleClose={handleCreateSalesForceClose} 
                onSave={handleSaveSettings} 
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'sales_force')?.access_token} />
            <MailchimpConnect 
                onSave={handleSaveSettings} 
                open={openMailchimpConnect} 
                handleClose={handleOpenMailchimpConnectClose} 
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Mailchimp')?.access_token} />
            <HubspotIntegrationPopup 
                open={createHubspot} 
                handleClose={handleCreateHubspotClose} 
                onSave={handleSaveSettings} 
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'hubspot')?.access_token} />
            <MetaConnectButton 
                open={metaConnectApp} 
                onClose={handleCloseMetaConnectApp} 
                onSave={handleSaveSettings} />
            
            <UpgradePlanPopup open={upgradePlanPopup} limitName={'domain'} handleClose={() => setUpgradePlanPopup(false)} />
        </>
    );
};

export default CreateSyncPopup;