"use client";
import { Box, Typography, Tabs, Tab, Button } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { suppressionsStyle } from './suppressions';
import CollectionRules from "@/components/SuppressionsCollectingRules";
import SuppressionRules from "@/components/SuppressionsRules";
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";

const centerContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(235, 235, 235, 1)',
    borderRadius: 2,
    padding: 3,
    boxSizing: 'border-box',
    width: '100%',
    textAlign: 'center',
    flex: 1,
    '& img': {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%'
    }
};




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
            {value === index && <Box sx={{ pt: 3, margin: 0, pl:'7rem', pr: '7rem', '@media (max-width: 900px)' :{pl:3, pr:3}, '@media (max-width: 700px)' :{pl:2, pr:2} }}>{children}</Box>}
        </div>
    );
};

const Suppressions: React.FC = () => {
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('');

    const installPixel = () => {
        router.push('/dashboard');
    };

    const checkPixel = async () => {
        try {
            const response = await axiosInstance.get('/check-user-authorization');
            if (response.data.status === "NEED_BOOK_CALL") {
                sessionStorage?.setItem("is_slider_opened", "true");
            }
        }
        catch (error) {
            if (error instanceof AxiosError && error.response?.status === 403) {
                if (error.response.data.status === 'PIXEL_INSTALLATION_NEEDED') {
                    setStatus(error.response.data.status);
                }
                console.log(error.response)
            } else {
                console.error('Error fetching data:', error);
            }
        } finally {
            setLoading(false)
        }

    }
    useEffect(() => {
        checkPixel()
    }, [])

    if (loading) {
        return <CustomizedProgressBar />;
    }

    return (
        <Box sx={suppressionsStyle.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', mt: 1, ml: 0, "@media (max-width: 600px)": { flexDirection: 'column', display: 'flex', alignItems: 'flex-start' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: 8, justifyContent: 'flex-start' } }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', width: '10%', gap: 1, "@media (max-width: 600px)": { mb: 2 } }}>
                    <Typography className="first-sub-title">Suppressions</Typography>
                    <CustomTooltip title={"Suppressions help manage and filter out contacts or data points that should not receive communications or updates."} linkText="Learn more" linkUrl="https://maximiz.ai" />
                </Box>
                        {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                            <Box sx={centerContainerStyles}>
                                <Typography variant="h5" className='first-sub-title' sx={{
                                    mb: 3,
                                    fontFamily: "Nunito",
                                    fontSize: "20px",
                                    color: "#4a4a4a",
                                    fontWeight: "600",
                                    lineHeight: "28px"
                                }}>
                                    Pixel Integration isn&apos;t completed yet!
                                </Typography>
                                <Image src='/pixel_installation_needed.svg' alt='Need Pixel Install'
                                    height={250} width={300} />
                                <Typography variant="body1" className='table-data' sx={{
                                    mt: 3,
                                    fontFamily: "Nunito",
                                    fontSize: "14px",
                                    color: "#808080",
                                    fontWeight: "600",
                                    lineHeight: "20px"
                                }}>
                                    Install the pixel to unlock and gain valuable insights! Start viewing your leads now
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={installPixel}
                                    className='second-sub-title'
                                    sx={{
                                        backgroundColor: 'rgba(80, 82, 178, 1)',
                                        textTransform: 'none',
                                        padding: '10px 24px',
                                        mt: 3,
                                        color: '#fff !important',
                                        ':hover': {
                                            backgroundColor: 'rgba(80, 82, 178, 1)'
                                        }
                                    }}
                                >
                                    Setup Pixel
                                </Button>
                            </Box>
                        ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '90%', pr: '10%', alignItems: 'center', "@media (max-width: 600px)": { width: '97%', pr: '0', } }}>
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
                            "@media (max-width: 600px)": {
                                border: '1px solid rgba(228, 228, 228, 1)', borderRadius: '4px', width: '100%', '& .MuiTabs-indicator': {
                                    height: '0',
                                },
                            }
                        }}
                        aria-label="suppression tabs"
                    >
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                pb: '10px',
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
                                "@media (max-width: 600px)": {
                                    mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                        backgroundColor: 'rgba(249, 249, 253, 1)',
                                        border: '1px solid rgba(220, 220, 239, 1)'
                                    },
                                }
                            }}
                            label="Suppression Rules"
                        />
                        <Tab className="main-text"
                            sx={{
                                textTransform: 'none',
                                padding: '4px 10px',
                                minHeight: 'auto',
                                flexGrow: 1,
                                pb: '10px',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: '19.1px',
                                minWidth: 'auto',
                                '&.Mui-selected': {
                                    color: 'rgba(80, 82, 178, 1)'
                                },
                                "@media (max-width: 600px)": {
                                    mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                        backgroundColor: 'rgba(249, 249, 253, 1)',
                                        border: '1px solid rgba(220, 220, 239, 1)'
                                    },
                                }
                            }}
                            label="Collection Rules"
                        />
                    </Tabs>
                </Box>
                )}
            </Box> 
            <Box sx={{ width: '100%' }}>
                <TabPanel value={tabIndex} index={0}>
                    <SuppressionRules />
                </TabPanel>
            </Box>
            <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                <TabPanel value={tabIndex} index={1}>
                    <CollectionRules />
                </TabPanel>
            </Box>
        </Box>
    );
};

const SuppressionsPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <Suppressions />
        </Suspense>
    );
};

export default SuppressionsPage;
