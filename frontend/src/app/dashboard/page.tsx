"use client";
import { Box, Grid, Typography, Button, Menu, MenuItem } from "@mui/material";
import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import axiosInstance from "../../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { dashboardStyles } from "./dashboardStyles";
import { ProgressSection } from "../../components/ProgressSection";
import PixelInstallation from "../../components/PixelInstallation";
import Slider from "../../components/Slider";
import { SliderProvider } from "../../context/SliderContext";
import { useTrial } from "../../context/TrialProvider";
import StatsCards from "../../components/StatsCard";
import { PopupButton } from "react-calendly";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { fetchUserData } from '../../services/meService';


const VerifyPixelIntegration: React.FC = () => {
  const { website } = useUser();
  const [inputValue, setInputValue] = useState<string>(website || "");

  useEffect(() => {
    setInputValue(website || "");
  }, [website]);

  const handleButtonClick = () => {
    let url = inputValue.trim();

    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
      }

      axiosInstance.post("/install-pixel/check-pixel-installed", { url });

      const hasQuery = url.includes("?");
      const newUrl = url + (hasQuery ? "&" : "?") + "vge=true" + "&api=https://api-dev.maximiz.ai";
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
        component="div"
        mb={2}
        sx={{
          fontFamily: "Nunito",
          fontWeight: "700",
          lineHeight: "normal",
          textAlign: "left",
          color: '#1c1c1c',
          fontSize: '16px',
          marginBottom: '1.5rem',
          '@media (max-width: 900px)': {
            fontSize: '16px',
            lineHeight: 'normal',
            marginBottom: '24px'
          }
        }}
      >
        2. Verify pixel integration on your website
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
          value={inputValue}
          onChange={handleInputChange}
          placeholder="https://yourdomain.com"
          style={{
            padding: "0.5rem 3em 0.5em 1em",
            width: "50%",
            border: "1px solid #e4e4e4",
            borderRadius: "4px",
            fontFamily: "Nunito",
            fontSize: "16px",
            fontWeight: "600",
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
            fontFamily: "Nunito",
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
  const calendlyPopupRef = useRef<HTMLDivElement | null>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Устанавливаем корневой элемент для модального окна после рендера
    if (calendlyPopupRef.current) {
      setRootElement(calendlyPopupRef.current);
    }
  }, []);

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
        color="textSecondary"
        mb={2}
        sx={{
          padding: "0em 0em 1.5em 0.5em",
          fontFamily: "Nunito",
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
        <div id="calendly-popup-wrapper" ref={calendlyPopupRef} />
      {rootElement && (
        <PopupButton
          className="book-call-button"
          styles={{
            marginLeft: '1.6em',
            textWrap: "nowrap",
            color: "rgba(80, 82, 178, 1)",
            fontFamily: "Nunito",
            border: "none",
            textDecoration: "none",
            fontSize: "16px",
            lineHeight: "22.4px",
            backgroundColor: "transparent",
            textTransform: "none",
            cursor: "pointer",
          }}
          url="https://calendly.com/nickit-schatalow09/maximiz"
          rootElement={rootElement} // Теперь корневой элемент передается через состояние
          text="Schedule a call with us"
        />
      )}
        <Image
            src={"/headphones.svg"}
            alt="headphones"
            width={20}
            height={20}
            
          />
        <Button
          sx={{
            textWrap: "nowrap",
            pt:'0.5em',
            color: "rgba(80, 82, 178, 1)",
            fontFamily: "Nunito",
            border: "none",
            textDecoration: "none",
            fontSize: "16px",
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
      </Grid>
    </Box>
    </Box>
)};

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { setTrial, setDaysLeft } = useTrial();
  const [data, setData] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);



  useEffect(() => {
    const fetchUserDataAndUpdateState = async () => {
      try {
        const userData = await fetchUserData();
        if (userData) {
          setTrial(userData.trial);
          setDaysLeft(userData.days_left);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserDataAndUpdateState();
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      const storedMe = sessionStorage.getItem("me");
      if (storedMe) {
        const { trial, days_left } = JSON.parse(storedMe);
        setTrial(trial);
        setDaysLeft(days_left);
      }
      const fetchData = async () => {
        try {
          const response = await axiosInstance.get("dashboard");
          setData(response.data);
          if (response.status === 200) {
            setShowCharts(true); // Set to true if response is 200
          }
          if (response.data.status === "NEED_BOOK_CALL") {
            setShowSlider(true);
          } else {
            setShowSlider(false);
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
  }, [setShowSlider, setTrial, setDaysLeft, router]);

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  return (
    <>
    
        {showCharts ? (
          <>
              <Grid
                spacing={2}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  sx={dashboardStyles.title}
                >
                  Dashboard
                </Typography>
                <Grid
                  item
                  xs={12}
                  md={12}
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    flexDirection: "row",
                    gap: "1em",
                  }}
                >
                  <StatsCards />
                </Grid>
                <Grid
                  container
                  spacing={2}
                  sx={{
                    marginTop: "2em",
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {/* Top Row */}
                  <Grid item xs={6} md={6}>
                    <Image
                      src="/graphic1.png"
                      alt="Image 1"
                      layout="responsive"
                      width={100}
                      height={100}
                    />
                  </Grid>
                  <Grid item xs={6} md={6}>
                    <Image
                      src="/graphic2.png"
                      alt="Image 2"
                      layout="responsive"
                      width={100}
                      height={100}
                    />
                  </Grid>
                  {/* Bottom Row */}
                  <Grid item xs={6} md={6}>
                    <Image
                      src="/graphic3.png"
                      alt="Image 3"
                      layout="responsive"
                      width={100}
                      height={100}
                    />
                  </Grid>
                  <Grid item xs={6} md={6}>
                    <Image
                      src="/graphic1.png"
                      alt="Image 4"
                      layout="responsive"
                      width={100}
                      height={100}
                    />
                  </Grid>
                </Grid>
              </Grid>
          </>
        ) : (
              <Grid container sx={{
                height: '100%'
              }}>
                <Grid item xs={12} sx={{display: { md: 'none' }  }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={dashboardStyles.title}
                  >
                    Let’s Get Started!
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={dashboardStyles.description}>
                    Install our pixel on your website to start capturing anonymous
                    visitor data on your store.
                  </Typography>
                  <ProgressSection />
                  <PixelInstallation />
                  <VerifyPixelIntegration />
                </Grid>
                <Grid item xs={12} lg={8} sx={{display: { xs: 'none', md: 'block' }  }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={dashboardStyles.title}
                  >
                    Let’s Get Started!
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mb={4}>
                    Install our pixel on your website to start capturing anonymous
                    visitor data on your store.
                  </Typography>
                  <PixelInstallation />
                  <VerifyPixelIntegration />
                </Grid>
                <Grid item xs={12} lg={4} sx={{display: { xs: 'none', md: 'block' }  }}>
                  <ProgressSection />
                </Grid>
                <Grid item xs={12}>
                  <SupportSection />
                </Grid>
              </Grid>
        )}
      {showSlider && <Slider />}
    </>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SliderProvider>
        <Dashboard />
      </SliderProvider>
    </Suspense>
  );
};


export default DashboardPage;
