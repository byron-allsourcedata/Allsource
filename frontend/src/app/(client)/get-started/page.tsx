"use client";
import { Box, Typography, Tabs, Tab, Button, Checkbox } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";
import { useNotification } from '../../../context/NotificationContext';
import { showErrorToast } from "@/components/ToastNotification";
import GettingStartedSection from '@/components/GettingStartedSection';
import { SliderProvider } from "@/context/SliderContext";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import FirstTimeScreen from "./FirstTimeScreen";
import SourcesImport from "@/app/(client)/sources/builder/page";
import { SourcesHintsProvider } from "../sources/context/SourcesHintsContext";
import {
    CardsSection,
    FirstTimeScreenCommonVariant1,
    NotificationInfoBanner,
} from "@/components/first-time-screens";
import ProgressBar from "@/components/ProgressBar";



interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
    const { hasNotification } = useNotification();
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: hasNotification ? 9 : 3, margin: 0, '@media (max-width: 900px)': { pl: 3, pr: 3 }, '@media (max-width: 700px)': { pl: 1, pr: 1 } }}>{children}</Box>}
        </div>
    );
};

const GetStarted: React.FC = () => {
    const { hasNotification } = useNotification();
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [pixelInstalled, setPixelInstalled] = useState(false);
    const [sourceImported, setSourceImported] = useState(false);
    const [pixelBannerVisible, setPixelBannerVisible] = useState(true);
    const [sourceBannerVisible, setSourceBannerVisible] = useState(true);
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
                showErrorToast(`Error fetching data:${error}`);
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
        <Box sx={{
            pb: 3
        }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    pl: '0.5rem',
                    mt: 2,
                    backgroundColor: '#fff',
                    justifyContent: 'space-between',
                    width: '100%',
                    "@media (max-width: 600px)": {
                        pt: '4.25rem',
                        flexDirection: 'column',
                        pl: '0.5rem',
                        alignItems: 'flex-start',
                        zIndex: 10,
                        width: '100%',
                        pr: 1.5
                    },
                    "@media (max-width: 440px)": {
                        flexDirection: 'column',
                        zIndex: 1,
                        justifyContent: 'flex-start'
                    },
                    "@media (max-width: 400px)": {
                        pb: '6px',
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 1 }}>
                    <Typography className="first-sub-title" sx={{ fontSize: '24px !important', fontWeight: "500 !important" }}>Get Started</Typography>
                    <Typography className="description">To begin building your audience, you'll need to provide a data source</Typography>
                </Box>
            </Box>
            {status === 'PIXEL_INSTALLATION_NEEDED' && tabIndex === 0 ? (
                <FirstTimeScreenCommonVariant1
                    InfoNotification={{
                        Text: 'Ready to begin? Install your website pixel and set up your first source – these foundational steps will activate all key features.',
                        sx: { width: '100%', pr: 3, "@media (max-width: 600px)": { pt: 3, pr: 2 } }
                    }}
                    Content={<CardsSection items={[
                        {
                            title: 'Install Pixel',
                            subtitle: 'It will automatically collect visitor information from your website.',
                            imageSrc: '/pixel.svg',
                            onClick: pixelInstalled ? undefined : () => setTabIndex(1),
                            showRecommended: false,
                            showInstalled: pixelInstalled,
                            img_height: 120
                        },
                        {
                            title: 'Import Source',
                            subtitle: `To begin building your audience, you'll first need to provide a data source. `,
                            imageSrc: '/import_source.svg',
                            onClick: sourceImported ? undefined : () => setTabIndex(2),
                            showRecommended: false,
                            showInstalled: sourceImported,
                            img_height: 120
                        },
                    ]} />}
                    MainBoxStyleSX={{ width: '100%' }}
                    customStyleSX={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        margin: "0 auto",
                        mt: 2
                    }}
                />
            ) : (
                <Box sx={{
                    width: '100%', flex: 1, pr: '2.5rem', pl: '2.5rem', "@media (max-width: 600px)": { pr: 0, pl: 0 },
                }}>
                    <Box sx={{ width: '100%', pt: 3 }}>
                        {tabIndex === 1 && (
                            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
                                <Typography className="first-sub-title" fontSize={'20px !important'}> Pixel Installation</Typography>
                                {pixelBannerVisible && <NotificationInfoBanner
                                    message={'A pixel is a small tracking code that collects visitor data from your website to measure performance and build audiences.'}
                                    onClose={() => setPixelBannerVisible(false)}
                                />}
                            </Box>
                        )}
                        <TabPanel value={tabIndex} index={1}>
                            <GettingStartedSection />
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', pt: 3, "@media (max-width: 600px)": { pr: '8px' } }}>
                        {tabIndex === 2 && (
                            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column', width: '80%', }}>
                                <Typography className="first-sub-title" fontSize={'20px !important'}> Pixel Installation</Typography>
                                {sourceBannerVisible && <NotificationInfoBanner
                                    bgColor="rgba(235, 245, 255, 1)"
                                    iconColor="rgba(56, 152, 252, 1)"
                                    border="1px solid rgba(56, 152, 252, 0.3)"
                                    message={"Sources can be either audiences captured by your pixel or manually uploaded customer lists in CSV format. Later it will be your 'seed audiences' - it will train our AI to find for you similar high-value users across platforms."}
                                    onClose={() => setSourceBannerVisible(false)}
                                />}
                            </Box>
                        )}
                        <TabPanel value={tabIndex} index={2}>
                            <SourcesHintsProvider>
                                <Suspense fallback={<ProgressBar />}>
                                    <SourcesImport hideTitle={true} />
                                </Suspense>
                            </SourcesHintsProvider>
                        </TabPanel>
                    </Box>
                </Box>)}
        </Box>
    );
};

const GetStartedPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <SliderProvider>
                <GetStarted />
            </SliderProvider>
        </Suspense>
    );
};

export default GetStartedPage;
