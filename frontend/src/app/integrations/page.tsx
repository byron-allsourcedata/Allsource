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
import { showToast, showErrorToast } from "../../components/ToastNotification";
import FacebookLoginForm from "@/components/MetaButton";
const Sidebar = dynamic(() => import('../../components/Sidebar'), {
    suspense: true,
});
interface IntegrationService {
    id: number;
    service_name: string;
    image_url: string;
    fields?: any[];
}

interface Credential {
    id: number;
    shop_domain?: string;
    access_token?: string;
    data_center?: string,
    service_name: string;
}

interface SliderIntegrationProps {
    credential: Credential | null;
    service: IntegrationService;
    open: boolean;
    onClose: () => void;
    onSave: (updatedCredential: Credential) => void;
    onDelete: (service_name: string) => void;
}

const SliderIntegration = ({ credential, service, open, onClose, onSave, onDelete }: SliderIntegrationProps) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const { setShowSlider } = useSlider();
    const [openModal, setOpenModal] = useState(false);
    const fields = service.fields || [];

    useEffect(() => {
        if (credential) {
            setFormData({
                shop_domain: credential.shop_domain || '',
                access_token: credential.access_token || '',
                data_center: credential.data_center || ''
            });
        } else {
            setFormData({});
        }
    }, [credential]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSave = async () => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) return;

        const body: Record<string, any> = {
            [service.service_name]: {
                ...formData,
            },
        };

        try {
            const response = await axiosInstance.post(`/integrations/`, body, {
                params: {
                    service_name: service.service_name,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                onClose();
                setShowSlider(false);
                const newCredential: Credential = {
                    id: -1,
                    shop_domain: formData.shop_domain || '',
                    access_token: formData.access_token || '',
                    data_center: formData.access_token || '',
                    service_name: service.service_name,
                };
                onSave(newCredential);
                showToast('Successuly installed')
                
            }
        } catch (error) {
            showErrorToast('You credential not valid')
        }
    };

    const handleClose = () => {
        setShowSlider(false);
        onClose();
    };

    const handleDelete = async () => {
        const accessToken = localStorage.getItem('token');
        if (!accessToken) return;

        try {
            const response = await axiosInstance.delete(`/integrations/`, {
                params: {
                    service_name: service.service_name,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                onClose();
                setShowSlider(false);
                setOpenModal(false);
                onDelete(service.service_name);
            }
        } catch (error) {
            console.error("Error deleting integration", error);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="h6" component="p">{service.service_name}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            <IconButton onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 4, width: '100%' }}>
                        {fields.map((field: any) => (
                            <TextField
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                            />
                        ))}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button onClick={() => setOpenModal(true)} variant="outlined" color="error" sx={{ mt: 2 }}>Delete</Button>
                            <Button onClick={handleSave} variant="contained" color="primary" sx={{ mt: 2 }}>
                                Save
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
            <Modal
                sx={{ zIndex: 1302 }}
                open={openModal}
                onClose={() => setOpenModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={integrationsStyle.modal}>
                    <Typography textAlign={'center'} id="modal-modal-title" variant="h6" component="h2">
                        Are you sure you want to delete this integration?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={handleDelete} variant="outlined" color="error" sx={{ mt: 2 }}>Delete</Button>
                        <Button onClick={() => setOpenModal(false)} variant="contained" color="primary" sx={{ mt: 2 }}>
                            Discard
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

const ServiceIntegrations = ({ service }: { service: IntegrationService[] }) => {
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
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

    const handleServiceClick = (service: IntegrationService) => {
        setSelectedService(service);
        const matchedCredential = credentials.find(credential => credential.service_name === service.service_name);
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
                        <Box key={srv.id} onClick={() => handleServiceClick(srv)} sx={{
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
            {selectedService && (
                <>
                    <SliderIntegration
                        credential={selectedCredential}
                        service={selectedService}
                        open={openModal}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        onDelete={handleDelete}
                    />
                </>
            )}
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
                const response = await axiosInstance.get('/integrations/', {
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
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4" component="h1" sx={integrationsStyle.title}>
                Integrations
            </Typography>
        </Box>
        <ServiceIntegrations service={integrationsService} />
        </>
    );
};

const IntegrationsPage = () => {
    return ( 
        <SliderProvider>
            <Integrations />
        </SliderProvider>
     );
}
 
export default IntegrationsPage;
