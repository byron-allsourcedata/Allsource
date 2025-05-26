"use client";
import { Box, Typography, Button, Grid } from "@mui/material";
import React, { useState, useEffect, Suspense } from "react";
import { datasyncStyle } from "./datasyncStyle";
import CustomTooltip from "@/components/customToolTip";
import FilterListIcon from "@mui/icons-material/FilterList";
import Image from "next/image";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import DataSyncList from "./components/DataSyncList";
import { useRouter } from "next/navigation";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import WelcomePopup from "@/components/first-time-screens/CreatePixelSourcePopup";

const centerContainerStyles = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  border: "1px solid rgba(235, 235, 235, 1)",
  borderRadius: 2,
  padding: 3,
  boxSizing: "border-box",
  width: "100%",
  textAlign: "center",
  flex: 1,
  "& img": {
    width: "auto",
    height: "auto",
    maxWidth: "100%",
  },
};
import FilterDatasync from "@/components/FilterDatasync";
import AudiencePopup from "@/components/AudienceSlider";
import { useNotification } from "@/context/NotificationContext";
import FirstTimeScree from "./components/FirstTimeScree";
import NotificationBanner from "@/components/first-time-screens/NotificationWarningBanner";
import { DashboardHelpCard } from "@/components/first-time-screens/HelpCard";
import { FirstTimeScreenCommonVariant1 } from "@/components/first-time-screens";
import AudienceSynergyPreview from "@/components/first-time-screens/AudienceSynergyPreview";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";

interface DataSyncProps {
  service_name?: string;
}

const DataSync = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPopup, setFilterPopup] = useState(false);
  const [filters, setFilters] = useState<any>();
  const [openCreateDataSyncPopup, setOpenCreateDataSyncPopup] = useState(false);
  const handleFilterPopupOpen = () => {
    setFilterPopup(true);
  };

  const handleAudiencePopupOpen = () => {
    setOpenCreateDataSyncPopup(true);
  };

  const handleAudiencePopupClose = () => {
    setOpenCreateDataSyncPopup(false);
  };
  const handleFilterPopupClose = () => {
    setFilterPopup(false);
  };

  const onApply = (filter: any) => {
    setFilters(filter);
  };

  const installPixel = () => {
    router.push("/dashboard");
  };

  const [popupOpen, setPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setPopupOpen(true);
  };

  const [hasIntegrations, setHasIntegrations] = useState<boolean>(false);
  const [hasDataSync, setHasDataSync] = useState<boolean>(false);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoading(true);
        const domain = sessionStorage.getItem("current_domain") || "";
        const response = await axiosInstance.get(
          "/data-sync/has-integration-and-smart-audiences",
          {
            headers: { domain },
          }
        );
        setHasIntegrations(response.data.hasIntegration);
        console.log(response.data.hasIntegration);
        setHasDataSync(response.data.hasAnySync);
      } catch (err) {
        console.error("Error checking integrations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  return (
    <>
      {isLoading && <CustomizedProgressBar />}
      {!isLoading && (
        <Box sx={datasyncStyle.mainContent}>
          {hasDataSync && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                pr: 2,
                "@media (max-width: 900px)": {
                  pt: hasNotification ? 5 : 0,
                },
                "@media (max-width: 400px)": {
                  pt: hasNotification ? 7 : 0,
                },
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  pl: "0.5rem",
                  gap: 1,
                  "@media (max-width: 900px)": { mb: 2 },
                }}
              >
                <Typography
                  className="first-sub-title"
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontSize: "16px",
                    lineHeight: "normal",
                    fontWeight: 600,
                    color: "#202124",
                  }}
                >
                  Data Sync
                </Typography>
                <CustomTooltip
                  title={
                    "How data synch works and to customise your sync settings."
                  }
                  linkText="Learn more"
                  linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/data-sync"
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "end",
                  mt: 2.05,
                  gap: "15px",
                  "@media (max-width: 900px)": {
                    gap: "8px",
                  },
                }}
              >
                <Button
                  onClick={handleFilterPopupOpen}
                  aria-haspopup="true"
                  sx={{
                    textTransform: "none",
                    color: "rgba(128, 128, 128, 1)",
                    border:
                      filters?.length > 0
                        ? "1px solid rgba(56, 152, 252, 1)"
                        : "1px solid rgba(184, 184, 184, 1)",
                    borderRadius: "4px",
                    padding: "8px",
                    minWidth: "auto",
                    position: "relative",
                    "@media (max-width: 900px)": {
                      border: "none",
                      padding: 0,
                    },
                  }}
                >
                  <FilterListIcon
                    fontSize="medium"
                    sx={{
                      color:
                        filters?.length > 0
                          ? "rgba(56, 152, 252, 1)"
                          : "rgba(128, 128, 128, 1)",
                    }}
                  />
                </Button>
              </Box>
            </Box>
          )}
          <Box
            sx={{
              width: "100%",
              pl: 0.5,
              pt: 0,
              pr: 1,
              "@media (max-width: 440px)": { pt: 3 },
            }}
          >
            {status === "PIXEL_INSTALLATION_NEEDED" && !isLoading ? (
              <Box sx={centerContainerStyles}>
                <Typography
                  variant="h5"
                  className="first-sub-title"
                  sx={{
                    mb: 3,
                    fontFamily: "Nunito Sans",
                    fontSize: "20px",
                    color: "#4a4a4a",
                    fontWeight: "600",
                    lineHeight: "28px",
                  }}
                >
                  Pixel Integration isn&apos;t completed yet!
                </Typography>
                <Image
                  src="/pixel_installation_needed.svg"
                  alt="Need Pixel Install"
                  height={250}
                  width={300}
                />
                <Typography
                  variant="body1"
                  className="table-data"
                  sx={{
                    mt: 3,
                    fontFamily: "Nunito Sans",
                    fontSize: "14px",
                    color: "#808080",
                    fontWeight: "600",
                    lineHeight: "20px",
                  }}
                >
                  Install the pixel to unlock and gain valuable insights! Start
                  viewing your leads now
                </Typography>
                <Button
                  variant="contained"
                  onClick={installPixel}
                  className="second-sub-title"
                  sx={{
                    backgroundColor: "rgba(56, 152, 252, 1)",
                    textTransform: "none",
                    padding: "10px 24px",
                    mt: 3,
                    color: "#fff !important",
                    ":hover": {
                      backgroundColor: "rgba(56, 152, 252, 1)",
                    },
                  }}
                >
                  Setup Pixel
                </Button>
              </Box>
            ) : !isLoading && filters && !hasDataSync ? (
              <>
                <Box sx={{ mt: 2 }}>
                  <FirstTimeScreenCommonVariant1
                    Header={{
                      TextTitle: "Data Sync",
                      TextSubtitle: "Customise your sync settings",
                      link: "https://allsourceio.zohodesk.com/portal/en/kb/articles/data-sync",
                    }}
                    WarningNotification={{
                      condition: !hasIntegrations,
                      ctaUrl: "/integrations",
                      ctaLabel: "Add Integration",
                      message:
                        "You need to create at least one integration before you can sync your audience",
                    }}
                    InfoNotification={{
                      Text: "This page shows real-time synchronization status across all your integrated platforms. Monitor data flows, troubleshoot delays, and ensure all systems are updating properly.",
                    }}
                    Content={
                      <>
                        <AudienceSynergyPreview
                          tableSrc="/data_sync_FTS.svg"
                          headerTitle="Sync Audience to Any Platform"
                          caption="Send your audience segments to connected platforms like Meta Ads, Google Ads, and Mailchimp with one click."
                          onOpenPopup={handleOpenPopup}
                          onBegin={() => router.push("/smart-audiences")}
                          beginDisabled={!hasIntegrations}
                          buttonLabel="Create Data Sync"
                        />
                      </>
                    }
                    HelpCard={{
                      headline: "Need Help with Data Synchronization?",
                      description:
                        "Book a free 30-minute session to troubleshoot, optimize, or automate your data flows.",
                      helpPoints: [
                        {
                          title: "Connection Setup",
                          description: "Configure integrations correctly",
                        },
                        {
                          title: "Sync Diagnostics",
                          description: "Fix failed data transfers",
                        },
                        {
                          title: "Mapping Assistance",
                          description: "Align your data fields",
                        },
                      ],
                    }}
                    LeftMenu={{
                      header: "Fix & Optimize Your Data Flows",
                      subtitle: "Free 30-Min Sync Audit",
                      image: {
                        url: "/data_sync_FTS.svg",
                        width: 600,
                        height: 300
                      },
                      items: [
                        {
                          Icon: SettingsIcon,
                          title: "Connection Setup",
                          subtitle: `We’ll ensure your integrations are properly configured for reliable data flow.`,
                        },
                        {
                          Icon: SpeedIcon,
                          title: "Sync Diagnostics",
                          subtitle: `Identify and resolve synchronization failures in real-time.`,
                        },
                        {
                          Icon: MovingIcon,
                          title: "Mapping Assistance",
                          subtitle: "Align your source and destination fields perfectly.",
                        },
                      ],
                    }}
                    customStyleSX={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "70%",
                      margin: "0 auto",
                      mt: 2,
                    }}
                  />
                  {popupOpen && !hasDataSync && (
                    <WelcomePopup
                      open={popupOpen}
                      onClose={() => setPopupOpen(false)}
                      variant="integration"
                    />
                  )}
                </Box>

              </>
            ) : (
              <>
                <DataSyncList filters={filters} />
              </>
            )}
          </Box>
        </Box>
      )}
      <FilterDatasync
        open={filterPopup}
        onClose={handleFilterPopupClose}
        onApply={onApply}
      />
      <AudiencePopup
        open={openCreateDataSyncPopup}
        onClose={handleAudiencePopupClose}
      />
    </>
  );
};

const DatasyncPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <DataSync />
    </Suspense>
  );
};

export default DatasyncPage;
