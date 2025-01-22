"use client";
import { Box, Typography, Tabs, Tab, Button, IconButton } from "@mui/material";
import { Suspense, useEffect, useState, useCallback } from "react";
import { partnersStyle } from './partnersStyles';
import CustomTooltip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import dayjs from "dayjs";
import Image from "next/image";
import { useNotification } from '@/context/NotificationContext';
import PartnersAccounts from "@/components/PartnersAccounts";
import ReferralRewards from "@/app/(client)/referral/components/ReferralRewards";
import PartnersAssets from "./components/PartnersAssets";
import PartnersMain from "./components/PartnersMain";
import CalendarPopup from "@/components/CustomCalendar";
import PartnersOverview from "./components/PartnersOverview";
import InvitePartnerPopup from "@/components/InvitePartnerPopup"

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


interface PartnerData {
    id: number;
    partner_name: string;
    email: string;
    join_date: Date | string;
    commission: string;
    subscription: string;
    sources: string;
    last_payment_date: string;
    status: string;
    count: number;
    reward_payout_date: string;
    reward_status: string;
    reward_amount: string;
}


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

const Partners: React.FC = () => {
    const { hasNotification } = useNotification();
    const [email, setEmail] = useState('');
    const [commission, setCommission] = useState(0);
    const [masterId, setMasterId] = useState(0)
    const [formPopupOpen, setFormPopupOpen] = useState(false);
    const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
    const isCalendarOpen = Boolean(calendarAnchorEl);
    const [formattedDates, setFormattedDates] = useState<string>('');
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
    const [totalCount, setTotalCount] = useState(0);
    const [partners, setPartners] = useState<PartnerData[]>([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [isMaster, setIsMaster] = useState<boolean | null>(null)
    const [loading, setLoading]  = useState(false);
    const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
        setTabIndex(newIndex);
    };

    const handleFormOpenPopup = () => {
        setFormPopupOpen(true)
    }

    const handleFormClosePopup = () => {
        setFormPopupOpen(false)
    }

    const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setCalendarAnchorEl(event.currentTarget);
    };

    const handleCalendarClose = () => {
        setCalendarAnchorEl(null);
    };

    const handleDateLabelChange = (label: string) => {
        setSelectedDateLabel(label);
    };

    const handleDateChange = (dates: { start: Date | null; end: Date | null }) => {
        const { start, end } = dates;
        if (start && end) {
            const formattedStart = dayjs(start).format('MMM D');
            const formattedEnd = dayjs(end).format('MMM D, YYYY');

            setFormattedDates(`${formattedStart} - ${formattedEnd}`);
        } else if (start) {
            const formattedStart = dayjs(start).format('MMM D, YYYY');
            setFormattedDates(formattedStart);
        } else if (end) {
            const formattedEnd = dayjs(end).format('MMM D, YYYY');
            setFormattedDates(formattedEnd);
        } else {
            setFormattedDates('');
        }
    };

    const handleApply = (dates: { start: Date | null; end: Date | null }) => {
        if (dates.start && dates.end) {
            setAppliedDates(dates);
            setCalendarAnchorEl(null);
            handleCalendarClose();
        }
        else {
            setAppliedDates({ start: null, end: null })
        }
    };

    const updateOrAddAsset = (updatedPartner: PartnerData) => {
        let isNewPartner = false;
        setPartners((prevAccounts) => {
            const index = prevAccounts.findIndex((account) => account.id === updatedPartner.id);
            if (index !== -1) {
                const newAccounts = [...prevAccounts];
                newAccounts[index] = updatedPartner;
                return newAccounts;
            }
            isNewPartner = true;
            return [...prevAccounts, updatedPartner];
        });

        if (isNewPartner) {
            setTotalCount((prevTotalCount) => prevTotalCount + 1);
        }
    };

    const fetchRulesMe = useCallback(async () => {
        setLoading(true)

        try {
            const responseMe = await axiosInstance.get(`/partners`);
            if(responseMe.status === 200) {
                const masterPartner = responseMe.data.is_master
                setIsMaster(masterPartner) 
                setMasterId(responseMe.data.id)  
                setCommission(responseMe.data.commission) 
            }
            else {
                setIsMaster(false)
            }
        } catch {
        } finally {
            setLoading(false)
        }
    }, [email]);


    useEffect(() => {
        fetchRulesMe()
    }, [])

    return (
        <>
            <Box sx={partnersStyle.mainContent}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'fixed', top: hasNotification ? '10vw' : '4.25rem', left: '9.1rem', pl: '2rem', pt: '12px', pb: '16px', zIndex: 1200, backgroundColor: '#fff', justifyContent: 'space-between', width: '90%', ml: 0, "@media (max-width: 900px)": { left: 0, zIndex: 50 }, "@media (max-width: 600px)": { flexDirection: 'column', pl: '1.5rem', display: 'flex', alignItems: 'flex-start', zIndex: 50, width: '97%' }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 50, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', } }}>
                {loading && <CustomizedProgressBar/>}

                    <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: "space-between", flexDirection: 'row', alignItems: 'center', width: '15%', gap: 1, "@media (max-width: 900px)": { width: '20%' }, "@media (max-width: 600px)": { mb: 2, width: '97%' }, "@media (max-width: 440px)": { mb: 1 }, }}>
                        <Box sx={{display: 'flex', justifyContent: "space-between", alignItems: 'center', gap: 1}}>
                            <Typography className="first-sub-title">{isMaster ? "Master Partner" : "Partner"}</Typography>
                            <Box sx={{ "@media (max-width: 600px)": { display: 'none' } }}><CustomTooltip title={"Collaborate with trusted partners to access exclusive resources and services that drive success."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/referral" /></Box>
                        </Box>
                        {tabIndex === 0 && <IconButton sx={{
                            display: "none", cursor: "pointer", "@media (max-width: 600px)": { display: "block" }}} onClick={handleFormOpenPopup}>
                        <Image src='/add.svg' alt="add partner" width={24} height={24}/>
                        </IconButton>
                        }
                    </Box>
                
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', width: '51%', pr: tabIndex !== 0 ? "20%" : 0, alignItems: 'center', "@media (max-width: 900px)": { pr: 0, width: '51%' }, "@media (max-width: 600px)": { width: '97%', pr: '0' } }}>
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
                                {isMaster && <Tab className="main-text"
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
                                    label="Partners"
                                />}
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

                    {tabIndex === 0 && <Box sx={{flexGrow: 1, display: 'flex', justifyContent: "flex-end", width: '24%', mr:3, gap: "16px", "@media (max-width: 900px)": { display: "none" }, }}>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(250, 250, 246, 1)",
                            border: "0.2px solid rgba(189, 189, 189, 1)",
                            padding: "12px 16px",
                            borderRadius: "4px",
                            height: "40px"
                        }}>
                            <Typography sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "16px",
                                fontWeight: 700,
                                lineHeight: "21.82px",
                                marginRight: "8px",
                                color: "rgba(32, 33, 36, 1)"               
                            }}>{commission}%</Typography>
                            <Typography sx={{
                                fontFamily: "Nunito Sans",
                                fontSize: "12px",
                                fontWeight: 600,
                                lineHeight: "16.8px",
                                color: "rgba(74, 74, 74, 1)"               
                            }}>Commission earned</Typography>
                        </Box>

                        {isMaster &&
                        <Button
                            variant="outlined"
                            sx={{
                                height: '40px',
                                borderRadius: '4px',
                                textTransform: 'none',
                                fontSize: '14px',
                                lineHeight: "19.6px",
                                fontWeight: '500',
                                color: '#5052B2',
                                borderColor: '#5052B2',
                                '&:hover': {
                                    backgroundColor: 'rgba(80, 82, 178, 0.1)',
                                    borderColor: '#5052B2',
                                },
                            }}
                            onClick={() => {
                                handleFormOpenPopup()
                            }}
                        >
                            Add Partner
                        </Button>}
                    </Box>}

                    {tabIndex === 0 && <IconButton sx={{
                            display: "none", cursor: "pointer", "@media (max-width: 900px)": { display: "block" }, "@media (max-width: 600px)": { display: "none" }}} onClick={handleFormOpenPopup}>
                        <Image src='/add.svg' alt="add partner" width={24} height={24}/>
                        </IconButton>
                        }
                    
                    {(tabIndex === 1 || tabIndex == 2 && isMaster) &&  <Button
                                aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                                aria-haspopup="true"
                                aria-expanded={isCalendarOpen ? 'true' : undefined}
                                onClick={handleCalendarClick}
                                sx={{
                                    textTransform: 'none',
                                    color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)',
                                    border: formattedDates ? '1.5px solid rgba(80, 82, 178, 1)' : '1.5px solid rgba(184, 184, 184, 1)',
                                    borderRadius: '4px',
                                    padding: '8px',
                                    minWidth: 'auto',
                                    '@media (max-width: 900px)': {
                                        border: 'none',
                                        padding: 0
                                    },
                                    '&:hover': {
                                        border: '1.5px solid rgba(80, 82, 178, 1)',
                                        '& .MuiSvgIcon-root': {
                                            color: 'rgba(80, 82, 178, 1)'
                                        }
                                    }
                                }}
                            >
                                <DateRangeIcon
                                    fontSize="medium"
                                    sx={{ color: formattedDates ? 'rgba(80, 82, 178, 1)' : 'rgba(128, 128, 128, 1)' }}
                                />
                                <Typography variant="body1" sx={{
                                    fontFamily: 'Roboto',
                                    fontSize: '14px',
                                    fontWeight: '400',
                                    color: 'rgba(32, 33, 36, 1)',
                                    lineHeight: '19.6px',
                                    textAlign: 'left'
                                }}>
                                    {formattedDates}
                                </Typography>
                                {formattedDates &&
                                    <Box sx={{ pl: 2, display: 'flex', alignItems: 'center' }}>
                                        <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
                                    </Box>
                                }
                            </Button>}
                    

                    <CalendarPopup
                            anchorEl={calendarAnchorEl}
                            open={isCalendarOpen}
                            onClose={handleCalendarClose}
                            onDateChange={handleDateChange}
                            onDateLabelChange={handleDateLabelChange}
                            onApply={handleApply}
                        />
                    <InvitePartnerPopup 
                        maxCommission={commission}
                        masterId={masterId}
                        isMaster={false}
                        open={formPopupOpen} 
                        updateOrAddAsset={updateOrAddAsset}
                        onClose={handleFormClosePopup}  />
                        

                </Box>
                
                    <Box sx={{ width: '100%', padding: 0, "@media (max-width: 600px)": { mt: '4.5rem' }, "@media (max-width: 440px)": { mt: '7.5rem' }, }}>
                        <TabPanel value={tabIndex} index={0}>
                            <PartnersOverview isMaster={isMaster ?? false}/>
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={1}>
                            <PartnersAccounts setLoading={setLoading} appliedDates={appliedDates} />
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={isMaster ? 2 : 1}>
                            <PartnersMain setLoading={setLoading} appliedDates={appliedDates} masterId={masterId} />
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={isMaster ? 3 : 2}>
                            <ReferralRewards />
                        </TabPanel>
                    </Box>
                    <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
                        <TabPanel value={tabIndex} index={isMaster ? 4 : 3}>
                            <PartnersAssets />
                        </TabPanel>
                    </Box>
            </Box>
        </>
    );
};

const PartnersPage: React.FC = () => {
    return (
        <Suspense fallback={<CustomizedProgressBar />}>
            <Partners />
        </Suspense>
    );
};

export default PartnersPage;
