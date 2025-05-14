import React, { useState, } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "@/app/(client)/dashboard/dashboardStyles";
import CustomTooltip from "@/components/customToolTip";
import { ProgressSection } from "@/app/(client)/dashboard/components/ProgressSection";
import PixelInstallation from "@/app/(client)/dashboard/components/PixelInstallation";
import VerifyPixelIntegration from "../components/VerifyPixelIntegration";
import RevenueTracking from "@/components/RevenueTracking";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance"
import { SliderProvider, useSlider } from "@/context/SliderContext";
import axios, { AxiosError } from "axios";
import CustomizedProgressBar from "./CustomizedProgressBar";
import ManualPopup from "@/app/(client)/dashboard/components/ManualPopup";
import Image from "next/image";
import SendIcon from '@mui/icons-material/Send';
import { showErrorToast } from "./ToastNotification";


const GettingStartedSection: React.FC = () => {
  const [openManually, setOpen] = useState(false);
  const [pixelCode, setPixelCode] = useState("");
  const { setShowSlider } = useSlider();
  const [isLoading, setIsLoading] = useState(false);

  const installManually = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInterceptorInstance.get(
        "/install-pixel/manually"
      );
      setPixelCode(response.data.manual);
      setOpen(true);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;
        if (status === 400 && data?.status === "DOMAIN_NOT_FOUND") {
          showErrorToast("Please set up your domain to continue");
          return;
        }
        if (status === 403 && data?.status === "NEED_BOOK_CALL") {
          const flag = error.response.data.status === "NEED_BOOK_CALL";
          sessionStorage.setItem(
            "is_slider_opened",
            flag ? "true" : "false"
          );
          setShowSlider(flag);
        }
        else {
          console.error("Error fetching data:", error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }
  const sendEmail = () => installManually();
  const handleManualClose = () => setOpen(false);

  return (
    <Grid container sx={{ height: '100%', pt: 3, pr: 2 }}>
      <Grid item xs={12} sx={{ display: { md: 'none' }, overflow: 'hidden' }}>
        <Typography
          variant="h4"
          component="h1"
          className="heading-text"
          sx={dashboardStyles.title}
        >
          Let&apos;s Get Started!
        </Typography>
        <Typography className="table-data" sx={dashboardStyles.description}>
          Install our pixel on your website to start capturing anonymous visitor data on your store.
        </Typography>
        <ProgressSection />
        <PixelInstallation />
        <VerifyPixelIntegration />
        <RevenueTracking />
      </Grid>

      <Grid
        item
        xs={12}
        lg={8}
        sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}
      >
        <Typography
          variant="h4"
          component="h1"
          className="heading-text"
          sx={dashboardStyles.title}
        >
          Let’s Get Started!{' '}
          <CustomTooltip
            title="Boost engagement and reduce cart abandonment with personalized messages tailored for your visitors."
            linkText="Learn more"
            linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/allsource"
          />
        </Typography>
        <Typography
          className="table-data"
          sx={{ ...dashboardStyles.description, mb: 4 }}
        >
          Install our pixel on your website to start capturing anonymous visitor data on your store.
        </Typography>
        <PixelInstallation />
        <VerifyPixelIntegration />
      </Grid>

      <Grid
        item
        xs={12}
        lg={4}
        sx={{ display: { xs: 'none', md: 'block' } }}
      >
        <ProgressSection />
      </Grid>

      <Grid item xs={12}>
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
                  color: "rgba(56, 152, 252, 1)",
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
                <SendIcon
                  sx={{
                    color: "rgba(56, 152, 252, 1)",
                    fontSize: 20,
                  }}
                />
              </Button>
              <ManualPopup open={openManually} handleClose={handleManualClose} pixelCode={pixelCode} />
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
      </Grid>
    </Grid>
  )
};

export default GettingStartedSection;
