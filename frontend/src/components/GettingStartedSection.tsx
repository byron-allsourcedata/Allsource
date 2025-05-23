import React, { useEffect, useState } from "react";
import { Box, Link as MuiLink, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "@/app/(client)/dashboard/dashboardStyles";
import {
  StepConfig,
  VerticalStepper,
} from "@/app/(client)/dashboard/components/VerticalStepper";
import PixelInstallation from "@/app/(client)/dashboard/components/PixelInstallation";
import VerifyPixelIntegration from "../components/VerifyPixelIntegration";
import RevenueTracking from "@/components/RevenueTracking";
import CustomTooltip from "@/components/customToolTip";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DomainVerificationOutlinedIcon from "@mui/icons-material/DomainVerificationOutlined";
import OpenInBrowserOutlinedIcon from "@mui/icons-material/OpenInBrowserOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import DomainSelector from "@/app/(client)/dashboard/components/DomainSelector";
import { FirstTimeScreenCommon } from "./first-time-screens";

const GettingStartedSection: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>("");
  const [stepData, setStepData] = useState<StepConfig[]>([
    {
      label: "Choose a domain",
      status: "active",
      icon: (
        <DomainVerificationOutlinedIcon
          sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
        />
      ),
    },
    {
      label: "Select Installation Method",
      status: "default",
      icon: (
        <OpenInBrowserOutlinedIcon
          sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
        />
      ),
    },
    {
      label: "Verify integration",
      status: "default",
      icon: (
        <VerifiedIcon
          sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
        />
      ),
    },
  ]);

  useEffect(() => {
    if (selectedDomain !== "") {
      setStepData((prev) => [
        { ...prev[0], status: "completed" },
        { ...prev[1], status: "active" },
        { ...prev[2], status: "default" },
      ]);
    } else {
      setStepData((prev) => [
        { ...prev[0], status: "completed" },
        { ...prev[1], status: "default" },
        { ...prev[2], status: "default" },
      ]);
    }
  }, [selectedDomain]);

  const defaultStepIcons = [
    <DomainVerificationOutlinedIcon
      key="domain-verification"
      sx={{ color: "white", fontSize: "17px" }}
    />,
    <OpenInBrowserOutlinedIcon
      key="open-in-browser"
      sx={{ color: "white", fontSize: "17px" }}
    />,
    <VerifiedIcon key="verified" sx={{ color: "white", fontSize: "17px" }} />,
  ];

  const handleInstallSelected = (
    method: "manual" | "google" | "cms" | null
  ) => {
    if (method === null) {
      const newStepData: StepConfig[] = [
        {
          label: "Choose a domain",
          status: "completed",
          icon: defaultStepIcons[0],
        },
        {
          label: "Select Installation Method",
          status: "active",
          icon: defaultStepIcons[1],
        },
        {
          label: "Verify integration",
          status: "default",
          icon: defaultStepIcons[2],
        },
      ];
      setStepData(newStepData);
    } else {
      const newStepData: StepConfig[] = [
        {
          label: "Choose a domain",
          status: "completed",
          icon: defaultStepIcons[0],
        },
        {
          label: "Select Installation Method",
          status: "completed",
          icon: defaultStepIcons[1],
        },
        {
          label: "Verify integration",
          status: "active",
          icon: defaultStepIcons[2],
        },
      ];
      setStepData(newStepData);
    }
  };

  return (
    <>
      <FirstTimeScreenCommon
        Header={{
          TextTitle: "Analytics",
          TextSubtitle:
            "Contacts automatically sync across devices and platforms",
          link: "https://allsourceio.zohodesk.com/portal/en/kb/articles/analytics",
        }}
        InfoNotification={{
          Text: "This page shows complete performance data from your tracking pixel, revealing how users interact with your website. Analyze conversion paths, drop-off points, and audience behavior to optimize campaigns.",
        }}
        Content={
          <>
            <Grid container sx={{ height: "100%", pt: 3, pr: 2 }}>
              <Grid
                item
                xs={12}
                sx={{ display: { md: "none" }, overflow: "hidden" }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  className="first-sub-title"
                  sx={dashboardStyles.title}
                >
                  Install Your Pixel
                </Typography>
                <VerticalStepper steps={stepData} />
                <DomainSelector
                  onDomainSelected={(domain) => {
                    setSelectedDomain(domain.domain);
                  }}
                />
                {selectedDomain !== "" && (
                  <PixelInstallation
                    onInstallSelected={(method) => {
                      handleInstallSelected(method);
                    }}
                  />
                )}

                <VerifyPixelIntegration domain={selectedDomain} />
                <RevenueTracking />
              </Grid>
              <Grid
                item
                xs={12}
                lg={8}
                sx={{
                  display: { xs: "none", md: "block" },
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    className="first-sub-title"
                    sx={{
                      ...dashboardStyles.title,
                      textAlign: "center",
                      display: "inline",
                      m: 0,
                    }}
                  >
                    Install Your Pixel
                  </Typography>
                  <MuiLink
                    href="https://allsourceio.zohodesk.com/portal/en/kb/allsource/install-pixel"
                    target="_blank"
                    underline="hover"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      fontWeight: 300,
                      color: "#3898FC",
                      fontSize: "1rem",
                    }}
                  >
                    Learn more <OpenInNewIcon sx={{ fontSize: 14 }} />
                  </MuiLink>
                </Box>

                <Box sx={{ pl: 8, mt: 3 }}>
                  <DomainSelector
                    onDomainSelected={(domain) => {
                      setSelectedDomain(domain.domain);
                    }}
                  />
                  {selectedDomain !== "" && (
                    <PixelInstallation
                      onInstallSelected={(method) => {
                        handleInstallSelected(method);
                        setSelectedMethod(method);
                      }}
                    />
                  )}
                  {selectedDomain !== "" &&
                    selectedMethod !== "" &&
                    selectedMethod !== null && (
                      <VerifyPixelIntegration domain={selectedDomain} />
                    )}
                </Box>
              </Grid>

              <Grid
                item
                xs={12}
                lg={3}
                sx={{ display: { xs: "none", md: "block" }, mt: 6 }}
              >
                <VerticalStepper steps={stepData} />
              </Grid>

              {/* <Grid
        sx={{
          mb: 3,
          pr: 12,
          pl: 8,
          width: "100%",
          "@media (max-width: 1200px)": { pr: 0, pl: 2, mt: 2 },
          "@media (max-width: 900px)": { pl: 0, mt: 2 },
        }}
      >
        <DashboardHelpCard
          headline="Need Help with Pixel Setup?"
          description="Book a 30-minute call, and our expert will guide you through the platform and troubleshoot any pixel issues."
          helpPoints={[
            {
              title: "Quick Setup Walkthrough",
              description: "Step-by-step pixel installation help",
            },
            {
              title: "Troubleshooting Session",
              description: "Fix errors and verify your pixel",
            },
            {
              title: "Platform Demo",
              description: "See how everything works in action",
            },
          ]}
        />
      </Grid> */}

              {/* <Grid item xs={12}>
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            width: "86%",
            "@media (max-width: 1400px)": {
              position: "static",
              width: "100%",
            },
          }}
        >
          <Box
            sx={{
              padding: "1em 0em 1em 1em",
              borderRadius: "8px",
              backgroundColor: "#fff",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              textAlign: "left",
              width: "100%",
              border: "1px solid rgba(228, 228, 228, 1)",
              "@media (max-width: 1199px)": {
                width: "100%",
                position: "relative",
                padding: "1em 0em 1.5em 1em",
                borderRadius: "4px",
                border: "0.0625rem solid #E4E4E4",
                background: "#F7F7F7",
              },
              "@media (max-width: 900px)": {
                marginBottom: 0,
              },
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
                  pt: "0.5em",
                  color: "rgba(56, 152, 252, 1)",
                  fontFamily: "Nunito Sans",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  lineHeight: "22.4px",
                  backgroundColor: "transparent",
                  textTransform: "none",
                  cursor: "pointer",
                  marginLeft: "1.5em",
                  gap: "8px",
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
              <ManualPopup
                open={openManually}
                handleClose={handleManualClose}
                pixelCode={pixelCode}
              />
              {isLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1,
                  }}
                >
                  <CustomizedProgressBar />
                </Box>
              )}
            </Grid>
          </Box>
        </Box>
      </Grid> */}
            </Grid>
          </>
        }
        HelpCard={{
          headline: "Need Help with Pixel Setup?",
          description:
            "Book a 30-minute call, and our expert will guide you through the platform and troubleshoot any pixel issues.",
          helpPoints: [
            {
              title: "Quick Setup Walkthrough",
              description: "Step-by-step pixel installation help",
            },
            {
              title: "Troubleshooting Session",
              description: "Fix errors and verify your pixel",
            },
            {
              title: "Platform Demo",
              description: "See how everything works in action",
            },
          ],
        }}
        customStyleSX={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "90%",
          margin: "0 auto",
          mt: 2,
        }}
      />
    </>
  );
};

export default GettingStartedSection;
