import { useEffect, useMemo, useRef, useState } from "react";
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
  Button,
  Menu,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ShowChart, BarChart as IconBarChart } from "@mui/icons-material";
import { LineChart, BarChart } from "@mui/x-charts";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import Image from "next/image";
import { showErrorToast } from "@/components/ToastNotification";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import CalendarPopup from "@/components/CustomCalendar";

dayjs.extend(isSameOrBefore);

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
interface Domain {
  id: number;
  user_id: number;
  domain: string;
  data_provider_id: number;
  is_pixel_installed: boolean;
  enable: boolean;
}

interface AudienceChartProps {
  selectedDomain?: string | null;
}

const AudienceChart: React.FC<AudienceChartProps> = ({ selectedDomain }) => {
  const [loading, setLoading] = useState(true);
  const [formattedDates, setFormattedDates] = useState<string>("");
  const [selectedDateLabel, setSelectedDateLabel] =
    useState<string>("Last year");
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [appliedDates, setAppliedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: oneYearAgo,
    end: today,
  });

  // Domain
  const [domains, setDomains] = useState<any[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownEl);

  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const isLargeScreen = useMediaQuery("(min-width:1200px)");
  const isMediumScreen = useMediaQuery("(min-width:768px)");
  const isMobile = useMediaQuery("(max-width: 380px)");

  type VisibleSeries = {
    total_contacts_collected: boolean;
    total_visitors: boolean;
    viewed_product: boolean;
    abandoned_cart: boolean;
    converted_sale: boolean;
  };

  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    total_contacts_collected: true,
    total_visitors: true,
    viewed_product: true,
    abandoned_cart: true,
    converted_sale: true,
  });

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
        id: "total_contacts_collected" as keyof typeof colorMapping,
        label: "Total Contacts Collected",
        curve: "linear",
        showMark: false,
        area: false,
        stackOrder: "ascending",
        data: [],
      },
      {
        id: "total_visitors" as keyof typeof colorMapping,
        label: "Total Visitors",
        curve: "linear",
        showMark: false,
        area: false,
        stackOrder: "ascending",
        data: [0],
      },
      {
        id: "viewed_product" as keyof typeof colorMapping,
        label: "View Products",
        curve: "linear",
        showMark: false,
        area: false,
        stackOrder: "ascending",
        data: [0],
      },
      {
        id: "abandoned_cart" as keyof typeof colorMapping,
        label: "Abandoned to Cart",
        curve: "linear",
        showMark: false,
        area: false,
        stackOrder: "ascending",
        data: [0],
      },
      {
        id: "converted_sale" as keyof typeof colorMapping,
        label: "Converted Sale",
        curve: "linear",
        showMark: false,
        area: false,
        stackOrder: "ascending",
        data: [0],
      },
    ].filter((s) => visibleSeries[s.id as keyof VisibleSeries])
  );

  const mainchartSize = isLargeScreen
    ? 450
    : isMediumScreen
    ? 300
    : isMobile
    ? 200
    : 260;

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
    total_contacts_collected: "rgba(244, 87, 69, 1)",
    total_visitors: "rgba(80, 82, 178, 1)",
    viewed_product: "rgba(224, 176, 5, 1)",
    abandoned_cart: "rgba(144, 190, 109, 1)",
    converted_sale: "rgba(5, 115, 234, 1)",
  };

  const handleChipClick = (seriesId: keyof VisibleSeries) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [seriesId]: !prev[seriesId],
    }));
  };

  const options = [
    { id: "total_leads", label: "Total Leads", color: "rgba(244, 87, 69, 1)" },
    {
      id: "total_visitors",
      label: "Total Visitors",
      color: "rgba(80, 82, 178, 1)",
    },
    {
      id: "viewed_product",
      label: "View Products",
      color: "rgba(224, 176, 5, 1)",
    },
    {
      id: "abandoned_cart",
      label: "Abandoned cart",
      color: "rgba(144, 190, 109, 1)",
    },
    {
      id: "converted_sale",
      label: "Converted Sale",
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

  const handleSetDomain = async (domain: string, domain_id: number) => {
    sessionStorage.setItem("current_domain", domain);
    setCurrentDomain(domain.replace("https://", ""));
    setDropdownEl(null);
  };

  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDropdownEl(event.currentTarget);
  };

  const handleDropdownClose = () => {
    setDropdownEl(null);
  };

  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handleDateChange = (dates: {
    start: Date | null;
    end: Date | null;
  }) => {
    const { start, end } = dates;
    if (start && end) {
      const formattedStart = dayjs(start).format("MMM D");
      const formattedEnd = dayjs(end).format("MMM D, YYYY");

      setFormattedDates(`${formattedStart} - ${formattedEnd}`);
    } else if (start) {
      const formattedStart = dayjs(start).format("MMM D, YYYY");
      setFormattedDates(formattedStart);
    } else if (end) {
      const formattedEnd = dayjs(end).format("MMM D, YYYY");
      setFormattedDates(formattedEnd);
    } else {
      setFormattedDates("");
    }
  };

  const handleDateLabelChange = (label: string) => {
    setSelectedDateLabel(label);
  };

  const handleApply = (dates: { start: Date | null; end: Date | null }) => {
    if (dates.start && dates.end) {
      setAppliedDates(dates);
      setCalendarAnchorEl(null);

      handleCalendarClose();
    } else {
      setAppliedDates({ start: null, end: null });
    }
  };

  useEffect(() => {
    const savedMe = sessionStorage.getItem("me");
    const savedDomains = savedMe ? JSON.parse(savedMe).domains || [] : [];
    setDomains(savedDomains);

    const savedCurrentDomain = sessionStorage.getItem("current_domain") || "";
    if (selectedDomain) {
      setCurrentDomain(selectedDomain);
    } else {
      setCurrentDomain(savedCurrentDomain);
    }
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      setCurrentDomain(selectedDomain);
      sessionStorage.setItem("current_domain", selectedDomain);
    }
  }, [selectedDomain]);

  const currentDomainID = useMemo(() => {
    const found = domains.find((d) => d.domain === currentDomain);
    return found?.id || null;
  }, [domains, currentDomain, selectedDomain]);

  useEffect(() => {
    if (!currentDomainID) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const params: Record<string, number> = {};

        if (appliedDates.start && appliedDates.end) {
          params.from_date = Math.floor(appliedDates.start.getTime() / 1000);
          params.to_date = Math.floor(appliedDates.end.getTime() / 1000);
        }

        const response = await axiosInterceptorInstance.get(
          `/audience-dashboard/pixel-contacts/${currentDomainID}`,
          { params }
        );

        const { daily_data } = response.data;

        // Получаем и сортируем дни с бэкенда
        const availableDays = Object.keys(daily_data).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        const lastAvailableDay = availableDays[availableDays.length - 1];
        const lastData = daily_data[lastAvailableDay] || {};

        const extendedDays: string[] = [...availableDays];

        // Добавляем только forward-заполнение от последней доступной даты до appliedDates.end
        const end = dayjs(appliedDates.end);
        let current = dayjs(lastAvailableDay).add(1, "day");

        while (current.isSameOrBefore(end)) {
          const dateStr = current.format("YYYY-MM-DD");
          daily_data[dateStr] = lastData; // дублируем последнее значение
          extendedDays.push(dateStr);
          current = current.add(1, "day");
        }

        // Генерация данных
        const getMetric = (day: string, key: string): number =>
          daily_data[day]?.[key] ?? 0;

        const revenueData = extendedDays.map((day) =>
          getMetric(day, "total_leads")
        );
        const visitorsData = extendedDays.map((day) =>
          getMetric(day, "visitors")
        );
        const viewedProductData = extendedDays.map((day) =>
          getMetric(day, "view_products")
        );
        const abandonedCartData = extendedDays.map((day) =>
          getMetric(day, "abandoned_cart")
        );
        const convertedSaleData = extendedDays.map((day) =>
          getMetric(day, "converted_sale")
        );

        setSeries([
          {
            id: "total_contacts_collected",
            label: "Total Contacts Collected",
            data: revenueData,
            curve: "linear",
            showMark: false,
            area: false,
            stackOrder: "ascending",
          },
          {
            id: "total_visitors",
            label: "Total Visitors",
            data: visitorsData,
            curve: "linear",
            showMark: false,
            area: false,
            stackOrder: "ascending",
          },
          {
            id: "viewed_product",
            label: "View Products",
            data: viewedProductData,
            curve: "linear",
            showMark: false,
            area: false,
            stackOrder: "ascending",
          },
          {
            id: "abandoned_cart",
            label: "Abandoned to Cart",
            data: abandonedCartData,
            curve: "linear",
            showMark: false,
            area: false,
            stackOrder: "ascending",
          },
          {
            id: "converted_sale",
            label: "Converted Sale",
            data: convertedSaleData,
            curve: "linear",
            showMark: false,
            area: false,
            stackOrder: "ascending",
          },
        ]);

        setDays(extendedDays);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDomainID, selectedDomain, appliedDates]);

  return (
    <Box>
      <Box
        sx={{
          width: "100%",
          alignItems: "start",
          display: "flex",
          flexDirection: "row",
          mt: 2,
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "start",
            alignItems: "start",
            width: "100%",
          }}
        >
          <Button
            aria-controls={dropdownOpen ? "account-dropdown" : undefined}
            aria-haspopup="true"
            aria-expanded={dropdownOpen ? "true" : undefined}
            onClick={handleDropdownClick}
            sx={{
              textTransform: "none",
              color: "rgba(128, 128, 128, 1)",
              border: "1px solid rgba(184, 184, 184, 1)",
              borderRadius: "3.2704px",
              padding: "9.5px 4px 9.5px 12px",
            }}
          >
            <Typography
              className="second-sub-title"
              sx={{
                marginRight: "0.5em",
                letterSpacing: "-0.02em",
                textAlign: "left",
                color: "rgba(98, 98, 98, 1) !important",
              }}
            >
              {currentDomain}
            </Typography>
            <ExpandMoreIcon sx={{ width: "20px", height: "20px" }} />
          </Button>
          <Menu
            id="account-dropdown"
            variant="menu"
            anchorEl={dropdownEl}
            open={dropdownOpen}
            onClose={handleDropdownClose}
            sx={{ "& .MuiMenu-list": { padding: "2px" } }}
          >
            {domains.map((domain) => (
              <MenuItem
                key={domain.id}
                onClick={() => {
                  handleSetDomain(domain.domain, domain.id);
                }}
                sx={{
                  "&:hover .delete-icon": {
                    opacity: 1,
                  },
                  "& .delete-icon": {
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: domain.enable ? "pointer" : "not-allowed",
                    width: "20rem",
                    // color: domain.enable ? 'inherit' : 'rgba(32,  33, 36, 0.3) !important'
                  }}
                >
                  <Typography
                    className="second-sub-title"
                    sx={{
                      color: domain.enable
                        ? "inherit"
                        : "rgba(32, 33, 36, 0.3) !important",
                    }}
                  >
                    {domain.domain.replace("https://", "")}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            width: "100%",
            gap: 1,
            "@media (max-width: 37.5rem)": {
              display: "none",
            },
          }}
        >
          {/* Calendary picker*/}
          <Typography className="second-sub-title">
            {selectedDateLabel ? selectedDateLabel : ""}
          </Typography>
          <Button
            aria-controls={isCalendarOpen ? "calendar-popup" : undefined}
            aria-haspopup="true"
            aria-expanded={isCalendarOpen ? "true" : undefined}
            onClick={handleCalendarClick}
            sx={{
              textTransform: "none",
              color:
                formattedDates || selectedDateLabel
                  ? "rgba(80, 82, 178, 1)"
                  : "rgba(128, 128, 128, 1)",
              border:
                formattedDates || selectedDateLabel
                  ? ".0938rem solid rgba(80, 82, 178, 1)"
                  : ".0938rem solid rgba(184, 184, 184, 1)",
              borderRadius: ".25rem",
              padding: ".5rem",
              minWidth: "auto",
              "@media (max-width: 56.25rem)": {
                border: "none",
                padding: 0,
              },
              "&:hover": {
                border: ".0938rem solid rgba(80, 82, 178, 1)",
                "& .MuiSvgIcon-root": {
                  color: "rgba(80, 82, 178, 1)",
                },
              },
            }}
          >
            <DateRangeIcon
              fontSize="medium"
              sx={{
                color:
                  formattedDates || selectedDateLabel
                    ? "rgba(80, 82, 178, 1)"
                    : "rgba(128, 128, 128, 1)",
              }}
            />
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Roboto",
                fontSize: ".875rem",
                fontWeight: "400",
                color: "rgba(32, 33, 36, 1)",
                lineHeight: "1.225rem",
                textAlign: "left",
                whiteSpace: "nowrap",
              }}
            >
              {formattedDates}
            </Typography>
            {formattedDates && (
              <Box sx={{ pl: 2, display: "flex", alignItems: "center" }}>
                <Image
                  src="/arrow_down.svg"
                  alt="arrow down"
                  width={16}
                  height={16}
                />
              </Box>
            )}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mb: 2,
          boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
        }}
      >
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
                      border: `1.5008px solid ${
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
                      border: `1.5008px solid ${
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
      <CalendarPopup
        anchorEl={calendarAnchorEl}
        open={isCalendarOpen}
        onClose={handleCalendarClose}
        onDateChange={handleDateChange}
        onDateLabelChange={handleDateLabelChange}
        onApply={handleApply}
      />
    </Box>
  );
};

export default AudienceChart;
