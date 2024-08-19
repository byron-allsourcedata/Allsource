'use client';
import React, { useState, useEffect } from "react";
import { integrationsStyle } from "./integrationsStyle";
import { useRouter } from "next/navigation";
import axiosInstance from '../../axios/axiosInterceptorInstance';
import { Box, Button, Grid, Typography, TextField, Backdrop, Drawer, IconButton, Modal } from "@mui/material";
import Image from "next/image";
import PersonIcon from '@mui/icons-material/Person';
import AccountButton from "@/components/AccountButton";
import dynamic from "next/dynamic";
import { useSlider, SliderProvider } from '../../context/SliderContext';
import CloseIcon from '@mui/icons-material/Close';

const Sidebar = dynamic(() => import('../../components/Sidebar'), {
    suspense: true,
});

interface IntegrationService {
    id: number;
    service_name: string;
    image_url: string;
}

interface Credential {
    id: number;
    shop_domain: string;
    access_token: string | null;
    service_name: string;
}


interface SliderIntegrationProps {
    credential: Credential | null;
    service_name: string;
    open: boolean;
    onClose: () => void;
    onSave: (updatedCredential: Credential) => void;
    onDelete: (service_name: string) => void
}

const SliderIntegration = ({ credential, service_name, open, onClose, onSave, onDelete }: SliderIntegrationProps) => {
    const [shopDomain, setShopDomain] = useState('');
    const [apiKey, setApiKey] = useState<string>('');
    const { setShowSlider } = useSlider();
    const [openModal, setOpenModal] = useState(false)
    useEffect(() => {
        if (credential) {
            setShopDomain(credential.shop_domain);
            setApiKey(credential.access_token || '');
        } else {
            setShopDomain('');
            setApiKey('');
        }
    }, [credential]);

    const handleSave = async () => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) return;

        const body = {
            [service_name]: {
                shop_domain: shopDomain,
                access_token: apiKey,
            },
        };

        try {
            const response = await axiosInstance.post(`/integrations/`, body, {
                params:{
                    service_name: service_name
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                onClose();
                setShowSlider(false);
                const newCredential: Credential = {
                    id: -1,
                    shop_domain: shopDomain,
                    access_token: apiKey,
                    service_name: service_name,
                };
                onSave(newCredential);
            }
        } catch (error) {
            console.error("Error saving integration", error);
        }
    };

    const handleClose = () => {
        setShowSlider(false);
        onClose();
    };

    const handleDelete = async() => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) return;

        try {
            const response = await axiosInstance.delete(`/integrations/`, {
                params:{
                    service_name: service_name
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                onClose();  
                setShowSlider(false);
                setOpenModal(false)
                onDelete(service_name);
                
            }
        } catch (error) {
            console.error("Error delete integration", error);
        }
    };

    return (
        <>
            <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
            <Drawer
                anchor="right"
                open={open}
                variant="persistent"
                PaperProps={{
                    sx: {
                        width: '40%',
                        position: 'fixed',
                        zIndex: 1301,
                        top: 0,
                        bottom: 0,
                        '@media (max-width: 600px)': {
                            width: '100%',
                        },
                    },
                }}
            >
                <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                        <Typography variant="h6" component="p">{service_name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    </Box>
                    <Box sx={{ mt: 4, width: '100%' }}>
                        <TextField
                            label="Shop Domain"
                            value={shopDomain}
                            onChange={(e) => setShopDomain(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Access Token"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            fullWidth
                            type="password"
                            margin="normal"
                        />
                        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                            <Button onClick={() => setOpenModal(true)} variant="outlined" color="error" sx={{ mt: 2 }}>Delete</Button>
                            <Button onClick={handleSave} variant="contained" color="primary" sx={{ mt: 2 }}>
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
            <Modal
                sx={{zIndex: 1302,}}
                open={openModal}
                onClose={() => setOpenModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                >
                <Box sx={integrationsStyle.modal}>
                    <Typography textAlign={'center'} id="modal-modal-title" variant="h6" component="h2">
                        You already want delete this integration
                    </Typography>
                    <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                        <Button onClick={() => handleDelete()} variant="outlined" color="error" sx={{ mt: 2 }}>Delete</Button>
                        <Button onClick={() => setOpenModal(false)} variant="contained" color="primary" sx={{ mt: 2 }}>
                            Discrad
                        </Button>
                    </Box>
                </Box>
                </Modal>
        </>
    );
};

const ServiceIntegrations = ({ service }: { service: IntegrationService[] }) => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);

    useEffect(() => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) return;

        const fetchData = async () => {
            try {
                const response = await axiosInstance.get('/integrations/credentials', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (response.status === 200) {
                    setCredentials(response.data);
                }
            } catch (error) {
                console.error("Error fetching credentials", error);
            }
        };
        fetchData();
    }, []);

    const handleServiceClick = (service_name: string) => {
        setSelectedService(service_name);
        const matchedCredential = credentials.find(credential => credential.service_name === service_name);
        setSelectedCredential(matchedCredential || null);
        setOpenModal(true);
    };

    const handleCloseModal = () => setOpenModal(false);

    const handleSave = (updatedCredential: Credential) => {
        setCredentials(prevCredentials => {
            const existingCredentialIndex = prevCredentials.findIndex(cred => cred.service_name === updatedCredential.service_name);
            if (existingCredentialIndex > -1) {
                const updatedCredentials = [...prevCredentials];
                updatedCredentials[existingCredentialIndex] = updatedCredential;
                return updatedCredentials;
            }
            return [...prevCredentials, updatedCredential];
        });
    };

    const handleDelete = (service_name: string) => {
        setCredentials(prevCredentials => {
            const indexToDelete = prevCredentials.findIndex(cred => cred.service_name === service_name);
            
            if (indexToDelete > -1) {
                const updatedCredentials = prevCredentials.filter((_, index) => index !== indexToDelete);
                return updatedCredentials;
            }
            return prevCredentials;
        });
    };
    

    return (
        <>
            <Box sx={integrationsStyle.service}>
                {service.map(srv => {
                    const matchedCredential = credentials.find(credential => credential.service_name === srv.service_name);
                    return (
                        <Box key={srv.id} onClick={() => handleServiceClick(srv.service_name)} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '16px',
                        }}>
                            <Box sx={{ ...integrationsStyle.imageServiceBox, filter: matchedCredential ? 'none' : 'grayscale(100%)' }}>
                                <Image src={srv.image_url} alt={srv.service_name} width={80} height={80} />
                            </Box>
                            <Typography component="p" sx={{ fontWeight: 'bold' }}>
                                {srv.service_name}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
            <SliderProvider>
                <SliderIntegration
                    credential={selectedCredential}
                    service_name={selectedService}
                    open={openModal}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            </SliderProvider>
        </>
    );
};

const Integrations: React.FC = () => {
    const [integrationsService, setIntegrationsService] = useState<IntegrationService[]>([]);
    const router = useRouter();

    useEffect(() => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) {
            router.push('/signin');
            return;
        }

        const fetchData = async () => {
            try {
                const response = await axiosInstance.get('/integrations', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (response.status === 200) {
                    setIntegrationsService(response.data);
                }
            } catch (error) {
                console.error("Error fetching integrations", error);
            }
        };

        fetchData();
    }, [router]);

    return (
        <>
            <Box sx={integrationsStyle.headers}>
                <Box sx={integrationsStyle.logoContainer}>
                    <Image src='/logo.svg' alt='logo' height={80} width={60} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountButton />
                    <Button>
                        <PersonIcon sx={integrationsStyle.account} />
                    </Button>
                </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Grid container width='100%'>
                    <Grid item xs={12} md={2} sx={{ padding: '0px' }}>
                        <Sidebar />
                    </Grid>
                    <Grid item xs={12} md={10} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h4" component="h1" sx={integrationsStyle.title}>
                                Integrations
                            </Typography>
                        </Box>
                        <ServiceIntegrations service={integrationsService} />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};

export default Integrations;
