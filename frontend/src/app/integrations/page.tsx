'use client';


import React, { useState, useEffect } from "react";
import { integrationsStyle } from "./integrationsStyle";
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { Box, Button, Typography, Tab, TextField, InputAdornment } from "@mui/material";
import Image from "next/image";
import CustomTooltip from "@/components/customToolTip";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import { useRouter } from 'next/navigation';
import { AxiosError } from "axios";
import Slider from '../../components/Slider';
import { SliderProvider } from "@/context/SliderContext";

interface IntegrationBoxProps {
    image: string;
    onClick: () => void;
    service_name: string;
    active?: boolean;
    is_avalible?: boolean
}

interface IntegrationCredentials {
    access_token: string;
    service_name: string;
    shop_domain: string;
    ad_accout_id: string;
    is_with_suppresions: boolean;
}

const integrationStyle = {
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
};

const IntegrationBox = ({ image, onClick, service_name, active, is_avalible }: IntegrationBoxProps) => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
        }}>
            <Box sx={{
                backgroundColor: active ? 'rgba(80, 82, 178, 0.1)' : 'transparent',
                border: active ? '1px solid #5052B2' : '1px solid #E4E4E4',
                position: 'relative',
                display: 'flex',
                borderRadius: '4px',
                width: '7rem',
                height: '7rem',
                justifyContent: 'center',
                alignItems: 'center',
                transition: '0.2s',
                '&:hover': {
                    boxShadow: '0 0 4px #00000040'
                },
                '&:hover .edit-icon': {
                    opacity: 1
                }
            }}>
                {!is_avalible && (
                    <Box className="edit-icon" sx={{
                        position: 'absolute',
                        top: '5%',
                        right: '5%',
                        opacity: 0,  
                        transition: 'opacity 0.2s',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        width: '2rem', 
                        height: '2rem', 
                        '&:hover': {
                            backgroundColor: '#EDEEF7' 
                        }
                    }}>
                        <Image
                            src={'/pen.svg'}
                            width={12}
                            height={12}
                            alt={'edit'}
                        />
                    </Box>
                )}
                <Image src={image} width={32} height={32} alt={service_name} />
            </Box>
            <Typography mt={0.5} fontSize={'0.9rem'} textAlign={'center'} fontFamily={'Nunito Sans'}>
                {service_name}
            </Typography>
        </Box>
    );
};

const IntegrationAdd = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
        <Box sx={{
            border: '1px dashed #5052B2',
            display: 'flex',
            borderRadius: '4px',
            width: '7rem',
            height: '7rem',
            justifyContent: 'center',
            alignItems: 'center',
            transition: '0.2s',
            '&:hover': { boxShadow: '0 0 4px #00000040' }
        }}>
            <Image src={'/add-square.svg'} width={44} height={44} alt={'add'} />
        </Box>
    </Box>
);

interface IntegrationsListProps {
    integrations: IntegrationCredentials[];
    changeTab?: (value: string) => void
}

const UserIntegrationsList = ({ integrations, changeTab }: IntegrationsListProps) => {
    const [activeService, setActiveService] = useState<string | null>(null);
    
    const handleActive = (service: string) => {
        setActiveService(service);
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            {integrations.some(integration => integration.service_name === "Shopify") && (
                <Box onClick={() => handleActive('shopify')}>
                    <IntegrationBox
                        image="/shopify-icon.svg"
                        service_name="Shopify"
                        active={activeService === 'shopify'}
                        onClick={() => { }}
                    />
                </Box>
            )}
            {integrations.some(integration => integration.service_name === "Klaviyo") && (
                <Box onClick={() => handleActive('klaviyo')}>
                    <IntegrationBox
                        image="/klaviyo.svg"
                        service_name="Klaviyo"
                        active={activeService === 'klaviyo'}
                        onClick={() => { }}
                    />
                </Box>
            )}
            {integrations.some(integration => integration.service_name === "Meta") && (
                <Box onClick={() => handleActive('meta')}>
                    <IntegrationBox
                        image="/meta-icon.svg"
                        service_name="Meta"
                        active={activeService === 'meta'}
                        onClick={() => { }}
                    />
                </Box>
            )}
            <Box onClick={() => changeTab('2')}>
                <IntegrationAdd />
            </Box>
        </Box>
    );
};

const IntegrationsAvailable = ({ integrations }: IntegrationsListProps) => {
    const [search, setSearch] = useState<string>('');
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    const integrationsAvailable = [
        { image: 'shopify-icon.svg', service_name: 'Shopify' },
        { image: 'klaviyo.svg', service_name: 'Klaviyo' },
        { image: 'meta-icon.svg', service_name: 'Meta' },
    ];

    const filteredIntegrations = integrationsAvailable.filter(
        (integrationAvailable) =>
            integrationAvailable.service_name.toLowerCase().includes(search.toLowerCase()) &&
            !integrations.some(integration => integration.service_name === integrationAvailable.service_name)
    );

    return (
        <Box>
            <Box sx={{ width: '40%', }}>
                <TextField
                    fullWidth
                    placeholder="Search integrations"
                    value={search}
                    onChange={handleSearch}
                    id="outlined-start-adornment"
                    sx={{ mb: 3.75}}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Image src="/ic_round-search.svg" width={24} height={24} alt="search" />
                            </InputAdornment>
                        ),
                    }}
                    variant="outlined"
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                {filteredIntegrations.map((integrationAvailable) => (
                    <Box key={integrationAvailable.service_name}>
                        <IntegrationBox
                            image={integrationAvailable.image}
                            service_name={integrationAvailable.service_name}
                            is_avalible={true}
                            onClick={() => { }}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const Integrations = () => {
    const [value, setValue] = useState('1');
    const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationCredentials[]>([]);
    const [status, setStatus] = useState<string>('');
    const router = useRouter();
    const [showSlider, setShowSlider] = useState(false);
    
    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    const installPixel = () => {
        router.push('/dashboard');
    };

    const centerContainerStyles = {
        mt: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid rgba(235, 235, 235, 1)',
        borderRadius: 2,
        padding: 3,
        width: '100%',
        textAlign: 'center',
        flex: 1,
        fontFamily: 'Nunito Sans'
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosInstance.get('/integrations/credentials/');
                if (response.status === 200) {
                    setIntegrationsCredentials(response.data);
                }
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 403) {
                    if (error.response.data.detail.status === 'NEED_BOOK_CALL') {
                        sessionStorage.setItem('is_slider_opened', 'true');
                        setShowSlider(true);
                    } else if (error.response.data.detail.status === 'PIXEL_INSTALLATION_NEEDED') {
                        setStatus('PIXEL_INSTALLATION_NEEDED');
                    } else {
                        setShowSlider(false);
                    }
                }
            }
        };
        fetchData();
    }, []);

    const changeTab = (value: string) => {
        setValue(value)
    }

    return (
        <>
            <TabContext value={value}>
                <Box sx={{
                    mt: '1rem',
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    "@media (max-width: 600px)": { mb: 2 },
                }}>
                    {/* Title and Tooltip */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1}}>
                        <Typography
                            className="first-sub-title"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "16px",
                                lineHeight: "normal",
                                fontWeight: 600,
                                color: "#202124",
                            }}
                        >
                            Integrations
                        </Typography>
                        <CustomTooltip
                            title={"Connect your favourite tools to automate tasks and ensure all your data is accessible in one place."}
                            linkText="Learn more"
                            linkUrl="https://maximiz.ai"
                        />
                    </Box>
                    {/* Tabs */}
                    {status !== 'PIXEL_INSTALLATION_NEEDED' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '0 auto'}}>
                            <TabList
                                centered
                                aria-label="Integrations Tabs"
                                TabIndicatorProps={{ sx: { backgroundColor: "#5052b2" } }}
                                sx={{
                                    width: 'fit-content',
                                    "& .MuiTabs-flexContainer": {
                                        justifyContent: 'center',
                                        "@media (max-width: 600px)": { gap: '16px' }
                                    }
                                }}
                                onChange={handleTabChange}
                            >
                                <Tab label="Your Integration" value="1" sx={{ ...integrationStyle.tabHeading }} />
                                <Tab label="Available Integrations" value="2" sx={{ ...integrationStyle.tabHeading }} />
                                <Tab label="Pixel Management" value="3" sx={{ ...integrationStyle.tabHeading }} />
                            </TabList>
                        </Box>
                    )}  
                </Box>
                <Box sx={{
                    border: '1px solid #E4E4E4',
                    mt: 2.5
                }}></Box>
                {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                    <Box sx={centerContainerStyles}>
                        <Typography variant="h5" sx={{ mb: 2, fontSize: '0.9rem' }}>
                            Pixel Integration isn't completed yet!
                        </Typography>
                        <Image src={'/pixel_installation_needed.svg'} width={300} height={241} alt="pixel installed needed"/>
                        <Typography sx={{ mb: 3, color: '#808080', fontSize: '0.8rem', mt: 3 }}>
                            Install the pixel to unlock and gain valuable insights! Start viewing your leads now
                        </Typography>
                        <Button onClick={installPixel} variant="contained" sx={{
                            backgroundColor: '#5052B2',
                            fontFamily: "Nunito Sans",
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '20px',
                            letterSpacing: 'normal',
                            color: "#fff",
                            textTransform: 'none',
                            padding: '10px 24px',
                            boxShadow:'0px 1px 2px 0px rgba(0, 0, 0, 0.25)',
                            '&:hover': {
                                backgroundColor: '#5052B2'
                            },
                            borderRadius: '4px',
                        }}>
                            Setup Pixel
                        </Button>
                    </Box>
                ) : (
                    <>
                        <TabPanel value="1" sx={{ px: 0 }}>
                            <UserIntegrationsList integrations={integrationsCredentials} changeTab={changeTab} />
                        </TabPanel>
                        <TabPanel value="2" sx={{ px: 0 }}>
                            <IntegrationsAvailable integrations={integrationsCredentials} />
                        </TabPanel>
                        <TabPanel value="3" sx={{ px: 0 }}>
                            <Typography>Pixel Management content goes here.</Typography>
                        </TabPanel>
                    </>
                )}
            </TabContext>
            {showSlider && <Slider/>}
        </>
    );
};

const IntegraitonsPage = () => {
    return (
        <SliderProvider>
            <Integrations />
        </SliderProvider>
    )
}

export default IntegraitonsPage;
