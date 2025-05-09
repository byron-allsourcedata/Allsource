"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Chip } from "@mui/material";
import Image from "next/image";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";
import DateRangeIcon from "@mui/icons-material/DateRange";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterPopup from "./components/LookalikeFilters";
import Link from "next/link";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import LookalikeTable from "./components/LookalikeTable";
import CustomTablePagination from "@/components/CustomTablePagination";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CalendarPopup from "@/components/CustomCalendar";
import dayjs from "dayjs";
import { ExternalLink } from "@/components/ExternalLink";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import FirstTimeScreen from "./FirstTimeScreen";
import { CardData } from "@/types/first_time_screens";

const cardData: CardData[] = [
  {
    title: "Step 1. Select Source",
    description: "Choose a source that represents your ideal customer profile.",
    icon: "/lookalike_step1.svg",
  },
  {
    title: "Step 2. Choose Lookalike Size",
    description: "Specify how closely your lookalike should match the source.",
    icon: "/lookalike_step2.svg",
  },
  {
    title: "Step 3. Select Fields",
    description: "Choose which user attributes should carry the most weight.",
    icon: "/lookalike_step3.svg",
  },
  {
    title: "Step 4. Order Fields",
    description:
      "Arrange fields in order of importance to fine-tune audience quality.",
    icon: "/lookalike_step4.svg",
  },
];

interface FilterParams {
  from_date: number | null;
  to_date: number | null;
  type: Record<string, boolean>;
  size: string[];
  searchQuery: string | null;
}

interface FetchDataParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  rowsPerPage: number;
  appliedDates: { start: Date | null; end: Date | null };
}

interface TableRowData {
  id: string;
  name: string;
  source: string;
  source_type: string;
  lookalike_size: string;
  created_date: Date;
  created_by: string;
  size: number;
  processed_size: number;
  train_model_size: number;
  processed_train_model_size: number;
  significant_fields: Record<string, any>;
  similarity_score: Record<string, any>;
  target_schema: string;
}

const CreateLookalikePage: React.FC = () => {
  const router = useRouter();

  const [isLookalikeGenerated, setIsLookalikeGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaderForTable, setLoaderForTable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [lookalikesData, setLookalikeData] = useState<TableRowData[]>([]);
  const [sourceCount, setSourceCount] = useState<number>();
  const [showNotification, setShowNotification] = useState(true);

  // Pagination and Sorting
  const [count_lookalikes, setCountLookalike] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
  const [orderBy, setOrderBy] = useState<keyof TableRowData>();
  const [order, setOrder] = useState<"asc" | "desc">();

  // Calendary
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [appliedDates, setAppliedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [formattedDates, setFormattedDates] = useState<string>("");
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const dropdownOpen = Boolean(dropdownEl);

  // Filter
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    { label: string; value: string }[]
  >([]);

  const handleFilterPopupOpen = () => {
    setFilterPopupOpen(true);
  };

  const handleSort = (property: keyof TableRowData) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleFilterPopupClose = () => {
    setFilterPopupOpen(false);
  };

  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setRowsPerPage(parseInt(event.target.value as string, 10));
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleDateChange = (dates: {
    start: Date | null;
    end: Date | null;
  }) => {
    setSelectedDates(dates);
    const { start, end } = dates;
    if (start && end) {
      setFormattedDates(
        `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      );
    } else if (start) {
      setFormattedDates(`${start.toLocaleDateString()}`);
    } else {
      setFormattedDates("");
    }
  };
  const handleDateLabelChange = (label: string) => {};

  const handleApply = (dates: { start: Date | null; end: Date | null }) => {
    if (dates.start && dates.end) {
      const formattedStart = dates.start.toLocaleDateString();
      const formattedEnd = dates.end.toLocaleDateString();

      const dateRange = `${formattedStart} - ${formattedEnd}`;

      setAppliedDates(dates);
      setCalendarAnchorEl(null);

      setSelectedFilters((prevFilters) => {
        const existingIndex = prevFilters.findIndex(
          (filter) => filter.label === "Dates"
        );
        const newFilter = { label: "Dates", value: dateRange };

        if (existingIndex !== -1) {
          const updatedFilters = [...prevFilters];
          updatedFilters[existingIndex] = newFilter;
          return updatedFilters;
        } else {
          return [...prevFilters, newFilter];
        }
      });
      handleCalendarClose();
    } else {
      setAppliedDates({ start: null, end: null });
      setFormattedDates("");
      setSelectedDates({ start: null, end: null });
      setSelectedFilters((prevFilters) => {
        return prevFilters.filter((filter) => filter.label !== "Dates");
      });
    }
  };

  const handleApplyFilters = (filters: FilterParams) => {
    const newSelectedFilters: { label: string; value: string }[] = [];
    const getSelectedValues = (obj: Record<string, boolean>): string => {
      return Object.entries(obj)
        .filter(([_, value]) => value)
        .map(([key]) => key)
        .join(", ");
    };

    const dateFormat = "MM/DD/YYYY";
    if (appliedDates.start && appliedDates.end) {
      newSelectedFilters.push({
        label: "Dates",
        value: `${dayjs(appliedDates.start).format(dateFormat)} - ${dayjs(
          appliedDates.end
        ).format(dateFormat)}`,
      });
    }

    // Map of filter conditions to their labels
    const filterMappings: {
      condition: boolean | string | string[] | number | null;
      label: string;
      value: string | ((f: any) => string);
    }[] = [
      {
        condition: filters.type && Object.values(filters.type).some(Boolean),
        label: "Type",
        value: () => getSelectedValues(filters.type!),
      },
      {
        condition: filters.size?.length,
        label: "Size",
        value: () => filters.size!.join(", "),
      },
      {
        condition: filters.searchQuery?.trim() !== "",
        label: "Search",
        value: filters.searchQuery || "",
      },
    ];

    // Iterate over the mappings to populate newSelectedFilters
    filterMappings.forEach(({ condition, label, value }) => {
      if (condition) {
        newSelectedFilters.push({
          label,
          value: typeof value === "function" ? value(filters) : value,
        });
      }
    });

    setSelectedFilters(newSelectedFilters);
  };

  const handleFetchLookalikes = async ({
    sortBy,
    sortOrder,
    page,
    rowsPerPage,
    appliedDates,
  }: FetchDataParams) => {
    try {
      isFirstLoad ? setLoading(true) : setLoaderForTable(true);

      // Processing "Date Calendly"
      const timezoneOffsetInHours = -new Date().getTimezoneOffset() / 60;
      const startEpoch = appliedDates.start
        ? Math.floor(
            new Date(appliedDates.start.toISOString()).getTime() / 1000
          )
        : null;

      const endEpoch = appliedDates.end
        ? Math.floor(new Date(appliedDates.end.toISOString()).getTime() / 1000)
        : null;

      let url = `/audience-lookalikes?page=${
        page + 1
      }&per_page=${rowsPerPage}&timezone_offset=${timezoneOffsetInHours}`;
      if (startEpoch !== null && endEpoch !== null) {
        url += `&from_date=${startEpoch}&to_date=${endEpoch}`;
      }
      if (sortBy) {
        url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
      }

      // filter with checkbox or radio button
      const processMultiFilter = (label: string, paramName: string) => {
        const toSnakeCase = (str: string) => str.toLowerCase();
        const filter = selectedFilters.find(
          (filter) => filter.label === label
        )?.value;
        if (filter) {
          const snakeCaseParam = toSnakeCase(filter);
          url += `&${paramName}=${encodeURIComponent(
            snakeCaseParam?.split(", ").join(",")
          )}`;
        }
      };

      processMultiFilter("Size", "lookalike_size");
      processMultiFilter("Type", "lookalike_type");
      processMultiFilter("Search", "search_query");

      const response = await axiosInstance.get(url);
      const { data, meta } = response.data;

      setLookalikeData(Array.isArray(data) ? data : []);
      setCountLookalike(meta.total || 0);
      setSourceCount(meta.source_count || 0);

      if (data && meta.total > 0) {
        setIsLookalikeGenerated(true);
      }
      const options = [15, 30, 50, 100, 200, 500];
      let RowsPerPageOptions = options.filter((option) => option <= meta.total);
      if (RowsPerPageOptions.length < options.length) {
        RowsPerPageOptions = [
          ...RowsPerPageOptions,
          options[RowsPerPageOptions.length],
        ];
      }
      setRowsPerPageOptions(RowsPerPageOptions);
      const selectedValue = RowsPerPageOptions.includes(rowsPerPage)
        ? rowsPerPage
        : 15;
      setRowsPerPage(selectedValue);
    } catch (error) {
    } finally {
      if (isFirstLoad) {
        setIsFirstLoad(false);
        setLoading(false);
      } else {
        setLoaderForTable(false);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchLookalikes({
      sortBy: orderBy,
      sortOrder: order,
      page,
      rowsPerPage,
      appliedDates: {
        start: appliedDates.start,
        end: appliedDates.end,
      },
    });
  }, [appliedDates, orderBy, order, page, rowsPerPage, selectedFilters]);

  const handleResetFilters = async () => {
    const url = `/audience-lookalikes`;

    try {
      setIsLoading(true);
      setAppliedDates({ start: null, end: null });
      setFormattedDates("");
      sessionStorage.removeItem("lookalike-filters");
      const response = await axiosInstance.get(url);
      const [leads, count] = response.data;

      setLookalikeData(Array.isArray(leads) ? leads : []);
      setCountLookalike(count || 0);
      setSelectedDates({ start: null, end: null });
      setSelectedFilters([]);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFilter = (filterToDelete: {
    label: string;
    value: string;
  }) => {
    const updatedFilters = selectedFilters.filter(
      (filter) => filter.label !== filterToDelete.label
    );

    setSelectedFilters(updatedFilters);

    const filters = JSON.parse(
      sessionStorage.getItem("lookalike_filters") || "{}"
    );

    switch (filterToDelete.label) {
      case "Type":
        filters.type = [];
        break;
      case "Size":
        filters.size = [];
        break;
      default:
        break;
    }

    sessionStorage.setItem("lookalike_filters", JSON.stringify(filters));

    if (filterToDelete.label === "Dates") {
      setAppliedDates({ start: null, end: null });
      setFormattedDates("");
      setSelectedDates({ start: null, end: null });
    }

    // Обновляем фильтры для применения
    const newFilters: FilterParams = {
      from_date: updatedFilters.find((f) => f.label === "From Date")
        ? dayjs(
            updatedFilters.find((f) => f.label === "From Date")!.value
          ).unix()
        : null,
      to_date: updatedFilters.find((f) => f.label === "To Date")
        ? dayjs(updatedFilters.find((f) => f.label === "To Date")!.value).unix()
        : null,
      type: Object.fromEntries(
        Object.keys(filters.type).map((key) => [
          key,
          updatedFilters.some(
            (f) => f.label === "Type" && f.value.includes(key)
          ),
        ])
      ),
      size: updatedFilters.find((f) => f.label === "Size")
        ? updatedFilters.find((f) => f.label === "Size")!.value.split(", ")
        : [],
      searchQuery: updatedFilters.find((f) => f.label === "Search")
        ? updatedFilters.find((f) => f.label === "Search")!.value
        : "",
    };

    handleApplyFilters(newFilters);
  };

  // Help-func for update data after delete/rename lookalike
  const refreshData = async () => {
    try {
      const data = await handleFetchLookalikes({
        sortBy: orderBy,
        sortOrder: order,
        page,
        rowsPerPage,
        appliedDates: {
          start: appliedDates.start,
          end: appliedDates.end,
        },
      });
    } catch (error) {}
  };

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  return (
    <Box sx={{ width: "100%", pr: 2, flexGrow: 1 }}>
      {loading && <CustomizedProgressBar />}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {isLookalikeGenerated && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              pl: "0.5rem",
              gap: "15px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
                pt: isLookalikeGenerated ? 1 : 2.5,
              }}
            >
              <Typography className="first-sub-title">Lookalikes</Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "15px",
                pt: "16px",
                "@media (max-width: 900px)": {
                  gap: "8px",
                },
              }}
            >
              {isLookalikeGenerated && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Button
                    onClick={() => router.push("/lookalikes/builder")}
                    variant="outlined"
                    sx={{
                      height: "40px",
                      borderRadius: "4px",
                      textTransform: "none",
                      fontSize: "14px",
                      lineHeight: "19.6px",
                      fontWeight: "500",
                      color: "#5052B2",
                      borderColor: "#5052B2",
                      "&:hover": {
                        backgroundColor: "rgba(80, 82, 178, 0.1)",
                        borderColor: "#5052B2",
                      },
                    }}
                  >
                    Create Lookalike
                  </Button>
                  <Button
                    onClick={handleFilterPopupOpen}
                    aria-controls={
                      dropdownOpen ? "account-dropdown" : undefined
                    }
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen ? "true" : undefined}
                    sx={{
                      textTransform: "none",
                      color:
                        selectedFilters && selectedFilters.length > 0
                          ? "rgba(80, 82, 178, 1)"
                          : "rgba(128, 128, 128, 1)",
                      border:
                        selectedFilters && selectedFilters.length > 0
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
                      "&:hover": {
                        backgroundColor: "transparent",
                        border: "1px solid rgba(80, 82, 178, 1)",
                        color: "rgba(80, 82, 178, 1)",
                        "& .MuiSvgIcon-root": {
                          color: "rgba(80, 82, 178, 1)",
                        },
                      },
                    }}
                  >
                    <FilterListIcon
                      fontSize="medium"
                      sx={{
                        color:
                          selectedFilters && selectedFilters.length > 0
                            ? "rgba(80, 82, 178, 1)"
                            : "rgba(128, 128, 128, 1)",
                      }}
                    />

                    {selectedFilters && selectedFilters.length > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 8,
                          width: "10px",
                          height: "10px",
                          backgroundColor: "red",
                          borderRadius: "50%",
                          "@media (max-width: 900px)": {
                            top: -1,
                            right: 1,
                          },
                        }}
                      />
                    )}
                  </Button>

                  <Button
                    aria-controls={
                      isCalendarOpen ? "calendar-popup" : undefined
                    }
                    aria-haspopup="true"
                    aria-expanded={isCalendarOpen ? "true" : undefined}
                    onClick={handleCalendarClick}
                    sx={{
                      textTransform: "none",
                      color: "rgba(128, 128, 128, 1)",
                      border: formattedDates
                        ? "1px solid rgba(80, 82, 178, 1)"
                        : "1px solid rgba(184, 184, 184, 1)",
                      borderRadius: "4px",
                      padding: "8px",
                      minWidth: "auto",
                      "@media (max-width: 900px)": {
                        border: "none",
                        padding: 0,
                      },
                      "&:hover": {
                        backgroundColor: "transparent",
                        border: "1px solid rgba(80, 82, 178, 1)",
                        color: "rgba(80, 82, 178, 1)",
                        "& .MuiSvgIcon-root": {
                          color: "rgba(80, 82, 178, 1)",
                        },
                      },
                    }}
                  >
                    <DateRangeIcon
                      fontSize="medium"
                      sx={{
                        color: formattedDates
                          ? "rgba(80, 82, 178, 1)"
                          : "rgba(128, 128, 128, 1)",
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "Nunito Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        lineHeight: "19.6px",
                        textAlign: "left",
                        color: formattedDates
                          ? "rgba(80, 82, 178, 1)"
                          : "rgba(128, 128, 128, 1)",
                        "@media (max-width: 600px)": {
                          display: "none",
                        },
                      }}
                    >
                      {formattedDates}
                    </Typography>
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            overflowX: "auto",
            "@media (max-width: 600px)": { mb: 1 },
          }}
        >
          {selectedFilters.length > 0 && (
            <Chip
              className="second-sub-title"
              label="Clear all"
              onClick={handleResetFilters}
              sx={{
                color: "#5052B2 !important",
                backgroundColor: "transparent",
                lineHeight: "20px !important",
                fontWeight: "400 !important",
                borderRadius: "4px",
              }}
            />
          )}
          {selectedFilters.map((filter) => {
            let displayValue = filter.value;
            return (
              <Chip
                className="paragraph"
                key={filter.label}
                label={`${filter.label}: ${
                  displayValue.charAt(0).toUpperCase() + displayValue.slice(1)
                }`}
                onDelete={() => handleDeleteFilter(filter)}
                deleteIcon={
                  <CloseIcon
                    sx={{
                      backgroundColor: "transparent",
                      color: "#828282 !important",
                      fontSize: "14px !important",
                    }}
                  />
                }
                sx={{
                  borderRadius: "4.5px",
                  backgroundColor: "rgba(80, 82, 178, 0.10)",
                  color: "#5F6368 !important",
                  lineHeight: "16px !important",
                }}
              />
            );
          })}
        </Box>
        <Box sx={{ flexGrow: 1, display: "flex" }}>
          {isLookalikeGenerated ? (
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "end",
              }}
            >
              <LookalikeTable
                tableData={lookalikesData}
                order={order}
                orderBy={orderBy}
                onSort={handleSort}
                refreshData={refreshData}
                loader_for_table={loaderForTable}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexGrow: 1,
                  alignItems: "end",
                  padding: "24px 0 0",
                  "@media (max-width: 600px)": { padding: "12px 0 0" },
                }}
              >
                {count_lookalikes && count_lookalikes > 10 ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      padding: "24px 0 0",
                      "@media (max-width: 600px)": { padding: "12px 0 0" },
                    }}
                  >
                    <CustomTablePagination
                      count={count_lookalikes ?? 0}
                      page={page}
                      rowsPerPage={rowsPerPage}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={rowsPerPageOptions}
                    />
                  </Box>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                    sx={{
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderRadius: "4px",
                      "@media (max-width: 600px)": { padding: "12px" },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Nunito Sans",
                        fontWeight: "400",
                        fontSize: "12px",
                        lineHeight: "16px",
                        marginRight: "16px",
                      }}
                    >
                      {`1 - ${count_lookalikes} of ${count_lookalikes}`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "start",
                borderRadius: 2,
                pr: 1,
                boxSizing: "border-box",
                width: "100%",
                textAlign: "center",
                flex: 1,
                "& img": {
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                },
              }}
            >
              {sourceCount === 0 && showNotification && (
                <Box
                  sx={{
                    border: "1px solid rgba(224, 49, 48, 1)",
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
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
                        setShowNotification(false);
                      }}
                    >
                      Dismiss
                    </Button>
                    <Button
                      onClick={() => {
                        router.push("/sources");
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
                      Create Source
                    </Button>
                  </Box>
                </Box>
              )}
              <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Typography
                  variant="h5"
                  className="first-sub-title"
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontSize: "24px !important",
                    color: "#4a4a4a",
                    fontWeight: "500 !important",
                    lineHeight: "22px",
                  }}
                >
                  Create Your First Lookalike
                </Typography>
                <ExternalLink href="https://example.com">
                  Learn more
                </ExternalLink>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  fontFamily: "Nunito Sans",
                  fontSize: "14px",
                  color: "rgba(50, 54, 62, 1)",
                  fontWeight: "400",
                  lineHeight: "22px",
                }}
              >
                This tool helps you expand your reach by finding new users who
                closely resemble your existing high-value audiences
              </Typography>

              <Box
                sx={{
                  border: "1px solid rgba(237, 237, 237, 1)",
                  width: "100%",
                  mt: 3,
                  padding: 3,
                  pt: 0,
                  borderRadius: "6px",
                }}
              >
                <Box
                  sx={{
                    textAlign: "left",
                  }}
                >
                  <FirstTimeScreen cardData={cardData} />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "end",
                    pr: 2,
                  }}
                >
                  <Link href="/lookalikes/builder" passHref>
                    <Button
                      variant="contained"
                      className="second-sub-title"
                      disabled={sourceCount === 0}
                      sx={{
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        textTransform: "none",
                        padding: "10px 24px",
                        color: "#fff !important",
                        ":hover": {
                          backgroundColor: "rgba(48, 149, 250, 1)",
                        },
                      }}
                    >
                      Begin
                    </Button>
                  </Link>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        <FilterPopup
          open={filterPopupOpen}
          onClose={handleFilterPopupClose}
          onApply={handleApplyFilters}
        />
        <CalendarPopup
          anchorEl={calendarAnchorEl}
          open={isCalendarOpen}
          onClose={handleCalendarClose}
          onDateChange={handleDateChange}
          onApply={handleApply}
          onDateLabelChange={handleDateLabelChange}
          selectedDates={selectedDates}
        />
      </Box>
    </Box>
  );
};

export default CreateLookalikePage;
