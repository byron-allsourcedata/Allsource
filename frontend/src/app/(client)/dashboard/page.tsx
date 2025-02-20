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


const VerifyPixelIntegration: React.FC = () => {

  const [inputValue, setInputValue] = useState<string>("");
  const apiUrl = process.env.NEXT_PUBLIC_API_DOMAIN
  useEffect(() => {
    const storedValue = sessionStorage.getItem('current_domain');
    if (storedValue !== null) {
      setInputValue(storedValue);
    }
  }, []);


  const handleButtonClick = () => {
    let url = inputValue.trim();

    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
      }

      const hasQuery = url.includes("?");
      const newUrl = url + (hasQuery ? "&" : "?") + "vge=true" + `&api=${apiUrl}`;
      window.open(newUrl, "_blank");
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <Box
      sx={{
        padding: "1rem",
        border: "1px solid #e4e4e4",
        borderRadius: "8px",
        overflow: 'hidden',
        backgroundColor: "rgba(247, 247, 247, 1)",
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        marginBottom: "2rem",
        '@media (max-width: 900px)': {
          marginBottom: "1.5rem",
          padding: '1rem'
        }
      }}
    >
      <Typography
        variant="h6"
        mb={2}
        className="first-sub-title"
        sx={{
          fontFamily: "Nunito Sans",
          fontWeight: "700",
          lineHeight: "normal",
          textAlign: "left",
          color: '#1c1c1c',
          fontSize: '16px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          '@media (max-width: 900px)': {
            fontSize: '16px',
            lineHeight: 'normal',
            marginBottom: '24px'
          }
        }}
      >
        2. Verify pixel integration on your website <CustomTooltip title={"Check if your pixel is correctly integrated to ensure accurate tracking and data collection."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/articles/how-to-test-the-pixel-code-installation" />
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{
        '@media (max-width: 600px)': {
          alignItems: 'flex-start',
          gap: '16px',
          flexDirection: 'column'
        }
      }}>
        <input
          id="urlInput"
          type="text"
          value={`https://${inputValue}`}
          onChange={handleInputChange}
          disabled={true}
          placeholder="https://yourdomain.com"
          style={{
            padding: "0.5rem 3em 0.5em 1em",
            width: "50%",
            border: "1px solid #e4e4e4",
            borderRadius: "4px",
            fontFamily: "Roboto",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "22.4px",
            textAlign: "left"
          }}
        />
        <Button
          onClick={handleButtonClick}
          sx={{
            ml: 2,
            border: "1px solid rgba(80, 82, 178, 1)",
            textTransform: "none",
            background: "#fff",
            color: "rgba(80, 82, 178, 1)",
            fontFamily: "Nunito Sans",
            fontWeight: 600,
            fontSize: '14px',
            padding: "0.75em 1.5em",
            lineHeight: 'normal',
            '@media (max-width: 600px)': {
              padding: '0.625rem 1.5rem',
              marginLeft: 0,
              fontSize: '16px'
            }
          }}
        >
          Test
        </Button>
      </Box>
    </Box>
  );
};

const SupportSection: React.FC = () => {
  const [openmanually, setOpen] = useState(false);
  const [pixelCode, setPixelCode] = useState('');
  const { setShowSlider } = useSlider();
  const [isLoading, setIsLoading] = useState(false);

  const installManually = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInterceptorInstance.get('/install-pixel/manually');
      setPixelCode(response.data.manual);
      setOpen(true);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
          setShowSlider(true);
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
          setShowSlider(false);
        }
      } else {
        console.error('Error fetching data:', error);
      }
    }
    finally {
      setIsLoading(false)
    }
  };


  const sendEmail = () => {
    installManually()

  }
  const handleManualClose = () => setOpen(false);

  return (
    <Box sx={{
      position: "fixed",
      bottom: 20,
      width: "86%",
      '@media (max-width: 1400px)': {
        position: 'static',
        width: '100%',
      }
    }}>
      <Box
        sx={{
          padding: "1em 0em 1em 1em",
          borderRadius: "8px",
          backgroundColor: "#fff",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          textAlign: "left",
          width: "100%",
          border: "1px solid rgba(228, 228, 228, 1)",
          '@media (max-width: 1199px)': {
            width: '100%',
            position: 'relative',
            padding: "1em 0em 1.5em 1em",
            borderRadius: '4px',
            border: '0.0625rem solid #E4E4E4',
            background: '#F7F7F7'
          },
          '@media (max-width: 900px)': {
            marginBottom: 0
          }
        }}
      >
        <Typography
          variant="body2"
          mb={2}
          className="first-sub-title"
          sx={{
            padding: "0em 0em 1.5em 0.5em",
            fontFamily: "Nunito Sans",
            fontSize: "14px",
            fontWeight: "700",
            lineHeight: "19.1px",
            textAlign: "left",
            color: "rgba(28, 28, 28, 1)",
          }}
        >
          Having trouble?
        </Typography>
        <Grid
          container
          spacing={3}
          alignItems="center"
          justifyContent="flex-start"
          sx={{ rowGap: "24px", display: "flex" }}
        >
          <Button
            onClick={sendEmail}
            sx={{
              textWrap: "nowrap",
              pt: '0.5em',
              color: "rgba(80, 82, 178, 1)",
              fontFamily: "Nunito Sans",
              border: "none",
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: "none",
              lineHeight: "22.4px",
              backgroundColor: "transparent",
              textTransform: "none",
              cursor: "pointer",
              marginLeft: '1.5em',
              gap: '8px'
            }}
          >
            Send this to my developer
            <Image
              src={"/telegram.svg"}
              alt="headphones"
              width={20}
              height={20}
            />
          </Button>
          <ManualPopup open={openmanually} handleClose={handleManualClose} pixelCode={pixelCode} />
          {isLoading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            }}>
              <CustomizedProgressBar />
            </Box>
          )}
        </Grid>
      </Box>
    </Box>
  )
};

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [hiddenrevenue, setHiddenRevenue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(null);
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const [formattedDates, setFormattedDates] = useState<string>('');
  const [appliedDates, setAppliedDates] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');
  const [typeBusiness, setTypeBusiness] = useState("")
  const searchParams = useSearchParams();
  let statusIntegrate = searchParams.get('message');
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
          overflowY: 'hidden',
          maxHeight: 'calc(100vh - 68px)',
          '@media (max-width: 600px)':{
            paddingRight: 0
          }
        }}
      >
        <Box sx={{
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'start',
          pt: hasNotification ? 6.25 : 3.5,
          pb: 0.75,
          position: 'fixed',
          overflowY: 'hidden',
          top: hasNotification ? '3.95rem' : '3.75rem',
          right: '0px',
          left: '170px',
          background: '#fff',
          zIndex: '1',
          paddingLeft: '30px',
          paddingRight: '65px',
          '@media (min-width: 1600px)': {
            paddingLeft: '30px',
            paddingRight: '90px',
          },
          mx: '-24px',
          "@media (max-width: 900px)": {
            left: '10px',
            paddingRight: '90px',
          },
          "@media (max-width: 600px)": {
            flexDirection: 'column',
            alignItems: 'start',
            paddingRight: 3,
            top: '6.3rem',
            pt:0
          }
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
                      backgroundColor: 'rgba(80, 82, 178, 1)',
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
                        color: 'rgba(80, 82, 178, 1)'
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
                        color: 'rgba(80, 82, 178, 1)'
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
              </Button>
            </Box>
          </Box>
          <Box sx={{display: 'flex', height: '120px'}}>

          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflowY: 'auto',
              "@media (max-width: 900px)": {
                height: 'calc(100vh - 40px)',
              },
              "@media (max-width: 600px)": {
                height: 'calc(100vh - 100px)',
                pr:'16px'
              }
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
        <Grid container sx={{
          height: '100%',
          pt: 3,
          pr: 2
        }}>
          <Grid item xs={12} sx={{ display: { md: 'none' }, overflow: 'hidden' }}>
            <Typography
              variant="h4"
              component="h1"
              className="heading-text"
              sx={dashboardStyles.title}
            >
              Let&apos;s Get Started!
            </Typography>
            <Typography
              className="table-data" sx={dashboardStyles.description}>
              Install our pixel on your website to start capturing anonymous
              visitor data on your store.
            </Typography>
            <ProgressSection />
            <PixelInstallation />
            <VerifyPixelIntegration />
            <RevenueTracking />
          </Grid>
          <Grid item xs={12} lg={8} sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}>
            <Typography
              variant="h4"
              component="h1"
              className="heading-text"
              sx={dashboardStyles.title}
            >
              Let’s Get Started! <CustomTooltip title={"Boost engagement and reduce cart abandonment with personalized messages tailored for your visitors."} linkText="Learn more" linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai" />
            </Typography>
            <Typography className="table-data" sx={dashboardStyles.description} mb={4}>
              Install our pixel on your website to start capturing anonymous
              visitor data on your store.
            </Typography>
            <PixelInstallation />
            <VerifyPixelIntegration />
            {/* <RevenueTracking /> */}
          </Grid>
          <Grid item xs={12} lg={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <ProgressSection />
          </Grid>
          <Grid item xs={12}>
            <SupportSection />
          </Grid>

        </Grid>

      )}
      {showSlider && <Slider />}
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
