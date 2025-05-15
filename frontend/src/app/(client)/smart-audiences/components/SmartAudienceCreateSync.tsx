import React, { useState, useEffect } from 'react';
import {
    Drawer, Box, Typography, IconButton, List, LinearProgress, Grid,
    Button, Popover, Tooltip, Tab, Slider, TextField, Card, CardContent,
    MenuItem, Link
} from '@mui/material';
import TabList from "@mui/lab/TabList";
import TabPanel from '@mui/lab/TabPanel';
import TabContext from "@mui/lab/TabContext";
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import Image from 'next/image';
import SalesForceIntegrationPopup from '@/components/SalesForceIntegrationPopup';
import GoogleADSConnectPopup from '@/components/GoogleADSConnectPopup';
import MetaConnectButton from '@/components/MetaConnectButton';
import S3Connect from "@/components/S3Connect";
import MailchimpConnect from '@/components/MailchimpConnect';
import HubspotIntegrationPopup from '@/components/HubspotIntegrationPopup';
import { UpgradePlanPopup } from '@/app/(client)/components/UpgradePlanPopup';
import IntegrationBox from './IntegrationBox';
import GoogleAdsContactSyncTab from './GoogleAdsContactSyncTab';
import MailchimpContactSyncTab from './MailchimpContactSyncTab';
import MetaContactSyncTab from './MetaContactSyncTab'
import S3ContactSyncTab from './S3ContactSyncTab'
import { styled } from '@mui/material/styles';
import { useIntegrationContext } from "@/context/IntegrationContext";
import { AxiosError } from 'axios';

interface AudiencePopupProps {
    open: boolean;
    onClose: () => void;
    updateSmartAudStatus: (id: string) => void;
    integrationsList?: string[];
    id?: string
    activeSegmentRecords?: number
    isDownloadAction: boolean
    setIsPageLoading: (state: boolean) => void
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

interface FormValues {
    campaignName: string;
    campaignObjective: string;
    bidAmount: number;
    dailyBudget: number;
}


interface Row {
    id: number;
    type: string;
    value: string;
    selectValue?: string;
    canDelete?: boolean;
}

interface CustomRow {
    type: string;
    value: string;
}

interface MetaAuidece {
    id: string
    list_name: string
}

interface MetaCampaign {
    id: string
    list_name: string
}

interface adAccount {
    id: string
    name: string
}

type ChannelList = {
    list_id: string;
    list_name: string;
}

type Customers = {
    customer_id: string;
    customer_name: string;
}

interface RequestData {
    sent_contacts: number;
    smart_audience_id?: string
    list_id?: string
    list_name?: string
    campaign?: any
    customer_id?: string
    data_map: CustomRow[]
}

type ServiceHandlers = {
    hubspot: () => void;
    mailchimp: () => void;
    sales_force: () => void;
    google_ads: () => void;
    s3: () => void;
};

type ArrayMapping = {
    hubspot: CustomRow[];
    mailchimp: CustomRow[];
    default: CustomRow[]
    meta: CustomRow[]
    CSV: CustomRow[],
    s3: CustomRow[],
    google_ads: CustomRow[],
    sales_force: CustomRow[]
};

const styles = {
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
            color: 'rgba(56, 152, 252, 1)',
            fontWeight: '700'
        }
    },
    inputLabel: {
        fontFamily: 'Nunito Sans',
        fontSize: '12px',
        lineHeight: '16px',
        color: 'rgba(17, 17, 19, 0.60)',
        '&.Mui-focused': {
            color: 'rgba(56, 152, 252, 1)',
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
                // borderColor: 'rgba(56, 152, 252, 1)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(56, 152, 252, 1)',
            },
        },
        '&+.MuiFormHelperText-root': {
            marginLeft: '0',
        },
    },
}


const BorderLinearProgress = styled(LinearProgress)(() => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: '#c6dafc',
    '& .MuiLinearProgress-bar': {
        borderRadius: 5,
        backgroundColor: '#4285f4',
    },
}));

const integrationsImage = [
    { image: 'csv-icon.svg', service_name: 'CSV' },
    { image: 'meta-icon.svg', service_name: 'meta' },
    { image: 'mailchimp-icon.svg', service_name: 'mailchimp' },
    { image: 'hubspot.svg', service_name: 'hubspot' },
    { image: 'google-ads.svg', service_name: 'google_ads' },
    { image: 'bing.svg', service_name: 'bing_ads' },
    { image: 'salesforce-icon.svg', service_name: 'sales_force' },
    { image: 's3.svg', service_name: 's3' }
];

const customFieldsList: Row[] = [
    { id: 1, type: 'Business Email', value: 'business_email' },
    { id: 2, type: 'Personal Email', value: 'personal_email' },
    { id: 3, type: 'Phone', value: 'phone' },
    { id: 4, type: 'City', value: 'city' },
    { id: 5, type: 'State', value: 'state' },
    { id: 6, type: 'Country code', value: 'country_code' },
    { id: 7, type: 'Company', value: 'company' },
    { id: 8, type: 'Business email last seen date', value: 'business_email_last_seen_date' },
    { id: 9, type: 'Personal email last seen', value: 'personal_email_last_seen' },
    { id: 10, type: 'Linkedin url', value: 'linkedin_url' }
]

const customFieldsListHubspot: Row[] = [
    { id: 1, type: 'Phone', value: 'phone' },
    { id: 2, type: 'City', value: 'city' },
    { id: 3, type: 'State', value: 'state' },
    { id: 4, type: 'Zip', value: 'zip_code' },
    { id: 5, type: 'Gender', value: 'gender' },
    { id: 6, type: 'Company', value: 'company' }
]

const customFieldsListCSV: Row[] = [
    { id: 1, type: 'First Name', value: 'first_name' },
    { id: 2, type: 'Last Name', value: 'last_name' },
    { id: 3, type: 'Business Email', value: 'business_email' },
    { id: 4, type: 'Personal Email', value: 'personal_email' },
    { id: 5, type: 'Other Emails', value: 'other_emails' },
    { id: 6, type: 'Phone Mobile 1', value: 'phone_mobile1' },
    { id: 7, type: 'Phone Mobile 2', value: 'phone_mobile2' },
    { id: 8, type: 'Mobile Phone DNC', value: 'mobile_phone_dnc' },
    { id: 9, type: 'Business Email last seen', value: 'business_email_last_seen_date' },
    { id: 10, type: 'Personal Email last seen', value: 'personal_email_last_seen' },
    { id: 11, type: 'Linkedin URL', value: 'linkedin_url' },
    { id: 12, type: 'Gender', value: 'gender' },
    // { id: 13, type: 'Lon', value: 'lon' },
    // { id: 14, type: 'Has credit card', value: 'has_credit_card' },
    // { id: 15, type: 'Length of residence years', value: 'length_of_residence_years' },
    // { id: 16, type: 'Marital status', value: 'marital_status' },
    // { id: 17, type: 'Occupation group code', value: 'occupation_group_code' },
    // { id: 18, type: 'Is book reader', value: 'is_book_reader' },
    // { id: 19, type: 'Is online purchaser', value: 'is_online_purchaser' },
    // { id: 20, type: 'Is book reader', value: 'is_book_reader' },
    // { id: 21, type: 'Is traveler', value: 'is_traveler' },
    // { id: 22, type: 'Rec id', value: 'rec_id' },
]

const defaultRows: Row[] = [
    { id: 1, type: 'Email', value: 'email' },
    { id: 2, type: 'Firstname', value: 'firstname' },
    { id: 3, type: 'Lastname', value: 'lastname' },
];

const defaultSalesForce: Row[] = [
    { id: 1, type: 'Email', value: 'email' },
    { id: 2, type: 'Firstname', value: 'firstname' },
    { id: 3, type: 'Lastname', value: 'lastname' },
    { id: 4, type: 'Company', value: 'company' },
];

const defaultRowsHubspot: Row[] = [
    { id: 1, type: 'Email', value: 'email' },
    { id: 2, type: 'Firstname', value: 'firstname' },
    { id: 3, type: 'Lastname', value: 'lastname' },
];

const defaultRowsMeta: Row[] = [
    { id: 1, type: 'Email', value: 'email' },
    { id: 2, type: 'Phone', value: 'phone' },
    { id: 3, type: 'Gender', value: 'gender' },
    { id: 4, type: 'Birth date', value: 'birth_date' },
    { id: 7, type: 'First name', value: 'first_name' },
    { id: 8, type: 'Last name', value: 'last_name' },
    { id: 9, type: 'State', value: 'state' },
    { id: 10, type: 'City', value: 'city' },
    { id: 11, type: 'Zip code', value: 'zip_code' }
];

const defaultRowsGoogleAds: Row[] = [
    { id: 1, type: 'Email', value: 'email' },
    { id: 2, type: 'First name', value: 'first_name' },
    { id: 3, type: 'Last name', value: 'last_name' },
    { id: 4, type: 'Phone', value: 'phone' },
    { id: 5, type: 'City', value: 'city' },
    { id: 6, type: 'State', value: 'state' },
    { id: 7, type: 'Country code', value: 'country_code' },
];

const CreateSyncPopup: React.FC<AudiencePopupProps> = ({ open, onClose, updateSmartAudStatus, integrationsList: integ = [], id, activeSegmentRecords = 0, isDownloadAction, setIsPageLoading }) => {
    const { triggerSync } = useIntegrationContext();
    const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationsCredentials[]>([])
    const [createHubspot, setCreateHubspot] = useState<boolean>(false)
    const [createSalesForce, setCreateSalesForce] = useState<boolean>(false)
    const [createGoogleAds, setCreateGoogleAds] = useState<boolean>(false)
    const [integrations, setIntegrations] = useState<Integrations[]>([])
    const [metaConnectApp, setMetaConnectApp] = useState(false)
    const [openS3Connect, setOpenS3Connect] = useState(false);
    const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
    const [integratedServices, setIntegratedServices] = useState<string[]>([])

    const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false)
    const [googleAdsIconPopupOpen, setOpenGoogleAdsIconPopup] = useState(false)
    const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false)
    const [hubspotIconPopupOpen, setOpenHubspotIconPopupOpen] = useState(false)
    const [contactSyncTab, setContactSyncTab] = useState(false)

    const [activeService, setActiveService] = useState<string | null>(null);
    const [activeImageService, setActiveImageService] = useState<string>("csv-icon.svg");
    const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [value, setValue] = useState('1');
    const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

    const [customFields, setCustomFields] = useState<CustomRow[]>([]);
    const [rows, setRows] = useState(defaultRows);
    const { needsSync } = useIntegrationContext();

    //GENERAL

    const handleClosePopup = () => {
        setContactSyncTab(false)
        onClose()
        setValue("1")
        setActiveImageService("csv-icon.svg")
        setActiveService(null)
        setValueContactSync(0)
        setCustomFields([])
    }

    useEffect(() => {
        const fetchData = async () => {
            const response = await axiosInstance.get('/integrations/smart-audience-sync/', {
                params: {
                    integration_list: [...integ, "s3"].join(","),
                },
            });
            if (response.status === 200) {
                setIntegrations([{ service_name: "CSV", data_sync: true, id: 0 }, ...response.data]);
            }
        };
        if (open) {
            fetchData();
        }
    }, [open]);

    useEffect(() => {
    }, [customFields]);

    useEffect(() => {
        if (isDownloadAction) {
            setValue("2")
            setActiveService("CSV")
            setCustomFields(
                [...customFieldsListCSV.map(field => ({ type: field.value, value: field.type }))
                ])
        }
        else {
            setValue("1")
        }
    }, [isDownloadAction])


    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await axiosInstance.get('/integrations/credentials/')
                if (response.status === 200) {
                    setIntegrationsCredentials(response.data)
                    setIntegratedServices(response.data.map((cred: any) => cred.service_name))
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
    }, [open, needsSync])


    const formatServiceName = (serviceName: string) => {
        return serviceName
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/^./, (match) => match.toUpperCase());
    };


    const toCamelCase = (name: string) => {
        const updatedName = name?.split('_').map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
            .join('');
        return updatedName
    }

    const toSnakeCase = (name: string) => {
        return name.toLowerCase().split(' ').join('_');
    }

    const handleActive = (service: string) => {
        setActiveService(service);
        setActiveImageService(integrationsImage.filter((item) => item.service_name === service)[0].image)
    };

    const validateTab2 = () => {
        return valueContactSync;
    };

    const canSendDataSync = () => {
        return value === '4' || !contactSyncTab
    };

    const downloadPersons = async () => {
        setIsPageLoading(true);
        onClose()
        try {

            const requestObj: RequestData = {
                sent_contacts: valueContactSync,
                smart_audience_id: id,
                data_map: [
                    // ...defaultRows.map((item) => ({ value: item.type, type: toSnakeCase(item.type) })),
                    ...customFields
                ]
            }
            const response = await axiosInstance.post('/audience-smarts/download-persons', requestObj, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'data.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                showErrorToast(`Error downloading file`);
            }
        } catch {
        } finally {
            setIsPageLoading(false)
            onClose()
        }

    }

    const createDataSync = async () => {
        setIsLoading(true);
        try {
            const requestObj: RequestData = {
                sent_contacts: valueContactSync,
                smart_audience_id: id,
                data_map: customFields
            }

            if (activeService === "mailchimp") {
                if (selectedOptionMailchimp?.id && selectedOptionMailchimp?.list_name) {
                    requestObj.list_id = String(selectedOptionMailchimp?.id),
                        requestObj.list_name = selectedOptionMailchimp?.list_name
                }
                else {
                    showErrorToast("You have selected incorrect data!")
                    return
                }
            }

            if (activeService === "s3") {
                if (selectedOptionS3) {
                    requestObj.list_name = selectedOptionS3
                }
                else {
                    showErrorToast("You have selected incorrect data!")
                    return
                }
            }

            if (activeService === "meta") {
                if (optionAdAccountMeta?.id && selectedOptionMeta?.list_name && selectedOptionMeta?.id) {
                    requestObj.customer_id = String(optionAdAccountMeta?.id)
                    requestObj.list_id = String(selectedOptionMeta?.id),
                    requestObj.list_name = selectedOptionMeta?.list_name
                    requestObj.campaign = {
                        campaign_id: selectedOptionCampaignMeta?.id,
                        campaign_name: formValuesMeta?.campaignName,
                        campaign_objective: formValuesMeta?.campaignObjective,
                        bid_amount: formValuesMeta?.bidAmount,
                        daily_budget: formValuesMeta?.dailyBudget
                    }
                }
                else {
                    showErrorToast("You have selected incorrect data!")
                    return
                }
            }

            if (activeService === "google_ads") {
                if (selectedOptionGoogle?.list_id && selectedOptionGoogle?.list_name && selectedAccountIdGoogle) {
                    requestObj.customer_id = String(selectedAccountIdGoogle)
                    requestObj.list_id = String(selectedOptionGoogle?.list_id),
                        requestObj.list_name = selectedOptionGoogle?.list_name
                }
                else {
                    showErrorToast("You have selected incorrect data!")
                    return
                }
            }

            const response = await axiosInstance.post('/data-sync/create-smart-audience-sync', requestObj, {
                params: {
                    service_name: activeService
                }
            });
            if (response.status === 201 || response.status === 200) {
                handleClosePopup();
                showToast('Data sync created successfully');
                triggerSync();
                if (id) { updateSmartAudStatus(id) }
            }
        } catch {
        } finally {
            setIsLoading(false)
        }
    }

    const actionBasedOnService = () => {
        if (activeService === "mailchimp") {
            setContactSyncTab(true)
            getList()
            setRows(defaultRows)
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }

        if (activeService === "s3") {
            setContactSyncTab(true)
            getS3List()
            setRows(defaultRows)
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }

        if (activeService === "meta") {
            setContactSyncTab(true)
            fetchAdAccount()
            setRows(defaultRowsMeta)
        }

        if (activeService === "google_ads") {
            setContactSyncTab(true)
            getCustomersInfo()
            setRows(defaultRowsGoogleAds)
        }

        if (activeService === "hubspot") {
            setRows(defaultRowsHubspot)
            setCustomFields(customFieldsListHubspot.map(field => ({ type: field.value, value: field.type })))
        }

        if (activeService === "CSV") {
            setRows(defaultRows)
            setCustomFields(customFieldsListCSV.map(field => ({ type: field.value, value: field.type })))
        }

        if (activeService === "sales_force") {
            setRows(defaultSalesForce)
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }
        if (activeService === "s3") {
            setRows(defaultRows)
            setCustomFields(customFieldsList.map(field => ({ type: field.value, value: field.type })))
        }
    }

    const handleNextTab = async () => {
        if (value === '1') {
            if (activeService) {
                actionBasedOnService()
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
        else if (value === '2') {
            if (validateTab2()) {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
        else if (value === '3' || value === '4') {
            if (canSendDataSync()) {
                if (isDownloadAction) {
                    downloadPersons()
                }
                else {
                    createDataSync()
                }
            }
            else {
                setValue((prevValue) => String(Number(prevValue) + 1));
            }
        }
    };

    const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue === "1") {
            setContactSyncTab(false)
            setValueContactSync(0)
        }
        if (newValue === "2") {
            actionBasedOnService()
        }
        if (newValue === "3") {
            if (!valueContactSync) return
        }
        if (activeService) {
            setValue(newValue)
        }
    };

    // Input Range Slider

    const [valueContactSync, setValueContactSync] = useState<number>(0);
    const maxContacts = activeSegmentRecords;

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setValueContactSync(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = Number(event.target.value);
        if (inputValue >= 0 && inputValue <= maxContacts) {
            setValueContactSync(inputValue);
        }
    };

    // Data Maping

    const handleChangeField = (index: number, field: string, value: string) => {
        setCustomFields(customFields.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const handleAddField = () => {
        setCustomFields([...customFields, { type: '', value: '' }]);
    };

    const handleDeleteField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleMapListChange = (id: number, field: 'value' | 'type', value: string) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    // Delete default rows

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

    // Create Integration

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

    const handleHubspotIconPopupOpen = () => {
        setOpenHubspotIconPopupOpen(true);
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

    const handleMetaIconPopupOpen = () => {
        setMetaIconPopupOpen(true);
    };

    const handleOpenMailchimpConnectClose = () => {
        setOpenmailchimpConnect(false)
    }

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

    const handleCreateS3Open = () => {
        setOpenS3Connect(true)
    }

    const handleCreateS3Close = () => {
        setOpenS3Connect(false)
    }

    const handleCreateGoogleAdsOpen = () => {
        setCreateGoogleAds(true)
    }

    const handleCreateGoogleAdsClose = () => {
        setCreateGoogleAds(false)
    }

    const handleCloseMetaConnectApp = () => {
        setIntegrationsCredentials(prevIntegratiosn => [...prevIntegratiosn, {
            service_name: 'Meta'
        }])
        setMetaIconPopupOpen(true)
        setMetaConnectApp(false)
    }

    const handlers: ServiceHandlers = {
        hubspot: handleCreateHubspotOpen,
        mailchimp: handleOpenMailchimpConnect,
        sales_force: handleCreateSalesForceOpen,
        google_ads: handleCreateGoogleAdsOpen,
        s3: handleCreateS3Open,
    };

    const arrayWithCustomFields: ArrayMapping = {
        hubspot: customFieldsList,
        mailchimp: customFieldsList,
        CSV: customFieldsListCSV,
        default: customFieldsList,
        meta: customFieldsList,
        s3: customFieldsList,
        google_ads: customFieldsList,
        sales_force: customFieldsList
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

        if (service_name === "meta") {
            setMetaConnectApp(true)
        } else if (service_name in handlers) {
            handlers[service_name as keyof ServiceHandlers]();
        }
    };

    // Mailchimp

    const [klaviyoList, setKlaviyoList] = useState<KlaviyoList[]>([])
    const [selectedOptionMailchimp, setSelectedOptionMailchimp] = useState<KlaviyoList | null>(null);

    const getList = async () => {
        try {
            setIsLoading(true)
            const response = await axiosInstance.get('/integrations/sync/list/', {
                params: {
                    service_name: activeService
                }
            })
            setKlaviyoList(response.data)
        } catch {
        } finally {
            setIsLoading(false)
        }

    }

    ///S3
    const [s3List, setS3List] = useState<string[]>([])
    const [selectedOptionS3, setSelectedOptions3] = useState<string | null>(null);

    const getS3List = async () => {
        try {
            setIsLoading(true)
            const response = await axiosInstance.get('/integrations/sync/list/', {
                params: {
                    service_name: 's3'
                }
            })
            setS3List(response.data)
            setIsLoading(false)
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 400) {
                    if (error.response.data.status === 'CREDENTIALS_MISSING') {
                        showErrorToast(error.response.data.message);
                    } else if (error.response.data.status === 'CREDENTIALS_INCOMPLETE') {
                        showErrorToast(error.response.data.message);
                    } else {
                        showErrorToast(error.response.data.message);
                    }
                }
            }
        }
    }

    ///Meta 

    const [selectedOptionMeta, setSelectedOptionMeta] = useState<MetaAuidece | null>(null);
    const [selectedOptionCampaignMeta, setSelectedOptionCampaignMeta] = useState<MetaCampaign | null>(null);
    const [optionAdAccountMeta, setOptionAdAccountMeta] = useState<adAccount | null>(null)
    const [adAccountsMeta, setAdAccountsMeta] = useState<adAccount[]>([])
    const [formValuesMeta, setFormValuesMeta] = useState<FormValues>({
        campaignName: '',
        campaignObjective: '',
        bidAmount: 1,
        dailyBudget: 100,
    });


    const fetchAdAccount = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/integrations/sync/ad_accounts');
            if (response.status === 200) {
                setAdAccountsMeta(response.data);
            }
        }
        finally {
            setIsLoading(false);
        }
    };

    ///Google Ads


    const [selectedOptionGoogle, setSelectedOptionGoogle] = useState<ChannelList | null>()
    const [selectedAccountIdGoogle, setSelectedAccountIdGoogle] = useState<string>('');
    const [customersInfo, setCustomersInfo] = useState<Customers[]>([]);
    const [notAdsUser, setNotAdsUser] = useState<boolean>(false);


    const getCustomersInfo = async () => {
        try {
            setIsLoading(true)
            const response = await axiosInstance.get('integrations/google-ads/customers-info')
            if (response.data.status === 'SUCCESS') {
                setCustomersInfo(response.data.customers || [])
            }
            else if (response.data.status === 'NOT_ADS_USER') {
                setNotAdsUser(true)
            }
            else {
                showErrorToast(response.data.message)
            }
        } catch (error) { }
        finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={handleClosePopup}
                PaperProps={{
                    sx: {
                        width: '620px',
                        position: 'fixed',
                        zIndex: 1301,
                        top: 0,
                        bottom: 0,
                        overflowY: "auto",
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2.85, px: 2, borderBottom: '1px solid #e4e4e4', position: 'sticky', top: 0, zIndex: 11, backgroundColor: '#fff' }}>
                    <Typography variant="h6" className="first-sub-title" sx={{ textAlign: 'center' }}>
                        Create smart audience sync {isDownloadAction ? "with CSV" : activeService ? `with ${formatServiceName(toCamelCase(activeService))}` : ""}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '32px', '@media (max-width: 600px)': { gap: '8px' } }}>
                        <Link href="https://allsourceio.zohodesk.com/portal/en/kb/allsource" className="main-text" sx={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            color: 'rgba(56, 152, 252, 1)',
                            textDecorationColor: 'rgba(56, 152, 252, 1)'
                        }}>Tutorial</Link>
                        <IconButton onClick={handleClosePopup} sx={{ p: 0 }}>
                            <CloseIcon sx={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: "100%" }}>
                    <Box sx={{ width: '100%' }}>
                        <TabContext value={value}>
                            <Box sx={{ pt: 3, pb: 3, position: "sticky", top: 60, backgroundColor: "#fff", zIndex: 10 }}>
                                <TabList centered
                                    TabIndicatorProps={{ sx: { backgroundColor: "rgba(56, 152, 252, 1)" } }}
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
                                    <Tab label="Destination" value="1" className='tab-heading' sx={styles.tabHeading} />
                                    <Tab label="Contacts" value="2" className='tab-heading' sx={styles.tabHeading} />
                                    {contactSyncTab && <Tab label="Contacts Sync" value="3" className='tab-heading' sx={styles.tabHeading} />}
                                    <Tab label="Map data" value={contactSyncTab ? "4" : "3"} className='tab-heading' sx={styles.tabHeading} />
                                </TabList>
                            </Box>
                            <TabPanel value="1" sx={{ p: 0 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 5, height: '100%' }}>
                                    <Box sx={{ p: 0, width: '100%' }}>
                                        <Box sx={{ px: 2, pb: 3, display: "flex", flexDirection: "column", gap: 3, borderRadius: '4px' }}>
                                            <Typography variant="h6" className="first-sub-title">
                                                {integrations.length ? "Choose where you want to sync" : ''}
                                            </Typography>
                                            <List sx={{ display: 'flex', p: 0, gap: '16px', flexWrap: 'wrap', border: 'none' }}>
                                                {integrations
                                                    .sort((a, b) => {
                                                        const isIntegratedA = integratedServices.includes(a.service_name) || a.service_name === 'CSV';
                                                        const isIntegratedB = integratedServices.includes(b.service_name) || b.service_name === 'CSV';

                                                        if (a.service_name === 'CSV') return -1;
                                                        if (b.service_name === 'CSV') return 1;
                                                        if (a.service_name === 's3') return -1;
                                                        if (b.service_name === 's3') return 1;
                                                        if (isIntegratedA && !isIntegratedB) return -1;
                                                        if (!isIntegratedA && isIntegratedB) return 1;
                                                        return 0;
                                                    })
                                                    .map((integration) => {
                                                        let isIntegrated = integratedServices.includes(integration.service_name);
                                                        if (integration.service_name === 'CSV') {
                                                            isIntegrated = true
                                                        }
                                                        const integrationCred = integrationsCredentials.find(cred => cred.service_name === integration.service_name);


                                                        return (
                                                            <Box key={integration.service_name} onClick={() =>
                                                                isIntegrated ? handleActive(integration.service_name) : handleAddIntegration(integration.service_name)} sx={{ width: "135px" }}>
                                                                <IntegrationBox
                                                                    image={`/${integrationsImage.filter((item) => item.service_name === integration.service_name)[0]?.image}`}
                                                                    serviceName={toCamelCase(integration.service_name)}
                                                                    active={activeService === integration.service_name}
                                                                    isAvalible={isIntegrated || integrationCred?.is_failed}
                                                                    isFailed={integrationCred?.is_failed}
                                                                    isIntegrated={isIntegrated}
                                                                />
                                                            </Box>
                                                        )
                                                    })
                                                }
                                            </List>

                                        </Box>
                                    </Box>
                                </Box>
                            </TabPanel>
                            <TabPanel value="2" sx={{ p: 0 }}>
                                <Box sx={{ display: "flex", px: 2, pb: 3 }}>
                                    <Card
                                        sx={{
                                            display: "flex",
                                            padding: 2,
                                            boxShadow: 2,
                                            borderRadius: "4px",
                                            width: "100%"
                                        }}
                                    >
                                        <CardContent sx={{ width: "100%" }}>
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
                                                    // sx={{
                                                    //     "&.MuiSlider-thumb": { width: "14px", height: "14px", transform: "translate(0, -50%)" }, 
                                                    //     "&.MuiSlider-rail": { backgroundColor: "rgba(231, 231, 231, 1)" } 
                                                    // }}

                                                    sx={{
                                                        color:
                                                        valueContactSync === 0
                                                            ? "rgba(231, 231, 231, 1)"
                                                            : "rgba(56, 152, 252, 1)",
                                                        "& .MuiSlider-track": {
                                                          backgroundColor: "rgba(56, 152, 252, 1)",
                                                        },
                                                        "& .MuiSlider-thumb": {
                                                          backgroundColor: "rgba(56, 152, 252, 1)",
                                                        },
                                                      }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </TabPanel>
                            {contactSyncTab &&
                                <TabPanel value="3" sx={{ p: 0 }}>
                                    <Box sx={{ display: 'flex', px: 2, pb: 3, flexDirection: 'column', gap: '16px' }}>
                                        <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '4px', boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.20)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 3 }}>
                                                <Image src={activeImageService} alt={activeService ?? "service"} height={26} width={32} />
                                                <Typography variant="h6" className='first-sub-title'>Contact sync</Typography>
                                                <Tooltip title="Sync data with list" placement="right">
                                                    <Image src='/baseline-info-icon.svg' alt='baseline-info-icon' height={16} width={16} />
                                                </Tooltip>
                                            </Box>

                                            {activeService === "mailchimp" &&
                                                <MailchimpContactSyncTab
                                                    selectedOptionMailchimp={selectedOptionMailchimp}
                                                    setSelectedOptionMailchimp={setSelectedOptionMailchimp}
                                                    klaviyoList={klaviyoList}
                                                    setIsloading={setIsLoading}
                                                />
                                            }

                                            {activeService === "s3" &&
                                                <S3ContactSyncTab
                                                    setSelectedOptions3={setSelectedOptions3}
                                                    selectedOptions3={selectedOptionS3}
                                                    s3List={s3List}
                                                />
                                            }

                                            {activeService === "meta" &&
                                                <MetaContactSyncTab
                                                    setIsLoading={setIsLoading}
                                                    setSelectedOptionCampaignMeta={setSelectedOptionCampaignMeta}
                                                    selectedOptionCampaignMeta={selectedOptionCampaignMeta}
                                                    selectedOptionMeta={selectedOptionMeta}
                                                    setSelectedOptionMeta={setSelectedOptionMeta}
                                                    adAccountsMeta={adAccountsMeta}
                                                    optionAdAccountMeta={optionAdAccountMeta}
                                                    formValues={formValuesMeta}
                                                    setFormValues={setFormValuesMeta}
                                                    setOptionAdAccountMeta={setOptionAdAccountMeta}
                                                />
                                            }

                                            {activeService === "google_ads" &&
                                                <GoogleAdsContactSyncTab
                                                    setIsLoading={setIsLoading}
                                                    customersInfo={customersInfo}
                                                    setSelectedOptionGoogle={setSelectedOptionGoogle}
                                                    setSelectedAccountIdGoogle={setSelectedAccountIdGoogle}
                                                    selectedAccountIdGoogle={selectedAccountIdGoogle}
                                                />
                                            }

                                        </Box>
                                    </Box>
                                </TabPanel>
                            }
                            <TabPanel value={contactSyncTab ? "4" : "3"} sx={{ p: 0 }}>
                                <Box sx={{
                                    borderRadius: '4px',
                                    px: 2, pb: 3,
                                    overflowX: 'auto'
                                }}>
                                    <Box sx={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                        <Typography variant="h6" className='first-sub-title'>Map list</Typography>
                                        {(activeService === "mailchimp" || activeService === "meta") && <Typography variant='h6' sx={{
                                            background: '#EDEDF7',
                                            borderRadius: '3px',
                                            fontFamily: 'Roboto',
                                            fontSize: '12px',
                                            fontWeight: '400',
                                            color: '#5f6368',
                                            padding: '2px 4px',
                                            lineHeight: '16px'
                                        }}>
                                            {(activeService === "mailchimp" && selectedOptionMailchimp?.list_name) || (activeService === "meta" && selectedOptionMeta?.list_name)}
                                        </Typography>}
                                    </Box>

                                    <Grid container alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' }, marginBottom: '14px' }}>
                                        <Grid item xs="auto" sm={5} sx={{
                                            textAlign: 'center',
                                            '@media (max-width:599px)': {
                                                minWidth: '196px'
                                            }
                                        }}>
                                            <Image src='/logo.svg' alt='logo' height={31} width={130} />
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
                                            <Image src={activeImageService} alt={activeService ?? "img service"} height={20} width={30} />
                                        </Grid>
                                        <Grid item xs="auto" sm={1}>&nbsp;</Grid>
                                    </Grid>

                                    {rows.map((row, index) => (
                                        <Box key={row.id} sx={{ mb: 2 }}>
                                            <Grid container spacing={2} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', sm: 'wrap' } }}>
                                                {/* Left Input Field */}
                                                <Grid item xs="auto" sm={5}>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        disabled={true}
                                                        value={row.type}
                                                        onChange={(e) => handleMapListChange(row.id, 'value', e.target.value)}
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: 'rgba(56, 152, 252, 1)',
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
                                                                        borderColor: 'rgba(56, 152, 252, 1)',
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
                                                                width={18}
                                                            />

                                                        ) : (
                                                            <Image
                                                                src='/close-circle.svg'
                                                                alt='close-circle'
                                                                height={18}
                                                                width={18}
                                                            />
                                                        )
                                                    ) : (
                                                        <Image
                                                            src='/chevron-right-purple.svg'
                                                            alt='chevron-right-purple'
                                                            height={18}
                                                            width={18}
                                                        />
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
                                                                    color: 'rgba(56, 152, 252, 1)',
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
                                                                        borderColor: 'rgba(56, 152, 252, 1)',
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
                                                                    width={18}
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
                                                                            border: '1px solid rgba(56, 152, 252, 1)',
                                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                            color: 'rgba(56, 152, 252, 1)',
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
                                                                            background: 'rgba(56, 152, 252, 1)',
                                                                            borderRadius: '4px',
                                                                            border: '1px solid rgba(56, 152, 252, 1)',
                                                                            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                                                                            color: '#fff',
                                                                            fontFamily: 'Nunito Sans',
                                                                            fontSize: '14px',
                                                                            fontWeight: '600',
                                                                            lineHeight: '20px',
                                                                            textTransform: 'none',
                                                                            '&:hover': {
                                                                                color: 'rgba(56, 152, 252, 1)'
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
                                                                    color: 'rgba(56, 152, 252, 1)',
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
                                                                        borderColor: 'rgba(56, 152, 252, 1)',
                                                                    },
                                                                },
                                                                '&+.MuiFormHelperText-root': {
                                                                    marginLeft: '0',
                                                                },
                                                            }
                                                        }}
                                                    >
                                                    {arrayWithCustomFields[activeService as keyof ArrayMapping ?? "default"]?.map((item: CustomRow) => (
                                                        <MenuItem
                                                            key={item.value}
                                                            value={item.value}
                                                            disabled={customFields.some(f => f.type === item.value)}
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
                                                        sx={{
                                                            height: '36px',
                                                        }}
                                                        InputLabelProps={{
                                                            sx: {
                                                                fontFamily: 'Nunito Sans',
                                                                fontSize: '12px',
                                                                lineHeight: '16px',
                                                                color: 'rgba(17, 17, 19, 0.60)',
                                                                top: '-5px',
                                                                '&.Mui-focused': {
                                                                    color: 'rgba(56, 152, 252, 1)',
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
                                                                    borderColor: 'rgba(56, 152, 252, 1)',
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
                                        {(customFields.length !== 0) &&
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mr: 6 }}>
                                                <Button
                                                    onClick={handleAddField}
                                                    aria-haspopup="true"
                                                    sx={{
                                                        textTransform: 'none',
                                                        border: '1px solid rgba(56, 152, 252, 1)',
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
                                                        color: 'rgba(56, 152, 252, 1)'
                                                    }}>
                                                        Add
                                                    </Typography>
                                                </Button>
                                            </Box>
                                        }
                                    </Box>
                                </Box>
                            </TabPanel>
                        </TabContext>
                    </Box>
                    <Box sx={{ width: '100%', position: 'sticky', bottom: 0, zIndex: 9999 }}>
                        <Box sx={{ zIndex: 1302, backgroundColor: '#fff', borderTop: '1px solid #e4e4e4' }}>
                            <Box
                                sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, p: 2 }}
                            >
                                <Button
                                    variant="contained"
                                    onClick={handleClosePopup}
                                    className='second-sub-title'
                                    sx={{
                                        color: "rgba(56, 152, 252, 1) !important",
                                        backgroundColor: '#fff',
                                        border: ' 1px solid rgba(56, 152, 252, 1)',
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
                                        backgroundColor: "rgba(56, 152, 252, 1)",
                                        color: 'rgba(255, 255, 255, 1) !important',
                                        textTransform: "none",
                                        padding: "0.75em 2.5em",
                                        '&:hover': {
                                            backgroundColor: 'rgba(56, 152, 252, 1)'
                                        }
                                    }}
                                >
                                    {(value === "3" && !contactSyncTab) || value === "4"
                                        ? isDownloadAction
                                            ? "Download"
                                            : "Sync"
                                        : "Next"
                                    }
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Drawer>



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
                fromAudience={true}
                open={openMailchimpConnect}
                handleClose={handleOpenMailchimpConnectClose}
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'Mailchimp')?.access_token} />
            <HubspotIntegrationPopup
                fromAudience={true}
                open={createHubspot}
                handleClose={handleCreateHubspotClose}
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 'hubspot')?.access_token} />
            <MetaConnectButton
                open={metaConnectApp}
                onClose={handleCloseMetaConnectApp}
                onSave={handleSaveSettings} />
            <S3Connect
                fromAudience={true}
                open={openS3Connect}
                handleClose={handleCreateS3Close}
                initApiKey={integrationsCredentials.find(integartion => integartion.service_name === 's3')?.access_token}
                invalid_api_key={isInvalidApiKey} boxShadow="rgba(0, 0, 0, 0.01)"
            />

            <UpgradePlanPopup open={upgradePlanPopup} limitName={'domain'} handleClose={() => setUpgradePlanPopup(false)} />
        </>
    );
};

export default CreateSyncPopup;