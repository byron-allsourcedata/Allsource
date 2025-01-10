"use client";
import { Box, Typography, Tabs, Tab, Button } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { partnersStyle } from './partnersStyles';
import CollectionRules from "@/components/SuppressionsCollectingRules";
import SuppressionRules from "@/components/SuppressionsRules";
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";
import { useNotification } from '../../../context/NotificationContext';
import ReferralOverview from "@/components/ReferralOverview";
import PartnersAccounts from "@/components/PartnersAccounts";
import ReferralRewards from "@/components/ReferralRewards";
import PartnersAssets from "@/components/PartnersAssets"

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

    return (
        <Box sx={partnersStyle.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'fixed', top: hasNotification ? '7.05rem' : '4.25rem', pt: '12px', pb: '16px', left: '9.1rem', pl: '2rem', zIndex: 1200, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', ml: 0, "@media (max-width: 900px)": { left: 0, zIndex: 50 }, "@media (max-width: 600px)": { flexDirection: 'column', pl: '1.5rem', display: 'flex', alignItems: 'flex-start', zIndex: 50, width: '97%' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 50, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', } }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', width: '10%', gap: 1, "@media (max-width: 600px)": { mb: 2 }, "@media (max-width: 440px)": { mb: 1 }, }}>
                    <Typography className="first-sub-title">Partners</Typography>
                    <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}><CustomTooltip title={"Collaborate with trusted partners to access exclusive resources and services that drive success."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" /></Box>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '90%', pr: '20%', alignItems: 'center', "@media (max-width: 900px)": { pr: 0 }, "@media (max-width: 600px)": { width: '97%', pr: '0' } }}>
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
                                label="Accounts"
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
                                label="Assets"
                            />

                    </Tabs>
                </Box>

            </Box>
                <Box sx={{ width: '100%', padding: 0, "@media (max-width: 600px)": { mt: '4.5rem' }, "@media (max-width: 440px)": { mt: '7.5rem' }, }}>
                    <TabPanel value={tabIndex} index={0}>
                        <ReferralOverview />
                    </TabPanel>
                </Box>
                <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                    <TabPanel value={tabIndex} index={1}>
                        <PartnersAccounts loading={false} setLoading={() => {}} />

                    </TabPanel>
                </Box>
                <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                    <TabPanel value={tabIndex} index={2}>
                        <ReferralRewards />
                    </TabPanel>
                </Box>
                <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                    <TabPanel value={tabIndex} index={3}>
                        <PartnersAssets />
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
