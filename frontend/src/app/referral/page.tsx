"use client";
import { Box, Typography, Tabs, Tab, Button } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { referralStyle } from './referralStyles';
import CollectionRules from "@/components/SuppressionsCollectingRules";
import SuppressionRules from "@/components/SuppressionsRules";
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";
import { useNotification } from '../../context/NotificationContext';
import ReferralOverview from "@/components/ReferralOverview";

const centerContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(235, 235, 235, 1)',
    borderRadius: 2,
    padding: 3,
    boxSizing: 'border-box',
    mt: 10,
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
            {value === index && <Box sx={{ pt: 3, margin: 0, '@media (max-width: 900px)': { pl: 3, pr: 3 }, '@media (max-width: 700px)': { pl: 1, pr: 1 } }}>{children}</Box>}
        </div>
    );
};

const Suppressions: React.FC = () => {
    const { hasNotification } = useNotification();
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
        <Box sx={referralStyle.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'fixed', top: hasNotification ? '7.05rem' : '4.5rem', pt:'20px', pb:'12px', left: '9.1rem', pl: '2rem', zIndex: 1200, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', ml: 0, "@media (max-width: 900px)": { left: 0, top: '5rem', zIndex: 50 },  "@media (max-width: 600px)": { flexDirection: 'column', pl: '1.5rem', display: 'flex', alignItems: 'flex-start', zIndex: 50 }, "@media (max-width: 440px)": { flexDirection: 'column', pt: 0, zIndex: 50, justifyContent: 'flex-start' } }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start',  width: '100%', gap: 1, "@media (max-width: 600px)": { mb: 1 } }}>
                    <Typography className="first-sub-title">Referral</Typography>
                    <CustomTooltip title={"Our Referral program rewards you for bringing new users to our platform. Share your unique referral link with friends and colleagues, and earn incentives for each successful sign-up."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" />
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'start', width: '100%', alignItems: 'center', pt: 2, "@media (max-width: 900px)": { pr: 0 }, "@media (max-width: 600px)": { width: '97%', pr: '0' } }}>
                    {status === 'PIXEL_INSTALLATION_NEEDED' ? '' : (
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
                                    padding: '4px 1px',
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
                                label="Overview"
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
                                label="Signups"
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
                                label="Rewards"
                            />
                        </Tabs>
                    )}
                </Box>

            </Box>
            {status === 'PIXEL_INSTALLATION_NEEDED' ? (
                <Box sx={centerContainerStyles}>
                    <Typography variant="h5" className='first-sub-title' sx={{
                        mb: 3,
                        fontFamily: "Nunito Sans",
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
                        fontFamily: "Nunito Sans",
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
                <>
                    <Box sx={{ width: '100%', mt: '2.5rem', padding: 0, "@media (max-width: 600px)": { mt: '4.5rem' }, "@media (max-width: 440px)": { mt: '7.5rem' }, }}>
                        <TabPanel value={tabIndex} index={0}>
                           <ReferralOverview />
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={1}>
                            
                        </TabPanel>
                    </Box>
                </>)}
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
