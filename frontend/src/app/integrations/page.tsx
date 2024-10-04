// 'use client';
// import React, { useState, useEffect } from "react";
// import { integrationsStyle } from "./integrationsStyle";
// import { useRouter } from "next/navigation";
// import axiosInstance from '../../axios/axiosInterceptorInstance';
// import { Box, Button, Grid, Typography, TextField, Backdrop, Drawer, IconButton, Modal } from "@mui/material";
// import Image from "next/image";
// import PersonIcon from '@mui/icons-material/Person';
// import dynamic from "next/dynamic";
// import { useSlider, SliderProvider } from '../../context/SliderContext';
// import CloseIcon from '@mui/icons-material/Close';
// import { showToast, showErrorToast } from "../../components/ToastNotification";
// // import FacebookLoginForm from "@/components/MetaButton";
// const Sidebar = dynamic(() => import('../../components/Sidebar'), {
//     suspense: true,
// });
// interface IntegrationService {
//     id: number;
//     service_name: string;
//     image_url: string;
//     fields?: any[];
// }

// interface Credential {
//     id: number;
//     shop_domain?: string;
//     access_token?: string;
//     data_center?: string,
//     service_name: string;
// }

// interface SliderIntegrationProps {
//     credential: Credential | null;
//     service: IntegrationService;
//     open: boolean;
//     onClose: () => void;
//     onSave: (updatedCredential: Credential) => void;
//     onDelete: (service_name: string) => void;
// }

// const SliderIntegration = ({ credential, service, open, onClose, onSave, onDelete }: SliderIntegrationProps) => {
//     const [formData, setFormData] = useState<Record<string, string>>({});
//     const { setShowSlider } = useSlider();
//     const [openModal, setOpenModal] = useState(false);
//     const fields = service.fields || [];

//     useEffect(() => {
//         if (credential) {
//             setFormData({
//                 shop_domain: credential.shop_domain || '',
//                 access_token: credential.access_token || '',
//                 data_center: credential.data_center || ''
//             });
//         } else {
//             setFormData({});
//         }
//     }, [credential]);

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setFormData((prevData) => ({ ...prevData, [name]: value }));
//     };

//     const handleSave = async () => {
//         const accessToken = localStorage.getItem('token');
//         if (!accessToken) return;

//         const body: Record<string, any> = {
//             [service.service_name.toLowerCase()]: {
//                 ...formData,
//             },
//         };

//         try {
//             const response = await axiosInstance.post(`/integrations/`, body, {
//                 params: {
//                     service_name: service.service_name,
//                 },
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             });

//             if (response.status === 200) {
//                 onClose();
//                 setShowSlider(false);
//                 const newCredential: Credential = {
//                     id: -1,
//                     shop_domain: formData.shop_domain || '',
//                     access_token: formData.access_token || '',
//                     data_center: formData.access_token || '',
//                     service_name: service.service_name,
//                 };
//                 onSave(newCredential);
//                 showToast('Successuly installed')
                
//             }
//         } catch (error) {
//             showErrorToast('You credential not valid')
//         }
//     };

//     const handleClose = () => {
//         setShowSlider(false);
//         onClose();
//     };

//     const handleDelete = async () => {
//         const accessToken = localStorage.getItem('token');
//         if (!accessToken) return;

//         try {
//             const response = await axiosInstance.delete(`/integrations/`, {
//                 params: {
//                     service_name: service.service_name,
//                 },
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                 },
//             });
//             if (response.status === 200) {
//                 onClose();
//                 setShowSlider(false);
//                 setOpenModal(false);
//                 onDelete(service.service_name);
//             }
//         } catch (error) {
//             console.error("Error deleting integration", error);
//         }
//     };

//     return (
//         <>
//             <Backdrop open={open} sx={{ zIndex: 1200, color: '#fff' }} />
//             <Drawer
//                 anchor="right"
//                 open={open}
//                 variant="persistent"
//                 PaperProps={{
//                     sx: {
//                         width: '40%',
//                         position: 'fixed',
//                         zIndex: 1301,
//                         top: 0,
//                         bottom: 0,
//                         '@media (max-width: 600px)': {
//                             width: '100%',
//                         },
//                     },
//                 }}
//             >
//                 <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', justifyContent: 'center' }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
//                         <Typography variant="h6" component="p">{service.service_name}</Typography>
//                         <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
//                             <IconButton onClick={handleClose}>
//                                 <CloseIcon />
//                             </IconButton>
//                         </Box>
//                     </Box>
//                     <Box sx={{ mt: 4, width: '100%' }}>
//                         {fields.map((field: any) => (
//                             <TextField
//                                 key={field.name}
//                                 label={field.label}
//                                 name={field.name}
//                                 type={field.type}
//                                 value={formData[field.name] || ''}
//                                 onChange={handleChange}
//                                 fullWidth
//                                 margin="normal"
//                             />
//                         ))}
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                             <Button onClick={() => setOpenModal(true)} variant="outlined" color="error" sx={{ mt: 2 }}>Delete</Button>
//                             <Button onClick={handleSave} variant="contained" color="primary" sx={{ mt: 2 }}>
//                                 Save
//                             </Button>
//                         </Box>
//                     </Box>
//                 </Box>
//             </Drawer>
//             <Modal
//                 sx={{ zIndex: 1302 }}
//                 open={openModal}
//                 onClose={() => setOpenModal(false)}
//                 aria-labelledby="modal-modal-title"
//                 aria-describedby="modal-modal-description"
//             >
//                 <Box sx={integrationsStyle.modal}>
//                     <Typography textAlign={'center'} id="modal-modal-title" variant="h6" component="h2">
//                         Are you sure you want to delete this integration?
//                     </Typography>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                         <Button onClick={handleDelete} variant="outlined" color="error" sx={{ mt: 2 }}>Delete</Button>
//                         <Button onClick={() => setOpenModal(false)} variant="contained" color="primary" sx={{ mt: 2 }}>
//                             Discard
//                         </Button>
//                     </Box>
//                 </Box>
//             </Modal>
//         </>
//     );
// };

// const ServiceIntegrations = ({ service }: { service: IntegrationService[] }) => {
//     const [credentials, setCredentials] = useState<Credential[]>([]);
//     const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
//     const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
//     const [openModal, setOpenModal] = useState<boolean>(false);

//     useEffect(() => {
//         const accessToken = localStorage.getItem('token');
//         if (!accessToken) return;

//         const fetchData = async () => {
//             try {
//                 const response = await axiosInstance.get('/integrations/credentials/', {
//                     headers: { Authorization: `Bearer ${accessToken}` },
//                 });
//                 if (response.status === 200) {
//                     setCredentials(response.data);
//                 }
//             } catch (error) {
//                 console.error("Error fetching credentials", error);
//             }
//         };
//         fetchData();
//     }, []);

//     const handleServiceClick = (service: IntegrationService) => {
//         setSelectedService(service);
//         const matchedCredential = credentials.find(credential => credential.service_name === service.service_name);
//         setSelectedCredential(matchedCredential || null);
//         setOpenModal(true); 
//     };

//     const handleCloseModal = () => setOpenModal(false);

//     const handleSave = (updatedCredential: Credential) => {
//         setCredentials(prevCredentials => {
//             const existingCredentialIndex = prevCredentials.findIndex(cred => cred.service_name === updatedCredential.service_name);
//             if (existingCredentialIndex > -1) {
//                 const updatedCredentials = [...prevCredentials];
//                 updatedCredentials[existingCredentialIndex] = updatedCredential;
//                 return updatedCredentials;
//             }
//             return [...prevCredentials, updatedCredential];
//         });
//     };

//     const handleDelete = (service_name: string) => {
//         setCredentials(prevCredentials => {
//             const indexToDelete = prevCredentials.findIndex(cred => cred.service_name === service_name);
            
//             if (indexToDelete > -1) {
//                 const updatedCredentials = prevCredentials.filter((_, index) => index !== indexToDelete);
//                 return updatedCredentials;
//             }
//             return prevCredentials;
//         });
//     };
    

//     return (
//         <>
//             <Box sx={integrationsStyle.service}>
//                 {service.map(srv => {
//                     const matchedCredential = credentials.find(credential => credential.service_name === srv.service_name);
//                     return (
//                         <Box key={srv.id} onClick={() => handleServiceClick(srv)} sx={{
//                             display: 'flex',
//                             flexDirection: 'column',
//                             alignItems: 'center',
//                             marginBottom: '16px',
//                         }}>
//                             <Box sx={{ ...integrationsStyle.imageServiceBox, filter: matchedCredential ? 'none' : 'grayscale(100%)' }}>
//                                 <Image src={srv.image_url} alt={srv.service_name} width={80} height={80} />
//                             </Box>
//                             <Typography component="p" sx={{ fontWeight: 'bold' }}>
//                                 {srv.service_name}
//                             </Typography>
//                         </Box>
//                     );
//                 })}
//             </Box>
//             {selectedService && (
//                 <>
//                     <SliderIntegration
//                         credential={selectedCredential}
//                         service={selectedService}
//                         open={openModal}
//                         onClose={handleCloseModal}
//                         onSave={handleSave}
//                         onDelete={handleDelete}
//                     />
//                 </>
//             )}
//         </>
//     );
// };


// const Integrations: React.FC = () => {
//     const [integrationsService, setIntegrationsService] = useState<IntegrationService[]>([]);
//     const router = useRouter();

//     useEffect(() => {
//         const accessToken = localStorage.getItem('token');
//         if (!accessToken) {
//             router.push('/signin');
//             return;
//         }

//         const fetchData = async () => {
//             try {
//                 const response = await axiosInstance.get('/integrations/', {
//                     headers: { Authorization: `Bearer ${accessToken}` },
//                 });
//                 if (response.status === 200) {
//                     setIntegrationsService(response.data);
//                 }
//             } catch (error) {
//                 console.error("Error fetching integrations", error);
//             }
//         };

//         fetchData();
//     }, [router]);

//     return (
//         <>
//         <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
//             <Typography variant="h4" component="h1" sx={integrationsStyle.title}>
//                 Integrations
//             </Typography>
//         </Box>
//         <ServiceIntegrations service={integrationsService} />
//         </>
//     );
// };

// const IntegrationsPage = () => {
//     return ( 
//         <SliderProvider>
//             <Integrations />
//         </SliderProvider>
//      );
// }
 
// export default IntegrationsPage;


"use client";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import CollectionRules from "@/components/SuppressionsCollectingRules";
import SuppressionRules from "@/components/SuppressionsRules";
import CustomTooltip from "@/components/customToolTip";


interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3, margin: 0, }}>{children}</Box>}
        </div>
    );
};

const Integrations: React.FC = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };


    return (
        <Box sx={{display:'flex',
            flexDirection: 'column',
            width: '100%',
            padding: 0,
            margin: 0,
            alignItems: 'center',
            justifyContent: 'center',
            '@media (max-width: 440px)': {
                marginTop: '-60px',
                padding: '0',
            },}}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', mt: 2, ml:2, "@media (max-width: 600px)": {flexDirection: 'column', display: 'flex', alignItems: 'flex-start'}, "@media (max-width: 440px)": {flexDirection: 'column', pt:8, justifyContent: 'flex-start'} }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', width: '0%', alignItems: 'center', gap: 1, "@media (max-width: 600px)": {mb:2 }}}>
                    <Typography className="first-sub-title">Integrations</Typography>
                    <CustomTooltip title={"Connect your favourite tools to automate tasks and ensure all your data is accessible in one place."} linkText="Learn more" linkUrl="https://maximiz.ai"/>
                </Box>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Tabs
                        value={tabIndex}
                        onChange={handleTabChange}
                        sx={{
                            textTransform: 'none',
                            minHeight: 0,
                            '& .MuiTabs-indicator': {
                                backgroundColor: 'rgba(80, 82, 178, 1)', 
                                height: '1.4px', 
                            },
                            "@media (max-width: 600px)": {border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                                height: '0',
                            },}
                        }}
                        aria-label="suppression tabs"
                    >
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                flexGrow: 1,
                                marginRight: '3em',
                                minHeight: 'auto',
                                minWidth: 'auto',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '19.1px',
                                textAlign: 'left',
                                mr: 2,
                                '&.Mui-selected': {
                                    color: 'rgba(80, 82, 178, 1)'
                                },
                                "@media (max-width: 600px)": {mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                    backgroundColor: 'rgba(249, 249, 253, 1)',
                                    border: '1px solid rgba(220, 220, 239, 1)'
                                },}
                            }}
                            label="Your Integration"
                        />
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                minHeight: 'auto',
                                flexGrow: 1,
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '19.1px',
                                minWidth: 'auto',
                                '&.Mui-selected': {
                                    color: 'rgba(80, 82, 178, 1)'
                                },
                                "@media (max-width: 600px)": {mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                    backgroundColor: 'rgba(249, 249, 253, 1)',
                                    border: '1px solid rgba(220, 220, 239, 1)'
                                },}
                            }}
                            label="Available Intagrations"
                        />
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                minHeight: 'auto',
                                flexGrow: 1,
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '19.1px',
                                minWidth: 'auto',
                                '&.Mui-selected': {
                                    color: 'rgba(80, 82, 178, 1)'
                                },
                                "@media (max-width: 600px)": {mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                    backgroundColor: 'rgba(249, 249, 253, 1)',
                                    border: '1px solid rgba(220, 220, 239, 1)'
                                },}
                            }}
                            label="Pixel Managment"
                        />
                    </Tabs>
                </Box>
            </Box>
            <Box sx={{ width: '100%' }}>
                <TabPanel value={tabIndex} index={0}>
                    {/* <SuppressionRules /> */}
                </TabPanel>
            </Box>
            <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                <TabPanel value={tabIndex} index={1}>
                    {/* <CollectionRules /> */}
                </TabPanel>
            </Box>
            <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                <TabPanel value={tabIndex} index={2}>
                    {/* <CollectionRules /> */}
                </TabPanel>
            </Box>
        </Box>
    );
};

const IntegrationsPage: React.FC = () => {
    return (
        <Integrations />
    );
};

export default IntegrationsPage;
