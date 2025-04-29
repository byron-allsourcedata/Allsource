"use client";
import { Box, Typography, Button, Tabs, Tab, IconButton } from "@mui/material";
import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/navigation";
import { insightsStyle } from "./insightsStyles";

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
import { useNotification } from "@/context/NotificationContext";
import { IconFillIndicator } from "./components/CustomChart";
import { DateRangeIcon } from "@mui/x-date-pickers";
import { dashboardStyles } from "../../../dashboard/dashboardStyles";
import { TabPanel } from "@/components/TabPanel";
import StaticticsTab from "./components/StaticticsTab";

import CustomTooltip from "@/components/customToolTip";
import PredictableFields from "./components/PredictableFields";

const Insights = () => {
  const router = useRouter();
  const params = useParams();
  const type = params.type;
  const { hasNotification } = useNotification();
  const [tabIndex, setTabIndex] = useState(0);
  const [name, setName] = useState<string>("");

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const handleSetName = (newName: string) => {
    setName(newName);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          position: "sticky",
          top: 0,
          pt: "10px",
          pr: type === "sources" ? "5rem" : "1.5rem",
          pl: 0,
          zIndex: 1,
          backgroundColor: "#fff",
          justifyContent: "space-between",
          width: "100%",
          "@media (max-width: 600px)": {
            flexDirection: "column",
            display: "flex",
            alignItems: "flex-start",
            zIndex: 1,
            width: "100%",
            pr: 1.5,
          },
          "@media (max-width: 440px)": {
            flexDirection: "column",
            pt: hasNotification ? "3rem" : "0.75rem",
            top: hasNotification ? "4.5rem" : "",
            zIndex: 1,
            justifyContent: "flex-start",
          },
          "@media (max-width: 400px)": {
            pt: hasNotification ? "4.25rem" : "",
            pb: "6px",
          },
        }}
      >
        <IconButton
          onClick={() => {
            router.push("/insights");
          }}
          sx={{
            ":hover": {
              backgroundColor: "transparent",
            },
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          <ArrowBackIcon sx={{ color: "#5052B2" }} />
        </IconButton>
        <Typography
          variant="h4"
          component="h1"
          className="first-sub-title"
          sx={{
            ...insightsStyle.title,
            position: "fixed",
            ml: 6,
            mt: 1,
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          {type === "sources" ? "Source" : "Lookalike"} - {name}
          <CustomTooltip title="Insights" />
        </Typography>
        <Box
          sx={{
            display: "none",
            width: "100%",
            justifyContent: "start",
            alignItems: "center",
            "@media (max-width: 600px)": {
              display: "flex",
            },
          }}
        >
          <IconButton
            onClick={() => {
              router.push("/insights");
            }}
            sx={{
              "@media (max-width: 600px)": {},
            }}
          >
            <ArrowBackIcon sx={{ color: "#5052B2" }} />
          </IconButton>
          <Typography
            variant="h4"
            component="h1"
            className="first-sub-title"
            sx={{ ...dashboardStyles.title, mb: 0 }}
          >
            {type === "sources" ? "Source" : "Lookalike"} - {name}
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "start",
            "@media (max-width: 600px)": {
              width: "100%",
              mt: hasNotification ? 1 : 2,
            },
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            sx={{
              textTransform: "none",
              minHeight: 0,
              cursor: type === "sources" ? 'none' : 'pointer',
              alignItems: "start",
              "& .MuiTabs-indicator": {
                backgroundColor: "rgba(80, 82, 178, 1)",
                height: type === "sources" ? "0px" : "1.4px",
              },
              "@media (max-width: 600px)": {
                border: "1px solid rgba(228, 228, 228, 1)",
                borderRadius: "4px",
                width: "100%",
                "& .MuiTabs-indicator": {
                  height: "0",
                },
              },
            }}
            aria-label="insights tabs"
          >
            <Tab
              className="main-text"
              sx={{
                textTransform: "none",
                padding: "4px 24px",
                flexGrow: 1,
                minHeight: "auto",
                minWidth: "120px",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "19.1px",
                textAlign: "left",
                "&.Mui-selected": {
                  color: "rgba(80, 82, 178, 1)",
                },
                "@media (max-width: 600px)": {
                  mr: 0,
                  borderRadius: "4px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(249, 249, 253, 1)",
                    border: "1px solid rgba(220, 220, 239, 1)",
                  },
                },
              }}
              label="Statistics"
            />
            {type !== "sources" &&
              <Tab
                className="main-text"
                sx={{
                  textTransform: "none",
                  padding: "4px 10px",
                  minHeight: "auto",
                  flexGrow: 1,
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: "19.1px",
                  minWidth: "120px",
                  "&.Mui-selected": {
                    color: "rgba(80, 82, 178, 1)",
                  },
                  "@media (max-width: 600px)": {
                    mr: 0,
                    borderRadius: "4px",
                    "&.Mui-selected": {
                      backgroundColor: "rgba(249, 249, 253, 1)",
                      border: "1px solid rgba(220, 220, 239, 1)",
                    },
                  },
                }}
                label="Predictable fields"
              />}
          </Tabs>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <TabPanel value={tabIndex} index={0}>
          <StaticticsTab setName={handleSetName} />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <PredictableFields />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Insights;
