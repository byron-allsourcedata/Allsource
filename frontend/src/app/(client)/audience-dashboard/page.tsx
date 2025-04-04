"use client";
import React, { useState, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "../dashboard/dashboardStyles";
import CustomTooltip from "@/components/customToolTip";
import { useNotification } from "../../../context/NotificationContext";
import CustomCards from "./components/CustomCards";
import AudienceChart from "./components/AudienceChart";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import LookalikeCard from "./components/SelectedCards";

const colorMapping = {
  pixel_contacts: "rgba(244, 87, 69, 1)",
  sources: "rgba(80, 82, 178, 1)",
  lookalikes: "rgba(224, 176, 5, 1)",
  smart_audience: "rgba(144, 190, 109, 1)",
  data_sync: "rgba(5, 115, 234, 1)",
};

const AudienceDashboard: React.FC = () => {
  const [values, setValues] = useState({
    pixel_contacts: 0,
    sources: 0,
    lookalikes: 0,
    smart_audience: 0,
    data_sync: 0,
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const { hasNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<
    {
      id: keyof typeof colorMapping;
      label: string;
      curve: string;
      showMark: boolean;
      area: boolean;
      stackOrder: string;
      data: number[];
    }[]
  >([
    {
      id: "pixel_contacts" as keyof typeof colorMapping,
      label: "Pixel Contacts",
      curve: "linear",
      showMark: false,
      area: false,
      stackOrder: "ascending",
      data: [],
    },
    {
      id: "sources" as keyof typeof colorMapping,
      label: "Sources",
      curve: "linear",
      showMark: false,
      area: false,
      stackOrder: "ascending",
      data: [0],
    },
    {
      id: "lookalikes" as keyof typeof colorMapping,
      label: "Lookalikes",
      curve: "linear",
      showMark: false,
      area: false,
      stackOrder: "ascending",
      data: [0],
    },
    {
      id: "smart_audience" as keyof typeof colorMapping,
      label: "Smart Audience",
      curve: "linear",
      showMark: false,
      area: false,
      stackOrder: "ascending",
      data: [0],
    },
    {
      id: "data_sync" as keyof typeof colorMapping,
      label: "Data Sync",
      curve: "linear",
      showMark: false,
      area: false,
      stackOrder: "ascending",
      data: [0],
    },
  ]);
  const [date, setDays] = useState<string[]>([]);

  const handleCardClick = (card: string) => {
    if (selectedCard === card) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await axiosInterceptorInstance.get(
        "/audience-dashboard"
      );

      setValues((prev) => ({
        pixel_contacts:
          response.data?.total_counts.pixel_contacts ?? prev.pixel_contacts,
        sources: response.data?.total_counts.sources_count ?? prev.sources,
        lookalikes:
          response.data?.total_counts.lookalike_count ?? prev.lookalikes,
        smart_audience:
          response.data?.total_counts.smart_audience_count ??
          prev.smart_audience,
        data_sync:
          response.data?.total_counts.data_sync_count ?? prev.data_sync,
      }));
      const daily_data = response.data?.daily_data;
      console.log(daily_data);
      const days = Object.keys(daily_data).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const pixelContacts = days.map(
        (day) => daily_data[day].pixel_contacts || 0
      );
      const sourcesData = days.map((day) => daily_data[day].sources_count || 0);
      const lookalikesData = days.map(
        (day) => daily_data[day].lookalike_count || 0
      );
      const SmartAudinceData = days.map(
        (day) => daily_data[day].smart_count || 0
      );
      const dataSyncData = days.map((day) => daily_data[day].sync_count || 0);

      setSeries([
        {
          id: "pixel_contacts",
          label: "Pixel Contacts",
          data: pixelContacts,
          curve: "linear",
          showMark: false,
          area: false,
          stackOrder: "ascending",
        },
        {
          id: "sources",
          label: "Sources",
          data: sourcesData,
          curve: "linear",
          showMark: false,
          area: false,
          stackOrder: "ascending",
        },
        {
          id: "lookalikes",
          label: "Lookalikes",
          data: lookalikesData,
          curve: "linear",
          showMark: false,
          area: false,
          stackOrder: "ascending",
        },
        {
          id: "smart_audience",
          label: "Smart Audience",
          data: SmartAudinceData,
          curve: "linear",
          showMark: false,
          area: false,
          stackOrder: "ascending",
        },
        {
          id: "data_sync",
          label: "Data Sync",
          data: dataSyncData,
          curve: "linear",
          showMark: false,
          area: false,
          stackOrder: "ascending",
        },
      ]);
      setDays(days);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box>
      <Grid
        sx={{
          display: "flex",
          flexDirection: "column",
          "@media (max-width: 600px)": {
            paddingRight: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            position: "sticky",
            top: 0,
            pt: "12px",
            pb: "12px",
            pl: "8px",
            pr: "1.5rem",
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
          <Typography
            variant="h4"
            component="h1"
            className="first-sub-title"
            sx={{
              ...dashboardStyles.title,
              "@media (max-width: 600px)": {
                display: "none",
              },
            }}
          >
            Dashboard{" "}
            <CustomTooltip
              title={
                "Indicates the count of resolved identities and revenue figures for the specified time"
              }
              linkText="Learn More"
              linkUrl="https://maximizai.zohodesk.eu/portal/en/kb/maximiz-ai/dashboard"
            />
          </Typography>
          <Box
            sx={{
              display: "none",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "start",
              "@media (max-width: 600px)": {
                display: "flex",
              },
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              className="first-sub-title"
              sx={dashboardStyles.title}
            >
              Dashboard
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              pr: 2,
            }}
          >
            <Box
              sx={{
                width: "100%",
                mt: 1,
                ml: 0.125,
                mb: 1,
                "@media (max-width: 900px)": { mt: 0, mb: 0 },
              }}
            >
              <CustomCards values={values} onCardClick={handleCardClick} />
            </Box>
            {selectedCard ? (
              <Grid container justifyContent="center">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    {selectedCard === "Sources" && (
                      <LookalikeCard
                        title={`Source Audience ${index + 1}`}
                        description="Customer Conversions"
                        size={Math.floor(Math.random() * 10000)}
                        sizeLabel="Matched Records"
                        lookalikeSize=""
                        sourceName=""
                        date="April 2, 2025"
                      />
                    )}
                    {selectedCard === "Lookalikes" && (
                      <LookalikeCard
                        title={`My Lookalike ${index + 1}`}
                        description="Similarity Match"
                        size={Math.floor(Math.random() * 20000)}
                        sizeLabel="Lookalike Size"
                        lookalikeSize="Almost Identical 0-3%"
                        sourceName="Premium Buyers"
                        date="April 1, 2025"
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            ) : (
              <AudienceChart data={series} days={date} loading={loading} />
            )}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default AudienceDashboard;
