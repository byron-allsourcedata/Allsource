"use client";
import { Box, Typography, Tabs, Tab, Button } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { payoutsStyle } from "./payoutsStyle";
import CustomTooltip from "@/components/customToolTip";
import ProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import PayoutsOverview from "./PayoutsOverview";
import PayoutsPartners from "./PayoutsPartners";
import PayoutsMasterPartners from "./PayoutsMasterPartners";


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
            {value === index && <Box sx={{ pt: 3, margin: 0, '@media (max-width: 900px)': { pl: 3, pr: 3 }, '@media (max-width: 700px)': { pl: 1, pr: 1, pt:5 } }}>{children}</Box>}
        </div>
    );
};

const Suppressions: React.FC = () => {
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('');


    if (loading) {
        return <ProgressBar />;
    }

    return (
        <Box sx={payoutsStyle.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'fixed', top: '4.25rem', pt: '12px', pb: '16px', left: '9.1rem', pl: '1.5rem', zIndex: 1200, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', ml: 0, "@media (max-width: 900px)": { left: 0, zIndex: 50 }, "@media (max-width: 600px)": { flexDirection: 'column', pl: '1.5rem', display: 'flex', alignItems: 'flex-start', zIndex: 50, width: '97%' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: '0.75rem', zIndex: 50, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pb: '6px', } }}>
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', width: '10%', gap: 1, "@media (max-width: 600px)": { mb: 2 }, "@media (max-width: 440px)": { mb: 1 }, }}>
                    <Typography className="first-sub-title">Payouts</Typography>
                    <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}><CustomTooltip title={"Our Referral program rewards you for bringing new users to our platform. Share your unique referral link with friends and colleagues, and earn incentives for each successful sign-up."} linkText="Learn more" linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/allsource" /></Box>
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '90%', pr: '20%', alignItems: 'center', "@media (max-width: 900px)": { pr: 0 }, "@media (max-width: 600px)": { width: '97%', pr: '0' } }}>
                        <Tabs
                            value={tabIndex}
                            onChange={handleTabChange}
                            sx={{
                                textTransform: 'none',
                                minHeight: 0,
                                '& .MuiTabs-indicator': {
                                    backgroundColor: 'rgba(56, 152, 252, 1)',
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
                                        color: 'rgba(56, 152, 252, 1)'
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
                                        color: 'rgba(56, 152, 252, 1)'
                                    },
                                    "@media (max-width: 600px)": {
                                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                            backgroundColor: 'rgba(249, 249, 253, 1)',
                                            border: '1px solid rgba(220, 220, 239, 1)'
                                        },
                                    }
                                }}
                                label="Partners"
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
                                        color: 'rgba(56, 152, 252, 1)'
                                    },
                                    "@media (max-width: 600px)": {
                                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                                            backgroundColor: 'rgba(249, 249, 253, 1)',
                                            border: '1px solid rgba(220, 220, 239, 1)'
                                        },
                                    }
                                }}
                                label="Master partner"
                            />
                        </Tabs>
                </Box>

            </Box>
                <>
                    <Box sx={{ width: '100%', padding: 0, "@media (max-width: 600px)": { mt: '4.5rem' }, "@media (max-width: 440px)": { mt: '7.5rem' }, }}>
                        <TabPanel value={tabIndex} index={0}>
                            <PayoutsOverview />
                        </TabPanel>
                    </Box>
                    
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={1}>
                            <PayoutsPartners />
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={2}>
                            <PayoutsMasterPartners />
                        </TabPanel>
                    </Box>
                </>
        </Box>
    );
};

const SuppressionsPage: React.FC = () => {
    return (
        <Suspense fallback={<ProgressBar />}>
            <Suppressions />
        </Suspense>
    );
};

export default SuppressionsPage;
