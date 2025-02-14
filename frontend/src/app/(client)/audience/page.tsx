"use client";
import { Box, Typography, Tabs, Tab, Button } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { audienceStyles } from "./audienceStyles";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";
import { useNotification } from '../../../context/NotificationContext';
import { showErrorToast } from "@/components/ToastNotification";
import AIAudience from "./AIAudience"
import AudiencePopup from "./AudienceSyncSlider";



const Audience: React.FC = () => {
    const { hasNotification } = useNotification();
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };
    const [loading, setLoading] = useState(false)
    const [showAIAudience, setShowAIAudience] = useState(false);
    const [openAudienceSyncPopup, setOpenAudienceSyncPopup] = useState(true);

    const handleClosePopup = () => {
        setOpenAudienceSyncPopup(false);
    };





    if (loading) {
        return <CustomizedProgressBar />;
    }

    return (
        <Box sx={audienceStyles.mainContent}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'fixed', top: hasNotification ? '7.05rem' : '4.25rem', pt: '20px', pb: '16px', left: '9.1rem', zIndex: 1200, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', ml: 0, "@media (max-width: 900px)": { left: 0, zIndex: 50 }, "@media (max-width: 600px)": { flexDirection: 'column', pl: '1.5rem', display: 'flex', alignItems: 'flex-start', zIndex: 50, width: '97%' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 50, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', } }}>
                {showAIAudience ? (
                    <AIAudience onBack={() => setShowAIAudience(false)} />
                ) : (
                    <Box sx={{ flexShrink: 0, display: 'flex', ml: '2rem', pr: '2rem', flexDirection: 'column', width: '90%', gap: 1, "@media (max-width: 600px)": { mb: 2 }, "@media (max-width: 440px)": { mb: 1 }, }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', }}>
                                <Button
                                    onClick={() => setShowAIAudience(true)}
                                    sx={{
                                        textTransform: 'none',
                                        alignItems: 'start',
                                        border: '1px solid rgba(235, 235, 235, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
                                        padding:0
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '20px', alignItems: 'start', maxWidth: '252px', }}>
                                        <Image src={'ai-icon.svg'} alt="ai icon" width={40} height={40} />
                                        <Typography className="second-sub-title" sx={{ fontWeight: '700 !important', pt: '20px' }}>
                                            AI Audience
                                        </Typography>
                                        <Typography className="table-data" sx={{ textAlign: 'left', pt: '6px' }}>
                                            Leverage Maximiz AI to deliver high-intent lookalikes from your data
                                        </Typography>
                                    </Box>
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(235, 235, 235, 0.4)', }}>
                                <Button
                                    disabled={true}
                                    sx={{
                                        textTransform: 'none',
                                        alignItems: 'start',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
                                        padding:0,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', paddingTop: '0.5rem', paddingRight: '0.5rem', paddingBottom: '1.25rem',  paddingLeft: '1.25rem', alignItems: 'start', maxWidth: '252px', }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', }}>
                                            <Box sx={{display: 'flex', width:'100%', alignItems: 'end', pt:'0.65rem', opacity: 0.65,}}>
                                                <Image src={'ai-search-icon.svg'} alt="ai icon" width={40} height={40} />
                                            </Box>
                                            <Box sx={{display: 'flex', width: '100%', alignItems: 'start', justifyContent: 'end'}}>
                                            <Typography className="second-sub-title" sx={{ fontWeight: '600 !important', fontSize: '12px !important', backgroundColor: 'rgba(234, 248, 221, 1)', color: 'rgba(43, 91, 0, 1) !important', padding: '4px', borderRadius: '4px' }}> Coming soon </Typography>
                                            </Box>
                                            
                                        </Box>

                                        <Typography className="second-sub-title" sx={{ fontWeight: '700 !important', pt: '20px', opacity: 0.65, }}>
                                            AI Search
                                        </Typography>
                                        <Typography className="table-data" sx={{ textAlign: 'left', pt: '6px', opacity: 0.65, }}>
                                            Prompt Our AI and Discover the Ideal Audience for Your Needs
                                        </Typography>
                                    </Box>
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{ pt: '2rem', pr: '32px' }}>
                            <Box sx={{ pb: '1.5rem' }}>
                                <Typography className="second-sub-title">
                                    Sync Audience
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    all: 'unset',
                                    border: '1px solid rgba(235, 235, 235, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3.75rem 16.625rem' }}>
                                    <Typography className="second-sub-title" sx={{ fontWeight: '700 !important', fontSize: '24px !important' }}>
                                        Get Started with Your First Audience
                                    </Typography>
                                    <Typography className="table-data" sx={{ textAlign: 'center', pt: '18px' }}>
                                        Supercharge your ad campaigns with high-performing lookalikes. Target those most likely to purchase, <br />
                                        optimize your ad spend, and scale your profitability like never before.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
            <AudiencePopup open={openAudienceSyncPopup} onClose={handleClosePopup} />

        </Box>
    );
};

const AudiencePage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <Audience />
        </Suspense>
    );
};

export default AudiencePage;
