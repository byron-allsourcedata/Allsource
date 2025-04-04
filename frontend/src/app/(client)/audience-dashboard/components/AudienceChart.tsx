import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  IconButton,
  Chip,
  Typography,
  MenuItem,
  Select,
  SelectChangeEvent,
  useMediaQuery,
} from "@mui/material";
import { ShowChart, BarChart as IconBarChart } from "@mui/icons-material";
import { LineChart, BarChart } from "@mui/x-charts";
import dayjs from "dayjs";
import Image from "next/image";

const CustomIcon = () => (
  <Image src="/arrow_down.svg" alt="arrow down" width={16} height={16} />
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

const AudienceChart = ({
  data,
  days,
  loading,
}: {
  data: Series[];
  days: string[];
  loading: boolean;
}) => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const isLargeScreen = useMediaQuery("(min-width:1200px)");
  const isMediumScreen = useMediaQuery("(min-width:768px)");
  const isMobile = useMediaQuery("(max-width: 380px)");

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

  const formattedData = days.map((dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  );

  const mainchartSize = isLargeScreen
    ? 450
    : isMediumScreen
    ? 300
    : isMobile
    ? 200
    : 260;

  const filteredSeries = data.filter(
    (s) => visibleSeries[s.id as keyof VisibleSeries]
  ) as [];
  const filteredSeriescolor = data.filter(
    (s) => visibleSeries[s.id as keyof VisibleSeries]
  );

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

  return (
    <Box sx={{ mb: 3, boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)" }}>
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
              <Box sx={{ display: "flex", flexDirection: "row", gap: 1.5 }}>
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
                    const isAllSelected = selected.length === options.length;

                    return isAllSelected
                      ? "All contacts type"
                      : selected
                          .map(
                            (id) =>
                              options.find((option) => option.id === id)?.label
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
                        backgroundColor: selectedGraphs.includes(option.id)
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
  );
};

export default AudienceChart;
