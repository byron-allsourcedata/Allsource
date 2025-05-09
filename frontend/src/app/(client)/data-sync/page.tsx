"use client";
import { Box, Typography, Button } from "@mui/material";
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

interface DataSyncProps {
  service_name?: string;
}

const DataSync = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  if (isLoading) {
    return <CustomizedProgressBar />;
  }
  const hasIntegrations   = false;

  return (
    <>
    {isLoading && <CustomizedProgressBar />}
    {!hasIntegrations && (
      <>
        <Box>
        <Box
                          sx={{
                            border: "1px solid rgba(224, 49, 48, 1)",
                            display: "flex",
                            flexDirection: "row",
                            width: "98%",
                            padding: 2,
                            borderRadius: "4px",
                            mb: 3,
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              width: "100%",
                              gap: 2,
                              alignItems: "center",
                            }}
                          >
                            <ReportProblemOutlinedIcon
                              sx={{ fontSize: "20px", color: "rgba(230, 90, 89, 1)" }}
                            />
                            <Typography className="second-sub-title">
                              You need to import at least one source to create a
                              lookalike
                            </Typography>
                          </Box>
        
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              width: "100%",
                              gap: 2,
                              alignItems: "center",
                              justifyContent: "end",
                            }}
                          >
                            <Button
                              sx={{
                                textTransform: "none",
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "rgba(224, 49, 48, 1) !important",
                              }}
                              onClick={() => {
                                // setShowNotification(false);
                              }}
                            >
                              Dismiss
                            </Button>
                            <Button
                              onClick={() => {
                                router.push("/integrations");
                              }}
                              sx={{
                                textTransform: "none",
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "rgba(255, 255, 255, 1) !important",
                                backgroundColor: "rgba(224, 49, 48, 1)",
                                "&:hover": {
                                  backgroundColor: "rgba(224, 49, 48, 0.85)",
                                },
                              }}
                            >
                              Add Integration
                            </Button>
                          </Box>
                        </Box>
                        <FirstTimeScree>
        
      </FirstTimeScree>
      </Box>
      </>
      
    )}
      {hasIntegrations && (
      <Box sx={datasyncStyle.mainContent}>
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
              linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/articles/data-sync"
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
                    ? "1px solid rgba(80, 82, 178, 1)"
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
                      ? "rgba(80, 82, 178, 1)"
                      : "rgba(128, 128, 128, 1)",
                }}
              />
            </Button>
          </Box>
        </Box>
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
                  backgroundColor: "rgba(80, 82, 178, 1)",
                  textTransform: "none",
                  padding: "10px 24px",
                  mt: 3,
                  color: "#fff !important",
                  ":hover": {
                    backgroundColor: "rgba(80, 82, 178, 1)",
                  },
                }}
              >
                Setup Pixel
              </Button>
            </Box>
          ) : (
            !isLoading &&
            filters && (
              <>
                <DataSyncList filters={filters} />
              </>
            )
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
