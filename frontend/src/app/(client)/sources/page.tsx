"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  List,
  ListItemText,
  ListItemButton,
  Popover,
  DialogActions,
  DialogContent,
  DialogContentText,
  LinearProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { sourcesStyles } from "./sourcesStyles";
import Slider from "../../../components/Slider";
import { SliderProvider } from "../../../context/SliderContext";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
// import FilterPopup from './CompanyFilters';
import SwapVertIcon from "@mui/icons-material/SwapVert";
import dayjs from "dayjs";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CustomToolTip from "@/components/customToolTip";
import CustomTablePagination from "@/components/CustomTablePagination";
import { useNotification } from "@/context/NotificationContext";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import ThreeDotsLoader from "./components/ThreeDotsLoader";
import ProgressBar from "./components/ProgressLoader";
import { MoreVert } from "@mui/icons-material";
import { useSSE } from "../../../context/SSEContext";
import FilterPopup from "./components/SearchFilter";
import CloseIcon from "@mui/icons-material/Close";
import TableCustomCell from "./components/table/TableCustomCell";
import FirstTimeScreen from "./components/FirstTimeScreen"
import { useScrollShadow } from "@/hooks/useScrollShadow";

interface Source {
  id: string;
  name: string;
  target_schema: string;
  source_origin: string;
  source_type: string;
  created_at: Date;
  domain: string;
  created_by: string;
  processed_records: number;
  total_records: number;
  matched_records: number;
  matched_records_status: string;
}

interface FetchDataParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  rowsPerPage: number;
}

interface FilterParams {
  from_date: number | null;
  to_date: number | null;
  searchQuery: string | null;
  selectedSource: string[];
  selectedTypes: string[];
  selectedDomains: string[];
  createdDate: string[];
  dateRange: { fromDate: number | null; toDate: number | null };
}

type CardData = {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
  isClickable?: boolean;
};

const Sources: React.FC = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [data, setData] = useState<Source[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [count_sources, setCount] = useState<number | null>(null);
  const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
  const dropdownOpen = Boolean(dropdownEl);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    { label: string; value: string }[]
  >([]);
  const { sourceProgress } = useSSE();
  const [loaderForTable, setLoaderForTable] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [anchorElFullName, setAnchorElFullName] =
    React.useState<null | HTMLElement>(null);
  const [selectedRowData, setSelectedRowData] = useState<Source | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>([]);
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const isOpen = Boolean(anchorEl);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMakeRequest, setIsMakeRequest] = useState(false);
  const searchParams = useSearchParams();
  const isDebug = searchParams.get("is_debug") === "true";
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { isScrolledX, isScrolledY } = useScrollShadow(tableContainerRef, data.length);

  const cardData: CardData[] = [
    {
      title: "Pixel",
      description: "Install Pixel on your website to automatically collect visitor information in real-time.",
      icon: "/pixel-website.svg",
      onClick: () => {
        router.push("/sources/builder?type=pixel");
      },
      isClickable: true
    },
    {
      title: "Customer Conversions (CSV)",
      description: "This file should contain users who successfully completed valuable actions.",
      icon: "/converted-sale.svg",
      onClick: () => {
        router.push("/sources/builder?type=customer-conversions");
      },
      isClickable: true
    },
    {
      title: "Failed Leads (CSV)",
      description: "This file should contain users who engaged but didn't convert, so you can exclude them later.",
      icon: "/failed-leads.svg",
      onClick: () => {
        router.push("/sources/builder?type=failed-leads");
      },
      isClickable: true
    },
    {
      title: "Interests (CSV)",
      description: "This file should contain users who recently engaged with specific topics.",
      icon: "/interests.svg",
      onClick: () => {
        router.push("/sources/builder?type=interests");
      },
      isClickable: true
    },
  ];
  
  const columns = [
    {
      key: "name",
      label: "Name",
      widths: { width: "20vw", minWidth: "20vw", maxWidth: "20vw" },
    },
    {
      key: "target_schema",
      label: "Target Type",
      widths: { width: "115px", minWidth: "115px", maxWidth: "115px" },
    },
    {
      key: "source",
      label: "Source",
      widths: { width: "80px", minWidth: "80px", maxWidth: "80px" },
    },
    {
      key: "domain",
      label: "Domain",
      widths: { width: "12vw", minWidth: "12vw", maxWidth: "12vw" },
    },
    {
      key: "type",
      label: "Type",
      widths: { width: "13vw", minWidth: "13vw", maxWidth: "20vw" },
    },
    {
      key: "created_date",
      label: "Created Date",
      widths: { width: "125px", minWidth: "125px", maxWidth: "125px" },
      sortable: true,
    },
    {
      key: "created_by",
      label: "Created By",
      widths: { width: "11vw", minWidth: "11vw", maxWidth: "11vw" },
    },
    {
      key: "number_of_customers",
      label: "No of Customers",
      widths: { width: "140px", minWidth: "140px", maxWidth: "140px" },
      sortable: true,
    },
    {
      key: "matched_records",
      label: "Matched Records",
      widths: { width: "145px", minWidth: "145px", maxWidth: "145px" },
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      widths: { width: "80px", minWidth: "80px", maxWidth: "80px" },
    },
  ];

  useEffect(() => {
    fetchSources({
      sortBy: orderBy,
      sortOrder: order,
      page,
      rowsPerPage,
    });
  }, [orderBy, order, page, rowsPerPage, selectedFilters]);

  const fetchSourcesMemoized = useCallback(() => {
    fetchSources({
      sortBy: orderBy,
      sortOrder: order,
      page,
      rowsPerPage,
    });
  }, [orderBy, order, page, rowsPerPage]);

  const clearPollingInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("interval cleared");
    }
  };

  useEffect(() => {
    console.log("longpol");

    if (!intervalRef.current) {
      console.log("longpol started");
      intervalRef.current = setInterval(() => {
        const hasPending = data.some(
          (item) => item.matched_records_status === "pending"
        );

        if (hasPending) {
          console.log("Fetching due to pending records");
          fetchSourcesMemoized();
        } else {
          console.log("No pending records, stopping interval");
          clearPollingInterval();
        }
      }, 2000);
    }

    return () => {
      clearPollingInterval();
    };
  }, [data, fetchSourcesMemoized, page, rowsPerPage]);

  const fetchSources = async ({
    sortBy,
    sortOrder,
    page,
    rowsPerPage,
  }: FetchDataParams) => {
    setIsMakeRequest(false);
    try {
      !intervalRef.current
        ? isFirstLoad
          ? setLoading(true)
          : setLoaderForTable(true)
        : () => {};
      const accessToken = localStorage.getItem("token");
      if (!accessToken) {
        router.push("/signin");
        return;
      }

      const filters = JSON.parse(
        sessionStorage.getItem("filtersBySource") || "{}"
      );

      let url = `/audience-sources?&page=${page + 1}&per_page=${rowsPerPage}`;

      if (filters.from_date || filters.to_date) {
        url += `&created_date_start=${
          filters.from_date || ""
        }&created_date_end=${filters.to_date || ""}`;
      }
      if (filters.selectedSource?.length > 0) {
        url += `&source_origin=${filters.selectedSource
          .map((source: string) => source.toLowerCase())
          .join(",")}`;
      }
      if (filters.selectedTypes?.length > 0) {
        url += `&source_type=${filters.selectedTypes
          .map((type: string) => type.toLowerCase().replace(/\s+/g, "_"))
          .join(",")}`;
      }
      if (filters.selectedDomains?.length > 0) {
        url += `&domain_name=${filters.selectedDomains.join(",")}`;
      }
      if (filters.searchQuery) {
        url += `&name=${filters.searchQuery}`;
      }

      if (sortBy) {
        setPage(0);
        url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
      }

      if (sortBy) {
        setPage(0);
        url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
      }

      const response = await axiosInstance.get(url);

      const { source_list, count } = response.data;
      setData(source_list);
      setCount(count || 0);
      setStatus("");

      const options = [10, 20, 50, 100, 300, 500];
      let RowsPerPageOptions = options.filter((option) => option <= count);
      if (RowsPerPageOptions.length < options.length) {
        RowsPerPageOptions = [
          ...RowsPerPageOptions,
          options[RowsPerPageOptions.length],
        ];
      }
      setRowsPerPageOptions(RowsPerPageOptions);
      const selectedValue = RowsPerPageOptions.includes(rowsPerPage)
        ? rowsPerPage
        : 10;
      setRowsPerPage(selectedValue);
    } catch {
    } finally {
      setIsMakeRequest(true);
      if (isFirstLoad) {
        setLoading(false);
        setIsFirstLoad(false);
      } else {
        setLoaderForTable(false);
      }
    }
  };

  const isOpenFullName = Boolean(anchorElFullName);

  const handleClosePopoverFullName = () => {
    setAnchorElFullName(null);
    setSelectedName(null);
  };

  const handleFilterPopupOpen = () => {
    setFilterPopupOpen(true);
  };

  const handleFilterPopupClose = () => {
    setFilterPopupOpen(false);
  };

  const handleOpenPopover = (
    event: React.MouseEvent<HTMLElement>,
    rowData: Source
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowData(rowData);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleSortRequest = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleDeleteSource = async () => {
    setLoaderForTable(true);
    handleClosePopover();
    handleCloseConfirmDialog();
    clearPollingInterval();
    try {
      if (selectedRowData?.id) {
        const response = await axiosInstance.delete(
          `/audience-sources/${selectedRowData.id}`
        );
        if (response.status === 200 && response.data) {
          showToast("Source successfully deleted!");
          setCount((prev) => (prev ? prev - 1 : 0));
          setData((prevAccounts: Source[]) =>
            prevAccounts.filter(
              (item: Source) => item.id !== selectedRowData.id
            )
          );

          setCount((prevCount) => (prevCount ? Math.max(prevCount - 1, 0) : 0));
        }
      }
    } catch {
      showErrorToast("Error deleting source");
    } finally {
      setLoaderForTable(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const downloadCSVFile = async () => {
    setLoaderForTable(true);
    handleClosePopover();
    clearPollingInterval();

    try {
      if (selectedRowData?.id) {
        const response = await axiosInstance.get(
          `/audience-sources/download/${selectedRowData.id}`,
          {
            responseType: "blob",
          }
        );

        if (response.status === 200 && response.data) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          const selectedSource = data.find(
            (source) => source.id === selectedRowData.id
          );
          link.setAttribute(
            "download",
            `${selectedSource?.name}-${selectedSource?.source_origin}.csv`
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          showToast("CSV File Successfully Downloaded!");
        }
      }
    } catch (error) {
      showErrorToast("Error downloading source");
    } finally {
      setLoaderForTable(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setRowsPerPage(parseInt(event.target.value as string, 10));
    setPage(0);
  };

  useEffect(() => {
    const storedFilters = sessionStorage.getItem("filtersBySource");

    if (storedFilters) {
      const filters = JSON.parse(storedFilters);

      handleApplyFilters(filters);
    }
  }, []);

  const handleApplyFilters = (filters: FilterParams) => {
    const newSelectedFilters: { label: string; value: string }[] = [];
    const dateFormat = "YYYY-MM-DD";

    const filterMappings: {
      condition: boolean | string | string[] | number | null;
      label: string;
      value: string | ((f: any) => string);
    }[] = [
      {
        condition: filters.from_date,
        label: "From Date",
        value: () => dayjs.unix(filters.from_date!).format(dateFormat),
      },
      {
        condition: filters.to_date,
        label: "To Date",
        value: () => dayjs.unix(filters.to_date!).format(dateFormat),
      },
      {
        condition: filters.searchQuery,
        label: "Search",
        value: filters.searchQuery!,
      },
      {
        condition: filters.selectedSource?.length > 0,
        label: "Source",
        value: () => filters.selectedSource.join(", "),
      },
      {
        condition: filters.selectedTypes?.length > 0,
        label: "Types",
        value: () => filters.selectedTypes.join(", "),
      },
      {
        condition: filters.selectedDomains?.length > 0,
        label: "Domains",
        value: () => filters.selectedDomains.join(", "),
      },
      {
        condition: filters.createdDate?.length > 0,
        label: "Created Date",
        value: () => filters.createdDate.join(", "),
      },
      {
        condition: filters.dateRange?.fromDate || filters.dateRange?.toDate,
        label: "Date Range",
        value: () => {
          const from = dayjs
            .unix(filters.dateRange.fromDate!)
            .format(dateFormat);
          const to = dayjs.unix(filters.dateRange.toDate!).format(dateFormat);
          return `${from} to ${to}`;
        },
      },
    ];

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

  const handleResetFilters = () => {
    setSelectedFilters([]);

    const filters = {
      from_date: null,
      to_date: null,
      searchQuery: null,
      selectedSource: [],
      selectedTypes: [],
      selectedDomains: [],
      createdDate: [],
      checkedFilters: {
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
      },
      dateRange: { fromDate: null, toDate: null },
    };

    sessionStorage.setItem("filtersBySource", JSON.stringify(filters));
    handleApplyFilters(filters);
  };

  const handleDeleteFilter = (filterToDelete: {
    label: string;
    value: string;
  }) => {
    let updatedFilters = selectedFilters.filter(
      (filter) => filter.label !== filterToDelete.label
    );
    setSelectedFilters(updatedFilters);

    let filters = JSON.parse(sessionStorage.getItem("filtersBySource") || "{}");

    const deleteDate = (filters: FilterParams) => {
      filters.createdDate = [];
      filters.from_date = null;
      filters.to_date = null;
      filters.dateRange = { fromDate: null, toDate: null };
      setSelectedDates({ start: null, end: null });
    };

    switch (filterToDelete.label) {
      case "From Date":
      case "To Date":
      case "Created Date":
      case "Date Range":
        deleteDate(filters);
        break;
      case "Search":
        filters.searchQuery = "";
        break;
      case "Source":
        filters.selectedSource = [];
        break;
      case "Types":
        filters.selectedTypes = [];
        break;
      case "Domains":
        filters.selectedDomains = [];
        break;
      default:
        break;
    }

    if (!filters.from_date && !filters.to_date) {
      filters.checkedFilters = {
        today: false,
        last7Days: false,
        last30Days: false,
        last6Months: false,
      };
    }

    sessionStorage.setItem("filtersBySource", JSON.stringify(filters));

    updatedFilters = updatedFilters.filter(
      (f) => !["From Date", "To Date", "Date Range"].includes(f.label)
    );
    setSelectedFilters(updatedFilters);

    if (updatedFilters.length === 0) {
      setSelectedFilters([]);
    }

    const newFilters: FilterParams = {
      from_date: updatedFilters.find((f) => f.label === "From Date")
        ? dayjs(
            updatedFilters.find((f) => f.label === "From Date")!.value
          ).unix()
        : null,
      to_date: updatedFilters.find((f) => f.label === "To Date")
        ? dayjs(updatedFilters.find((f) => f.label === "To Date")!.value).unix()
        : null,
      searchQuery: updatedFilters.find((f) => f.label === "Search")
        ? updatedFilters.find((f) => f.label === "Search")!.value
        : "",
      selectedSource: updatedFilters.find((f) => f.label === "Source")
        ? updatedFilters.find((f) => f.label === "Source")!.value.split(", ")
        : [],
      selectedTypes: updatedFilters.find((f) => f.label === "Types")
        ? updatedFilters.find((f) => f.label === "Types")!.value.split(", ")
        : [],
      selectedDomains: updatedFilters.find((f) => f.label === "Domains")
        ? updatedFilters.find((f) => f.label === "Domains")!.value.split(", ")
        : [],
      createdDate: updatedFilters.find((f) => f.label === "Created Date")
        ? updatedFilters
            .find((f) => f.label === "Created Date")!
            .value.split(", ")
        : [],
      dateRange: {
        fromDate: updatedFilters.find((f) => f.label === "Date Range")
          ? dayjs(
              updatedFilters
                .find((f) => f.label === "Date Range")!
                .value.split(", ")[0]
            ).unix()
          : null,
        toDate: updatedFilters.find((f) => f.label === "Date Range")
          ? dayjs(
              updatedFilters
                .find((f) => f.label === "Date Range")!
                .value.split(", ")[1]
            ).unix()
          : null,
      },
    };

    handleApplyFilters(newFilters);
  };

  const setSourceOrigin = (sourceOrigin: string) => {
    return sourceOrigin === "pixel" ? "Pixel" : "CSV File";
  };

  const setSourceType = (sourceType: string) => {
    return sourceType
      .split(",")
      .map((item) =>
        item
          .split("_")
          .map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
          .join(" ")
      )
      .join(", ");
  };

  return (
    <>
      {loading && <CustomizedProgressBar />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          "@media (max-width: 900px)": {
            minHeight: "100vh",
          },
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box>
            {(data.length !== 0 || selectedFilters.length > 0) && 
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: hasNotification ? "1rem" : "0.5rem",
                  flexWrap: "wrap",
                  pl: "0.5rem",
                  gap: "15px",
                  "@media (max-width: 900px)": {
                    marginTop: hasNotification ? "3rem" : "1.125rem",
                  },
                  "@media (max-width: 600px)": {
                    marginTop: hasNotification ? "2rem" : "0rem",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography className="first-sub-title">Sources</Typography>
                  <CustomToolTip
                    title={"Here you can view your active sources."}
                    linkText="Learn more"
                    linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/allsource"
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "15px",
                    pt: "4px",
                    pr: 2,
                    "@media (max-width: 900px)": {
                      gap: "8px",
                    },
                  }}
                >
                  <Button
                    variant="outlined"
                    sx={{
                      height: "40px",
                      borderRadius: "4px",
                      textTransform: "none",
                      fontSize: "14px",
                      lineHeight: "19.6px",
                      fontWeight: "500",
                      color: "rgba(56, 152, 252, 1)",
                      borderColor: "rgba(56, 152, 252, 1)",
                      "&:hover": {
                        backgroundColor: "rgba(80, 82, 178, 0.1)",
                        borderColor: "rgba(56, 152, 252, 1)",
                      },
                    }}
                    onClick={() => {
                      router.push("/sources/builder");
                    }}
                  >
                    Import Source
                  </Button>
                  <Button
                    onClick={handleFilterPopupOpen}
                    disabled={data?.length === 0}
                    aria-controls={dropdownOpen ? "account-dropdown" : undefined}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen ? "true" : undefined}
                    sx={{
                      textTransform: "none",
                      color:
                        selectedFilters.length > 0
                          ? "rgba(56, 152, 252, 1)"
                          : "rgba(128, 128, 128, 1)",
                      border:
                        selectedFilters.length > 0
                          ? "1px solid rgba(56, 152, 252, 1)"
                          : "1px solid rgba(184, 184, 184, 1)",
                      borderRadius: "4px",
                      padding: "8px",
                      opacity: data?.length === 0 ? "0.5" : "1",
                      minWidth: "auto",
                      maxHeight: "40px",
                      maxWidth: "40px",
                      position: "relative",
                      "@media (max-width: 900px)": {
                        border: "none",
                        padding: 0,
                      },
                      "&:hover": {
                        backgroundColor: "transparent",
                        border: "1px solid rgba(56, 152, 252, 1)",
                        color: "rgba(56, 152, 252, 1)",
                        "& .MuiSvgIcon-root": {
                          color: "rgba(56, 152, 252, 1)",
                        },
                      },
                    }}
                  >
                    <FilterListIcon
                      fontSize="medium"
                      sx={{
                        color:
                          selectedFilters.length > 0
                            ? "rgba(56, 152, 252, 1)"
                            : "rgba(128, 128, 128, 1)",
                      }}
                    />

                    {selectedFilters.length > 0 && (
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
                </Box>
              </Box>
            }

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                pr: 2,
                overflow: "auto",
                maxWidth: "100%",
                "@media (max-width: 900px)": {
                  pt: "2px",
                  pb: "18px",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  height: "100%",
                  "@media (max-width: 900px)": {
                    paddingRight: 0,
                    minHeight: "100vh",
                  },
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 1,
                      mt: 2,
                      overflowX: "auto",
                      "@media (max-width: 600px)": { mb: 1 },
                    }}
                  >
                    {/* CHIPS */}
                    {selectedFilters.length > 0 && (
                      <Chip
                        className="second-sub-title"
                        label="Clear all"
                        onClick={handleResetFilters}
                        sx={{
                          color: "rgba(56, 152, 252, 1) !important",
                          backgroundColor: "transparent",
                          lineHeight: "20px !important",
                          fontWeight: "400 !important",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                    {selectedFilters.map((filter) => {
                      if (
                        filter.label === "From Date" ||
                        filter.label === "To Date" ||
                        filter.label === "Date Range"
                      ) {
                        return null;
                      }
                      let displayValue = filter.value;
                      return (
                        <Chip
                          className="paragraph"
                          key={filter.label}
                          label={`${filter.label}: ${
                            displayValue.charAt(0).toUpperCase() +
                            displayValue.slice(1)
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
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexGrow: 1,
                      flexDirection: "column",
                      maxWidth: "100%",
                      pl: 0,
                      pr: 0,
                      pt: "14px",
                      "@media (max-width: 900px)": {
                        pt: "2px",
                        pb: "18px",
                      },
                    }}
                  >
                    {data.length === 0 &&
                      isMakeRequest &&
                      !(selectedFilters.length > 0) && (
                        <FirstTimeScreen cardData={cardData}/>
                      )
                      }
                    {data.length === 0 &&
                      selectedFilters.length > 0 &&
                      !loaderForTable && (
                        <Box
                          sx={{
                            ...sourcesStyles.centerContainerStyles,
                            border: "1px solid rgba(235, 235, 235, 1)",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <TableContainer
                            component={Paper}
                            sx={{
                              borderBottom: "none",
                              overflowX: "auto",
                              maxHeight:
                                selectedFilters.length > 0
                                  ? hasNotification
                                    ? "63vh"
                                    : "68vh"
                                  : "72vh",
                              overflowY: "auto",
                              "@media (max-height: 800px)": {
                                maxHeight:
                                  selectedFilters.length > 0
                                    ? hasNotification
                                      ? "53vh"
                                      : "57vh"
                                    : "70vh",
                              },
                              "@media (max-width: 400px)": {
                                maxHeight:
                                  selectedFilters.length > 0
                                    ? hasNotification
                                      ? "53vh"
                                      : "60vh"
                                    : "67vh",
                              },
                            }}
                          >
                            <Table stickyHeader aria-label="leads table">
                              <TableHead sx={{ position: "relative" }}>
                                <TableRow>
                                  {columns.map(
                                    ({
                                      key,
                                      label,
                                      sortable = false,
                                      widths,
                                    }) => (
                                      <TableCell
                                        key={key}
                                        sx={{
                                          ...sourcesStyles.table_column,
                                          ...(key === "name" && {
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 10,
                                            top: 0,
                                            boxShadow: isScrolledX
                                              ? "3px 0px 3px #00000033"
                                              : "none",
                                          }),
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              ...sourcesStyles.table_column,
                                              borderRight: "0",
                                            }}
                                          >
                                            {label}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                    )
                                  )}
                                </TableRow>
                                {loaderForTable ? (
                                  <TableRow
                                    sx={{
                                      position: "sticky",
                                      top: "56px",
                                      zIndex: 11,
                                    }}
                                  >
                                    <TableCell
                                      colSpan={columns.length}
                                      sx={{ p: 0, pb: "1px" }}
                                    >
                                      <LinearProgress
                                        variant="indeterminate"
                                        sx={{
                                          width: "100%",
                                          height: "2px",
                                          position: "absolute",
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <TableRow
                                    sx={{
                                      position: "sticky",
                                      top: "56px",
                                      zIndex: 11,
                                    }}
                                  >
                                    <TableCell
                                      colSpan={columns.length}
                                      sx={{
                                        p: 0,
                                        pb: "1px",
                                        backgroundColor:
                                          "rgba(235, 235, 235, 1)",
                                        borderColor: "rgba(235, 235, 235, 1)",
                                      }}
                                    />
                                  </TableRow>
                                )}
                              </TableHead>
                            </Table>
                          </TableContainer>

                          <Box
                            sx={{ p: 3, textAlign: "center", width: "100%" }}
                          >
                            <Typography
                              variant="h5"
                              sx={{
                                mb: 3,
                                fontFamily: "Nunito Sans",
                                fontSize: "20px",
                                color: "#4a4a4a",
                                fontWeight: "600",
                                lineHeight: "28px",
                              }}
                            >
                              Data not matched yet
                            </Typography>
                            <Image
                              src="/no-data.svg"
                              alt="No Data"
                              height={250}
                              width={300}
                            />
                            <Typography
                              variant="body1"
                              color="textSecondary"
                              sx={{
                                mt: 3,
                                fontFamily: "Nunito Sans",
                                fontSize: "14px",
                                color: "#808080",
                                fontWeight: "600",
                                lineHeight: "20px",
                              }}
                            >
                              It seems that the current filters don’t match any
                              records. Try adjusting the filters.
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    {data.length !== 0 && (
                      <Grid container spacing={1} sx={{ flex: 1 }}>
                        <Grid item xs={12}>
                          <TableContainer
                            ref={tableContainerRef}
                            component={Paper}
                            sx={{
                              border: "1px solid rgba(235, 235, 235, 1)",
                              overflowX: "auto",
                              maxHeight:
                                selectedFilters.length > 0
                                  ? hasNotification
                                    ? "63vh"
                                    : "68vh"
                                  : "72vh",
                              overflowY: "auto",
                              "@media (max-height: 800px)": {
                                maxHeight:
                                  selectedFilters.length > 0
                                    ? hasNotification
                                      ? "53vh"
                                      : "57vh"
                                    : "70vh",
                              },
                              "@media (max-width: 400px)": {
                                maxHeight:
                                  selectedFilters.length > 0
                                    ? hasNotification
                                      ? "53vh"
                                      : "60vh"
                                    : "67vh",
                              },
                            }}
                          >
                            <Table
                              stickyHeader
                              aria-label="leads table"
                              sx={{ tableLayout: "fixed" }}
                            >
                              <TableHead sx={{ position: "relative" }}>
                                <TableRow>
                                  {columns.map(
                                    ({
                                      key,
                                      label,
                                      sortable = false,
                                      widths,
                                    }) => (
                                      <TableCell
                                        key={key}
                                        sx={{
                                          ...widths,
                                          ...sourcesStyles.table_column,
                                          ...(key === "name" && {
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 98,
                                            top: 0,
                                            boxShadow:
                                              //   isScrolledX && isScrolledY ? "3px 3px 3px #00000033"
                                              // : isScrolledX ? "3px 0px 3px #00000033"
                                              // : isScrolledY ? "0px 3px 3px #00000033"
                                              // : "none",
                                              isScrolledX
                                                ? "3px 0px 3px #00000033"
                                                : "none",
                                          }),

                                          right: "none",
                                          ...(key === "average_time_sec" && {
                                            "::after": { content: "none" },
                                          }),
                                          borderBottom: "none",
                                        }}
                                        onClick={
                                          sortable
                                            ? () => handleSortRequest(key)
                                            : undefined
                                        }
                                        style={{
                                          cursor: sortable
                                            ? "pointer"
                                            : "default",
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              ...sourcesStyles.table_column,
                                              borderRight: "0",
                                            }}
                                          >
                                            {label}
                                          </Typography>
                                          {sortable && (
                                            <IconButton size="small">
                                              {orderBy === key ? (
                                                order === "asc" ? (
                                                  <ArrowUpwardRoundedIcon fontSize="inherit" />
                                                ) : (
                                                  <ArrowDownwardRoundedIcon fontSize="inherit" />
                                                )
                                              ) : (
                                                <SwapVertIcon fontSize="inherit" />
                                              )}
                                            </IconButton>
                                          )}
                                        </Box>
                                      </TableCell>
                                    )
                                  )}
                                </TableRow>
                                <TableRow
                                  sx={{
                                    position: "sticky",
                                    top: "60px",
                                    zIndex: 99,
                                    borderTop: "none",
                                  }}
                                >
                                  <TableCell
                                    colSpan={columns.length}
                                    sx={{
                                      p: 0,
                                      pb: "1.5px",
                                      borderTop: "none",
                                      backgroundColor: "rgba(235, 235, 235, 1)",
                                      borderColor: "rgba(235, 235, 235, 1)",
                                    }}
                                  >
                                    {loaderForTable && (
                                      <LinearProgress
                                        variant="indeterminate"
                                        sx={{
                                          width: "100%",
                                          height: "1.5px",
                                          position: "absolute",
                                        }}
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {data.map((row: Source) => {
                                  const progress = sourceProgress[row.id];
                                  return (
                                    <TableRow
                                      key={row.id}
                                      selected={selectedRows.has(row.id)}
                                      sx={{
                                        backgroundColor:
                                          selectedRows.has(row.id) &&
                                          !loaderForTable
                                            ? "rgba(247, 247, 247, 1)"
                                            : "#fff",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(247, 247, 247, 1)",
                                          "& .sticky-cell": {
                                            backgroundColor:
                                              "rgba(247, 247, 247, 1)",
                                          },
                                        },
                                      }}
                                    >
                                      {/* Name Column */}
                                      <TableCustomCell
                                        rowExample={row.name}
                                        loaderForTable={loaderForTable}
                                        customCellStyles={{
                                          position: "sticky",
                                          left: "0",
                                          zIndex: 9,
                                          backgroundColor: loaderForTable
                                            ? "#fff"
                                            : "#fff",
                                          boxShadow: isScrolledX
                                            ? "3px 0px 3px #00000033"
                                            : "none",
                                        }}
                                        href={`/insights/sources/${row.id}`}
                                      />

                                      {/* Target Type Column */}
                                      <TableCell
                                        sx={{
                                          ...sourcesStyles.table_array,
                                          position: "relative",
                                          minWidth: "80px",
                                          maxWidth: "80px",
                                          width: "80px",
                                        }}
                                      >
                                        {row.target_schema.toUpperCase()}
                                      </TableCell>

                                      {/* Source Column */}
                                      <TableCell
                                        sx={{
                                          ...sourcesStyles.table_array,
                                          position: "relative",
                                          minWidth: "80px",
                                          maxWidth: "80px",
                                          width: "80px",
                                        }}
                                      >
                                        {setSourceOrigin(row.source_type)}
                                      </TableCell>
                                      {/* <CustomCell rowExample={setSourceOrigin(row.source_type)} cellWidth="60px" loaderForTable={loaderForTable}/> */}

                                      {/* Domain Column */}
                                      <TableCustomCell
                                        rowExample={row.domain ?? "--"}
                                        loaderForTable={loaderForTable}
                                      />

                                      {/* Type Column */}
                                      <TableCustomCell
                                        rowExample={setSourceType(
                                          row.source_origin
                                        )}
                                        loaderForTable={loaderForTable}
                                      />

                                      {/* Created date Column */}
                                      <TableCustomCell
                                        rowExample={
                                          dayjs(row.created_at).isValid()
                                            ? dayjs(row.created_at).format(
                                                "MMM D, YYYY"
                                              )
                                            : "--"
                                        }
                                        loaderForTable={loaderForTable}
                                      />

                                      {/* Created By Column */}
                                      <TableCustomCell
                                        rowExample={row.created_by}
                                        loaderForTable={loaderForTable}
                                      />

                                      {/* Number of Customers Column */}
                                      <TableCell
                                        sx={{
                                          ...sourcesStyles.table_array,
                                          position: "relative",
                                        }}
                                      >
                                        {(progress?.total &&
                                          progress?.total > 0) ||
                                        row?.total_records > 0 ? (
                                          progress?.total > 0 ? (
                                            progress?.total.toLocaleString(
                                              "en-US"
                                            )
                                          ) : (
                                            row?.total_records?.toLocaleString(
                                              "en-US"
                                            )
                                          )
                                        ) : (
                                          <ThreeDotsLoader />
                                        )}
                                      </TableCell>

                                      {/* Matched Records  Column */}
                                      <TableCell
                                        sx={{
                                          ...sourcesStyles.table_array,
                                          position: "relative",
                                        }}
                                      >
                                        {(progress?.processed &&
                                          progress?.processed ==
                                            progress?.total) ||
                                        (row?.processed_records ==
                                          row?.total_records &&
                                          row?.processed_records !== 0) ? (
                                          progress?.matched >
                                          row?.matched_records ? (
                                            progress?.matched.toLocaleString(
                                              "en-US"
                                            )
                                          ) : (
                                            row.matched_records.toLocaleString(
                                              "en-US"
                                            )
                                          )
                                        ) : row?.processed_records !== 0 ? (
                                          <ProgressBar
                                            progress={{
                                              total: row?.total_records,
                                              processed: row?.processed_records,
                                              matched: row?.matched_records,
                                            }}
                                          />
                                        ) : (
                                          <ProgressBar progress={progress} />
                                        )}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          ...sourcesStyles.tableBodyColumn,
                                          paddingLeft: "16px",
                                          textAlign: "center",
                                        }}
                                      >
                                        <IconButton
                                          onClick={(event) =>
                                            handleOpenPopover(event, row)
                                          }
                                          sx={{
                                            ":hover": {
                                              backgroundColor: "transparent",
                                            },
                                          }}
                                        >
                                          <MoreVert
                                            sx={{
                                              color: "rgba(32, 33, 36, 1)",
                                            }}
                                            height={8}
                                            width={24}
                                          />
                                        </IconButton>

                                        <Popover
                                          open={isOpen}
                                          anchorEl={anchorEl}
                                          onClose={handleClosePopover}
                                          slotProps={{
                                            paper: {
                                              sx: {
                                                boxShadow: 0,
                                                borderRadius: "4px",
                                                border:
                                                  "0.5px solid rgba(175, 175, 175, 1)",
                                              },
                                            },
                                          }}
                                          anchorOrigin={{
                                            vertical: "center",
                                            horizontal: "center",
                                          }}
                                          transformOrigin={{
                                            vertical: "top",
                                            horizontal: "right",
                                          }}
                                        >
                                          <List
                                            sx={{
                                              width: "100%",
                                              maxWidth: 360,
                                              boxShadow: "none",
                                            }}
                                          >
                                            <ListItemButton
                                              sx={{
                                                padding: "4px 16px",
                                                ":hover": {
                                                  backgroundColor:
                                                    "rgba(80, 82, 178, 0.1)",
                                                },
                                              }}
                                              onClick={() => {
                                                handleClosePopover();
                                                router.push(
                                                  `/lookalikes/builder?source_uuid=${selectedRowData?.id}`
                                                );
                                              }}
                                            >
                                              <ListItemText
                                                primaryTypographyProps={{
                                                  fontSize: "14px",
                                                }}
                                                primary="Create Lookalike"
                                              />
                                            </ListItemButton>
                                            <ListItemButton
                                              sx={{
                                                padding: "4px 16px",
                                                ":hover": {
                                                  backgroundColor:
                                                    "rgba(80, 82, 178, 0.1)",
                                                },
                                              }}
                                              onClick={() => {
                                                handleOpenConfirmDialog();
                                              }}
                                            >
                                              <ListItemText
                                                primaryTypographyProps={{
                                                  fontSize: "14px",
                                                }}
                                                primary="Remove"
                                              />
                                            </ListItemButton>
                                            {isDebug && (
                                              <ListItemButton
                                                sx={{
                                                  padding: "4px 16px",
                                                  ":hover": {
                                                    backgroundColor:
                                                      "rgba(80, 82, 178, 0.1)",
                                                  },
                                                }}
                                                onClick={() => {
                                                  downloadCSVFile();
                                                }}
                                              >
                                                <ListItemText
                                                  primaryTypographyProps={{
                                                    fontSize: "14px",
                                                  }}
                                                  primary="Download Value calculations"
                                                />
                                              </ListItemButton>
                                            )}
                                            <Popover
                                              open={openConfirmDialog}
                                              onClose={handleCloseConfirmDialog}
                                              anchorEl={anchorEl}
                                              anchorOrigin={{
                                                vertical: "bottom",
                                                horizontal: "right",
                                              }}
                                              transformOrigin={{
                                                vertical: "top",
                                                horizontal: "center",
                                              }}
                                              slotProps={{
                                                paper: {
                                                  sx: {
                                                    padding: "0.125rem",
                                                    width: "15.875rem",
                                                    boxShadow: 0,
                                                    borderRadius: "8px",
                                                    border:
                                                      "0.5px solid rgba(175, 175, 175, 1)",
                                                  },
                                                },
                                              }}
                                            >
                                              <Typography
                                                className="first-sub-title"
                                                sx={{
                                                  paddingLeft: 2,
                                                  pt: 1,
                                                  pb: 0,
                                                }}
                                              >
                                                Confirm Deletion
                                              </Typography>
                                              <DialogContent
                                                sx={{ padding: 2 }}
                                              >
                                                <DialogContentText className="table-data">
                                                  Are you sure you want to
                                                  delete this source?
                                                </DialogContentText>
                                              </DialogContent>
                                              <DialogActions>
                                                <Button
                                                  className="second-sub-title"
                                                  onClick={
                                                    handleCloseConfirmDialog
                                                  }
                                                  sx={{
                                                    backgroundColor: "#fff",
                                                    color:
                                                      "rgba(56, 152, 252, 1) !important",
                                                    fontSize: "14px",
                                                    textTransform: "none",
                                                    padding: "0.75em 1em",
                                                    border:
                                                      "1px solid rgba(56, 152, 252, 1)",
                                                    maxWidth: "50px",
                                                    maxHeight: "30px",
                                                    "&:hover": {
                                                      backgroundColor: "#fff",
                                                      boxShadow:
                                                        "0 2px 2px rgba(0, 0, 0, 0.3)",
                                                    },
                                                  }}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  className="second-sub-title"
                                                  onClick={handleDeleteSource}
                                                  sx={{
                                                    backgroundColor:
                                                      "rgba(56, 152, 252, 1)",
                                                    color: "#fff !important",
                                                    fontSize: "14px",
                                                    textTransform: "none",
                                                    padding: "0.75em 1em",
                                                    border:
                                                      "1px solid rgba(56, 152, 252, 1)",
                                                    maxWidth: "60px",
                                                    maxHeight: "30px",
                                                    "&:hover": {
                                                      backgroundColor:
                                                        "rgba(56, 152, 252, 1)",
                                                      boxShadow:
                                                        "0 2px 2px rgba(0, 0, 0, 0.3)",
                                                    },
                                                  }}
                                                >
                                                  Delete
                                                </Button>
                                              </DialogActions>
                                            </Popover>
                                          </List>
                                        </Popover>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          {count_sources && count_sources > 10 ? (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                padding: "24px 0 0",
                                "@media (max-width: 600px)": {
                                  padding: "12px 0 0",
                                },
                              }}
                            >
                              <CustomTablePagination
                                count={count_sources ?? 0}
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
                                "@media (max-width: 600px)": {
                                  padding: "12px",
                                },
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
                                {`1 - ${count_sources} of ${count_sources}`}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                    )}
                    {showSlider && <Slider />}
                    <Popover
                      open={isOpenFullName}
                      anchorEl={anchorElFullName}
                      onClose={handleClosePopoverFullName}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                      PaperProps={{
                        sx: {
                          width: "184px",
                          height: "108px",
                          borderRadius: "4px 0px 0px 0px",
                          border: "0.2px solid #ddd",
                          padding: "8px",
                          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          maxHeight: "92px",
                          overflowY: "auto",
                          backgroundColor: "rgba(255, 255, 255, 1)",
                        }}
                      >
                        {selectedName?.split(",").map((part, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            className="second-sub-title"
                            sx={{
                              wordBreak: "break-word",
                              backgroundColor: "rgba(243, 243, 243, 1)",
                              borderRadius: "4px",
                              color: "rgba(95, 99, 104, 1) !important",
                              marginBottom:
                                index < selectedName?.split(",").length - 1
                                  ? "4px"
                                  : 0,
                            }}
                          >
                            {part.trim()}
                          </Typography>
                        ))}
                      </Box>
                    </Popover>
                  </Box>

                  <FilterPopup
                    open={filterPopupOpen}
                    onClose={handleFilterPopupClose}
                    onApply={handleApplyFilters}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const SourcesPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <SliderProvider>
        <Sources />
      </SliderProvider>
    </Suspense>
  );
};

export default SourcesPage;
