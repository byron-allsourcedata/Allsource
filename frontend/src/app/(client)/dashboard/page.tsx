"use client";
import { Box, Grid, Typography, Button, Menu, MenuItem, Modal, Tab, Tabs } from "@mui/material";
import Image from "next/image";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { dashboardStyles } from "./dashboardStyles";
import { ProgressSection } from "./components/ProgressSection";
import PixelInstallation from "./components/PixelInstallation";
import Slider from "../../../components/Slider";
import { SliderProvider, useSlider } from "../../../context/SliderContext";
import { PopupButton } from "react-calendly";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { showErrorToast, showToast } from '@/components/ToastNotification';
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import ManualPopup from "./components/ManualPopup";
import DashboardRevenue from "./components/DashboardRevenue";
import DashboardContactB2B from "./components/DashboardContactB2B";
import DashboardContactD2C from "./components/DashboardContactD2C";
import CustomTooltip from "@/components/customToolTip";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import CalendarPopup from "@/components/CustomCalendar";
import dayjs from "dayjs";
import { useNotification } from '../../../context/NotificationContext';
import RevenueTracking from "@/components/RevenueTracking";
import WelcomePopup from "./components/WelcomePopup";
import GettingStartedSection from "@/components/GettingStartedSection";


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
      {value === index &&
        <Box sx={{
          margin: 0,
          pt: 3,
          paddingLeft: '2.5rem',
          paddingRight: '2.5rem',
          '@media (min-width: 1600px)': {
            paddingLeft: '4.25rem',
            paddingRight: '4.25rem',
          },
          '@media (max-width: 600px)': {
            paddingLeft: '0',
            paddingRight: '0',
          },
        }}>
          {children}
        </Box>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const [formattedDates, setFormattedDates] = useState<string>('');
  const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
  const [typeBusiness, setTypeBusiness] = useState("")
  const searchParams = useSearchParams();
  let statusIntegrate = searchParams.get('message');
  const [welcomePopup, setWelcomePopup] = useState<string | null>(null);


  useEffect(() => {
    const storedPopup = localStorage.getItem("welcome_popup");
    setWelcomePopup(storedPopup);
  }, []);

  useEffect(() => {
    if (statusIntegrate) {
      if (statusIntegrate == 'Successfully') {
        showToast('Connect to Bigcommerce Successfully. Pixel Installed');
        statusIntegrate = null
      } else {
        showErrorToast('Failed to connect to BigCommerce. Your domain does not match the domain registered on BigCommerce.')
        statusIntegrate = null
      }
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('message');
      router.replace(`?${newSearchParams.toString()}`);
    }
  }, [statusIntegrate])
  const handleDateLabelChange = (label: string) => {
    setSelectedDateLabel(label);
  };


  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
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


  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      const fetchData = async () => {
        try {
          const response = await axiosInstance.get("/check-user-authorization");
          if (response.data.status === 'SUCCESS') {
            setShowCharts(true);
          }
          if (response.data.status === "NEED_BOOK_CALL") {
            setShowSlider(true);
          } else {
            setShowSlider(false);
          }
          let business_type = 'd2c'
          const storedMe = localStorage.getItem('account_info');
          if (storedMe) {
            const storedData = JSON.parse(storedMe);
            business_type = storedData.business_type
            setTypeBusiness(storedData.business_type)
          }
        } catch (error) {
          if (error instanceof AxiosError && error.response?.status === 403) {
            if (error.response.data.status === "NEED_BOOK_CALL") {
              setShowSlider(true);
            } else {
              setShowSlider(false);
            }
          } else {
            console.error("Error fetching data:", error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      router.push("/signin");
    }
  }, [setShowSlider, router]);


  const [tabIndex, setTabIndex] = useState(0);
  useEffect(() => {
    const fetchData = async () => {
      let business_type = 'b2b'
      const storedMe = localStorage.getItem('account_info');
      if (storedMe) {
        const storedData = JSON.parse(storedMe);
        business_type = storedData.business_type
        setTypeBusiness(storedData.business_type)
      }
      if (business_type === 'b2b') {
        setTabIndex(1)
      } else {
        try {
          setLoading(true)
          const response = await axiosInstance.get('/dashboard/revenue');
          if (!response?.data.total_counts || !response?.data.total_counts.total_revenue) {
            setTabIndex(1)
            return;
          }
        } catch (error) { }
        finally {
          setLoading(false)
        }
      }

    };
    fetchData();
  }, []);

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };
  return (
    <Box>
      {showCharts ? (
        <Grid
        sx={{
          display: "flex",
          flexDirection: "column",
          '@media (max-width: 600px)':{
            paddingRight: 0
          }
        }}
      >
        <Box sx={{
          display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'sticky', top: 0, pt: '12px', pb: '12px', pl:'8px', pr:'1.5rem', zIndex: 1, backgroundColor: '#fff', justifyContent: 'space-between', width: '100%', "@media (max-width: 600px)": { flexDirection: 'column', display: 'flex', alignItems: 'flex-start', zIndex: 1, width: '100%', pr:1.5 }, "@media (max-width: 440px)": { flexDirection: 'column', pt: hasNotification ? '3rem' : '0.75rem', top: hasNotification ? '4.5rem' : '', zIndex: 1, justifyContent: 'flex-start' }, "@media (max-width: 400px)": { pt: hasNotification ? '4.25rem' : '', pb: '6px', }
        }}>
            <Typography
              variant="h4"
              component="h1"
              className="first-sub-title"
              sx={{
                ...dashboardStyles.title, '@media (max-width: 600px)': {
                  display: 'none',
                },
              }}
            >
              Dashboard <CustomTooltip title={"Indicates the count of resolved identities and revenue figures for the specified time"} linkText="Learn More" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/dashboard" />
            </Typography>
            <Box sx={{
              display: 'none', width: '100%', justifyContent: 'space-between', alignItems: 'start', '@media (max-width: 600px)': {
                display: 'flex'
              }
            }}>
              <Typography
                variant="h4"
                component="h1"
                className="first-sub-title"
                sx={dashboardStyles.title}
              >
                Dashboard
              </Typography>

              <Box sx={{
                display: 'none', justifyContent: 'flex-end', alignItems: 'start', pt: 0.5, gap: 1, '@media (max-width: 600px)': {
                  display: 'flex',
                }
              }}>
                {/* Calendary picker*/}
                <Typography className="second-sub-title">{selectedDateLabel}</Typography>
                <Button
                  aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                  aria-haspopup="true"
                  aria-expanded={isCalendarOpen ? 'true' : undefined}
                  onClick={handleCalendarClick}
                  sx={{
                    textTransform: 'none',
                    color: 'rgba(128, 128, 128, 1)',
                    border: '1px solid rgba(184, 184, 184, 1)',
                    borderRadius: '4px',
                    padding: '8px',
                    minWidth: 'auto',
                  }}
                >
                  <DateRangeIcon fontSize='small' />
                </Button>
              </Box>
            </Box>
            {typeBusiness == 'd2c' && (
              <Box sx={{
                flexGrow: 1, display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'start', '@media (max-width: 600px)': {
                  width: '100%',
                  mt: hasNotification ? 1 : 2
                }
              }}>
                <Tabs
                  value={tabIndex}
                  onChange={handleTabChange}
                  sx={{
                    textTransform: 'none',
                    minHeight: 0,
                    alignItems: 'start',
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
                  aria-label="dashboard tabs"
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
                        color: 'rgba(56, 152, 252, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }}
                    label="Revenue"
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
                        color: 'rgba(56, 152, 252, 1)'
                      },
                      "@media (max-width: 600px)": {
                        mr: 0, borderRadius: '4px', '&.Mui-selected': {
                          backgroundColor: 'rgba(249, 249, 253, 1)',
                          border: '1px solid rgba(220, 220, 239, 1)'
                        },
                      }
                    }}
                    label="Contacts"
                  />
                </Tabs>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 2,
                width: typeBusiness == 'd2c' ? '' : '100%',
                '@media (max-width: 600px)': {
                  display: 'none',
                }
              }}
            >
              {/* Calendary picker*/}
              <Typography className="second-sub-title">{selectedDateLabel ? selectedDateLabel : ''}</Typography>
              <Button
                aria-controls={isCalendarOpen ? 'calendar-popup' : undefined}
                aria-haspopup="true"
                aria-expanded={isCalendarOpen ? 'true' : undefined}
                onClick={handleCalendarClick}
                sx={{
                  textTransform: 'none',
                  color: formattedDates ? 'rgba(56, 152, 252, 1)' : 'rgba(128, 128, 128, 1)',
                  border: formattedDates ? '1.5px solid rgba(56, 152, 252, 1)' : '1.5px solid rgba(184, 184, 184, 1)',
                  borderRadius: '4px',
                  padding: '8px',
                  minWidth: 'auto',
                  '@media (max-width: 900px)': {
                    border: 'none',
                    padding: 0
                  },
                  '&:hover': {
                    border: '1.5px solid rgba(56, 152, 252, 1)',
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(56, 152, 252, 1)'
                    }
                  }
                }}
              >
                <DateRangeIcon
                  fontSize="medium"
                  sx={{ color: formattedDates ? 'rgba(56, 152, 252, 1)' : 'rgba(128, 128, 128, 1)' }}
                />
                <Typography variant="body1" sx={{
                  fontFamily: 'Roboto',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: 'rgba(32, 33, 36, 1)',
                  lineHeight: '19.6px',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',

                }}>
                  {formattedDates}
                </Typography>
                {formattedDates &&
                  <Box sx={{ pl: 2, display: 'flex', alignItems: 'center' }}>
                    <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
                  </Box>
                }
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto', flexGrow: 1,
            }}
          >
            <TabPanel value={tabIndex} index={0}>
              <DashboardRevenue appliedDates={appliedDates} />
            </TabPanel>
            <TabPanel value={tabIndex} index={1}>
              {typeBusiness === 'd2c' ? (
                <DashboardContactD2C appliedDates={appliedDates} typeBusiness={typeBusiness} />
              ) : (
                <DashboardContactB2B appliedDates={appliedDates} typeBusiness={typeBusiness} />
              )}
            </TabPanel>
          </Box>

          <CalendarPopup
            anchorEl={calendarAnchorEl}
            open={isCalendarOpen}
            onClose={handleCalendarClose}
            onDateChange={handleDateChange}
            onDateLabelChange={handleDateLabelChange}
            onApply={handleApply}
          />

        </Grid>
      ) : (
        <GettingStartedSection />
      )}
      {showSlider && <Slider />}
      {welcomePopup && <WelcomePopup />}
    </Box>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <SliderProvider>
        <Dashboard />
      </SliderProvider>
    </Suspense>
  );
};


export default DashboardPage;
