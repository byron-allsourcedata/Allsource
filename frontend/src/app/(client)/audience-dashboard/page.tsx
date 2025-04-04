"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { dashboardStyles } from "../dashboard/dashboardStyles";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import CustomTooltip from "@/components/customToolTip";
import { useNotification } from "../../../context/NotificationContext";
import dayjs from "dayjs";
import Image from "next/image";
import CustomCards from "./components/CustomCards";
import ExampleChart from "./components/ExampleChart";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { ShowChart, BarChart as IconBarChart } from "@mui/icons-material";

const mockData = [
  {
    pixel_contacts: 120,
    sources: 300,
    lookalikes: 150,
    smart_audience: 50,
    data_sync: 20,
  },
  {
    pixel_contacts: 100,
    sources: 280,
    lookalikes: 140,
    smart_audience: 45,
    data_sync: 25,
  },
  {
    pixel_contacts: 130,
    sources: 320,
    lookalikes: 160,
    smart_audience: 55,
    data_sync: 30,
  },
  {
    pixel_contacts: 140,
    sources: 340,
    lookalikes: 170,
    smart_audience: 60,
    data_sync: 35,
  },
  {
    pixel_contacts: 150,
    sources: 360,
    lookalikes: 180,
    smart_audience: 65,
    data_sync: 40,
  },
  {
    pixel_contacts: 160,
    sources: 380,
    lookalikes: 190,
    smart_audience: 70,
    data_sync: 45,
  },
  {
    pixel_contacts: 170,
    sources: 400,
    lookalikes: 200,
    smart_audience: 75,
    data_sync: 50,
  },
  {
    pixel_contacts: 180,
    sources: 420,
    lookalikes: 210,
    smart_audience: 80,
    data_sync: 55,
  },
  {
    pixel_contacts: 190,
    sources: 440,
    lookalikes: 220,
    smart_audience: 85,
    data_sync: 60,
  },
  {
    pixel_contacts: 200,
    sources: 460,
    lookalikes: 230,
    smart_audience: 90,
    data_sync: 65,
  },
  {
    pixel_contacts: 210,
    sources: 480,
    lookalikes: 240,
    smart_audience: 95,
    data_sync: 70,
  },
  {
    pixel_contacts: 220,
    sources: 500,
    lookalikes: 250,
    smart_audience: 100,
    data_sync: 75,
  },
];

const CustomIcon = () => (
  <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
);

const AudienceDashboard: React.FC = () => {
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const [values, setValues] = useState({
    pixel_contacts: 0,
    sources: 0,
    lookalikes: 0,
    smart_audience: 0,
    data_sync: 0,
  });
  const { hasNotification } = useNotification();

  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [loading, setLoading] = useState(true);

  const isLargeScreen = useMediaQuery("(min-width:1200px)");
  const isMediumScreen = useMediaQuery("(min-width:768px)");
  const isMobile = useMediaQuery("(max-width: 380px)");

  const mainchartSize = isLargeScreen
    ? 450
    : isMediumScreen
    ? 300
    : isMobile
    ? 200
    : 260;

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

  const toggleChartType = (type: "line" | "bar") => {
    setChartType(type);
  };

  const colorPalette = [
    "rgba(244, 87, 69, 1)",
    "rgba(80, 82, 178, 1)",
    "rgba(224, 176, 5, 1)",
    "rgba(144, 190, 109, 1)",
    "rgba(5, 115, 234, 1)",
  ];

  const colorMapping = {
    pixel_contacts: "rgba(244, 87, 69, 1)",
    sources: "rgba(80, 82, 178, 1)",
    lookalikes: "rgba(224, 176, 5, 1)",
    smart_audience: "rgba(144, 190, 109, 1)",
    data_sync: "rgba(5, 115, 234, 1)",
  };

  type VisibleSeries = {
    pixel_contacts: boolean;
    sources: boolean;
    lookalikes: boolean;
    smart_audience: boolean;
    data_sync: boolean;
  };

  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    pixel_contacts: true,
    sources: true,
    lookalikes: true,
    smart_audience: true,
    data_sync: true,
  });

  const handleChipClick = (seriesId: keyof VisibleSeries) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [seriesId]: !prev[seriesId],
    }));
  };

  const options = [
    {
      id: "pixel_contacts",
      label: "Pixel Contacts",
      color: "rgba(244, 87, 69, 1)",
    },
    {
      id: "sources_count",
      label: "Sources",
      color: "rgba(80, 82, 178, 1)",
    },
    {
      id: "lookalike_count",
      label: "Lookalikes",
      color: "rgba(224, 176, 5, 1)",
    },
    {
      id: "smart_count",
      label: "Smart Audience",
      color: "rgba(144, 190, 109, 1)",
    },
    {
      id: "sync_count",
      label: "Data Sync",
      color: "rgba(5, 115, 234, 1)",
    },
  ];

  const selectedGraphs = options
    .filter((option) => visibleSeries[option.id as keyof VisibleSeries])
    .map((option) => option.id);

  const handleToggleSeries = (event: SelectChangeEvent<string[]>) => {
    const selectedValues = event.target.value as string[];

    setVisibleSeries((prev) => {
      const updatedVisibleSeries: VisibleSeries = { ...prev };

      if (selectedValues.includes("All options")) {
        if (selectedValues.length === 1) {
          options.forEach((option) => {
            updatedVisibleSeries[option.id as keyof VisibleSeries] = true;
          });
        } else {
          options.forEach((option) => {
            updatedVisibleSeries[option.id as keyof VisibleSeries] = false;
          });
        }
      } else {
        options.forEach((option) => {
          updatedVisibleSeries[option.id as keyof VisibleSeries] =
            selectedValues.includes(option.id);
        });
      }

      return updatedVisibleSeries;
    });
  };

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
  >(
    [
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
    ].filter((s) => visibleSeries[s.id as keyof VisibleSeries])
  );

  const [data, setDays] = useState<string[]>([]);
  const formattedData = data.map((dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  });
  const filteredSeries = series.filter(
    (s) => visibleSeries[s.id as keyof VisibleSeries]
  ) as [];
  const filteredSeriescolor = series.filter(
    (s) => visibleSeries[s.id as keyof VisibleSeries]
  );

  interface Series {
    id: string;
    label: string;
    data: number[];
    curve?: string;
    stack?: string;
    showMark?: boolean;
    area?: boolean;
    stackOrder?: string;
  }

  interface AggregatedResult {
    aggregatedData: string[];
    aggregatedSeries: Series[];
  }
  function aggregateData(
    formattedData: string[],
    series: Series[],
    period: number
  ): AggregatedResult {
    let aggregatedData: string[] = [];
    let aggregatedSeries: Series[] = [];

    if (period <= 7) {
      return {
        aggregatedData: formattedData,
        aggregatedSeries: series,
      };
    }

    if (period <= 30) {
      const weeklyData: Record<string, Record<string, number[]>> = {};
      formattedData.forEach((date, index) => {
        const weekStart = dayjs(date).startOf("week").format("MMM DD");
        if (!weeklyData[weekStart]) weeklyData[weekStart] = {};

        series.forEach((s) => {
          if (!weeklyData[weekStart][s.id]) weeklyData[weekStart][s.id] = [];
          weeklyData[weekStart][s.id].push(s.data[index]);
        });
      });

      aggregatedData = Object.keys(weeklyData);
      aggregatedSeries = series.map((s) => ({
        ...s,
        data: aggregatedData.map((week) => {
          const weekData = weeklyData[week][s.id];
          return weekData ? Math.max(...weekData) : 0;
        }),
      }));
    } else {
      const monthlyData: Record<string, Record<string, number[]>> = {};
      formattedData.forEach((date, index) => {
        const month = dayjs(date).format("MMM YYYY");
        if (!monthlyData[month]) monthlyData[month] = {};

        series.forEach((s) => {
          if (!monthlyData[month][s.id]) monthlyData[month][s.id] = [];
          monthlyData[month][s.id].push(s.data[index]);
        });
      });

      aggregatedData = Object.keys(monthlyData);
      aggregatedSeries = series.map((s) => ({
        ...s,
        data: aggregatedData.map((month) => {
          const monthData = monthlyData[month][s.id];
          return monthData ? Math.max(...monthData) : 0;
        }),
      }));
    }

    return { aggregatedData, aggregatedSeries };
  }

  const periodInDays = dayjs(formattedData[formattedData.length - 1]).diff(
    dayjs(formattedData[0]),
    "day"
  );
  const { aggregatedData, aggregatedSeries } = aggregateData(
    formattedData,
    filteredSeries,
    periodInDays
  );

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
              <CustomCards values={values} />
            </Box>
            <Card variant="outlined" sx={{ width: "100%" }}>
              <CardContent sx={{ paddingLeft: 0 }}>
                <Stack
                  sx={{
                    justifyContent: "space-between",
                    flexDirection: "row",
                    "@media (max-width: 900px)": {
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "start",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignContent: { xs: "center", sm: "flex-start" },
                      alignItems: "center",
                      gap: 2,
                      "@media (max-width: 600px)": {
                        width: "100%",
                        justifyContent: "flex-end",
                        display: "flex",
                        alignItems: "flex-end",
                      },
                    }}
                  >
                    <Box
                      sx={{ display: "flex", flexDirection: "row", gap: 1.5 }}
                    >
                      <IconButton
                        onClick={() => toggleChartType("line")}
                        sx={{
                          width: "20px",
                          ml: 5.5,
                          height: "20px",
                          borderRadius: "4px",
                          border: `1.5px solid ${
                            chartType === "line"
                              ? "rgba(80, 82, 178, 1)"
                              : "rgba(115, 115, 115, 1)"
                          }`,
                          color:
                            chartType === "line"
                              ? "rgba(80, 82, 178, 1)"
                              : "rgba(115, 115, 115, 1)",
                          "@media (max-width: 600px)": {
                            ml: 2,
                          },
                        }}
                      >
                        <ShowChart sx={{ fontSize: "20px" }} />
                      </IconButton>

                      <IconButton
                        onClick={() => toggleChartType("bar")}
                        sx={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: `1.5px solid ${
                            chartType === "bar"
                              ? "rgba(80, 82, 178, 1)"
                              : "rgba(115, 115, 115, 1)"
                          }`,
                          color:
                            chartType === "bar"
                              ? "rgba(80, 82, 178, 1)"
                              : "rgba(115, 115, 115, 1)",
                        }}
                      >
                        <IconBarChart sx={{ fontSize: "20px" }} />
                      </IconButton>
                    </Box>
                  </Stack>

                  <Stack
                    direction="row"
                    sx={{
                      alignContent: { xs: "center", sm: "flex-start" },
                      alignItems: "center",
                      gap: 1,
                      justifyContent: "end",
                      direction: "column",
                      width: "100%",
                    }}
                  >
                    {Object.keys(visibleSeries).map((seriesId, index) => (
                      <Chip
                        key={seriesId}
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: colorPalette[index],
                              }}
                            />
                            <Typography
                              className="paragraph"
                              sx={{
                                fontFamily: "Roboto",
                                fontSize: "12px",
                                textTransform: "none",
                                textAlign: "left",
                                color: "rgba(95, 99, 104, 1)",
                              }}
                            >
                              {seriesId
                                .replace(/_/g, " ")
                                .replace(
                                  /^(.)(.*)$/,
                                  (match, p1, p2) =>
                                    p1.toUpperCase() + p2.toLowerCase()
                                )}
                            </Typography>
                          </Box>
                        }
                        onClick={() =>
                          handleChipClick(seriesId as keyof VisibleSeries)
                        }
                        sx={{
                          cursor: "pointer",
                          backgroundColor: visibleSeries[
                            seriesId as keyof VisibleSeries
                          ]
                            ? "rgba(237, 237, 247, 1)"
                            : "#fff",
                          borderRadius: "4px",
                          maxHeight: "25px",
                          border: "none",
                          "@media (max-width: 900px)": { display: "none" },
                        }}
                        variant={
                          visibleSeries[seriesId as keyof VisibleSeries]
                            ? "filled"
                            : "outlined"
                        }
                      />
                    ))}

                    <Box
                      sx={{
                        "@media (min-width: 900px)": { display: "none" },
                        width: "100%",
                        mt: 1,
                        mb: 1,
                        ml: 2,
                      }}
                    >
                      <Select
                        multiple
                        value={selectedGraphs}
                        onChange={handleToggleSeries}
                        displayEmpty
                        renderValue={(selected) => {
                          const isAllSelected =
                            selected.length === options.length;

                          return isAllSelected
                            ? "All contacts type"
                            : selected
                                .map(
                                  (id) =>
                                    options.find((option) => option.id === id)
                                      ?.label
                                )
                                .join(", ");
                        }}
                        IconComponent={CustomIcon}
                        sx={{
                          width: "100%",
                          borderColor: "rgba(228, 228, 228, 1)",
                          padding: "8px",
                          pr: 2,
                          fontFamily: "Nunito Sans",
                          color: "rgba(74, 74, 74, 1)",
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        <MenuItem value="All contacts type">
                          <Typography
                            sx={{
                              fontFamily: "Nunito Sans",
                              fontWeight: 600,
                              fontSize: "14px",
                              color:
                                selectedGraphs.length == 4
                                  ? "rgba(80, 82, 178, 1)"
                                  : "inherit",
                            }}
                          >
                            All contacts type
                          </Typography>
                        </MenuItem>
                        {options.map((option) => (
                          <MenuItem
                            key={option.id}
                            value={option.id}
                            sx={{
                              backgroundColor: selectedGraphs.includes(
                                option.id
                              )
                                ? "transparent"
                                : "inherit",
                              "&.Mui-selected": {
                                backgroundColor: "transparent",
                              },
                              "&:hover": {
                                backgroundColor: "transparent",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  backgroundColor: option.color,
                                }}
                              />
                              <Typography
                                sx={{
                                  fontFamily: "Nunito Sans",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  color: selectedGraphs.includes(option.id)
                                    ? "rgba(80, 82, 178, 1)"
                                    : "inherit",
                                }}
                              >
                                {option.label}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                  </Stack>
                </Stack>

                {loading ? (
                  <Box
                    sx={{
                      position: "relative",
                      background: "rgba(255, 255, 255, 0.8)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 1000,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        border: "8px solid #f3f3f3",
                        borderTop: "8px solid #4285f4",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        animation: "spin 1s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />
                  </Box>
                ) : chartType === "line" ? (
                  <LineChart
                    colors={filteredSeriescolor.map(
                      (s) => colorMapping[s.id as keyof typeof colorMapping]
                    )}
                    xAxis={[
                      {
                        scaleType: "point",
                        data: formattedData,
                        disableTicks: true,
                        disableLine: true,
                        min: 1,
                      },
                    ]}
                    yAxis={[
                      {
                        valueFormatter: (value) => {
                          if (value >= 1000 && value < 1000000) {
                            return `${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                          } else {
                            return value.toString(); // Return smaller numbers without formatting
                          }
                        },
                        disableTicks: true,
                        disableLine: true,
                        min: 1,
                      },
                    ]}
                    series={filteredSeries}
                    height={mainchartSize}
                    margin={{ left: 45, right: 20, top: 20, bottom: 20 }}
                    grid={{ horizontal: true }}
                    sx={{
                      border: "none",
                    }}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                  ></LineChart>
                ) : (
                  <BarChart
                    height={mainchartSize}
                    colors={filteredSeriescolor.map(
                      (s) => colorMapping[s.id as keyof typeof colorMapping]
                    )}
                    xAxis={[
                      {
                        scaleType: "band",
                        data: aggregatedData,
                        disableTicks: true,
                        disableLine: true,
                        min: 1,
                      },
                    ]}
                    yAxis={[
                      {
                        valueFormatter: (value) => {
                          if (value >= 1000 && value < 1000000) {
                            return `${(value / 1000).toFixed(0)}k`; // Formats 10,000 as 10k
                          } else if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`; // Formats 1,000,000 as 1.0M
                          } else {
                            return value.toString(); // Return smaller numbers without formatting
                          }
                        },
                        disableTicks: true,
                        disableLine: true,
                        min: 1,
                      },
                    ]}
                    series={aggregatedSeries.map((s) => ({
                      data: s.data,
                      label: s.label,
                    }))}
                    grid={{ horizontal: true }}
                    margin={{ left: 45, right: 20, top: 20, bottom: 20 }}
                    borderRadius={3}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Grid>
    </Box>
  );
};

export default AudienceDashboard;
