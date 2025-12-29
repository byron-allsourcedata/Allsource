"use client";
import React, { useState, useEffect, Suspense, useRef } from "react";
import {
	Box,
	Typography,
	Button,
	Table,
	TableBody,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	Chip,
	Popover,
	type SxProps,
	type Theme,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { companyStyles } from "./companyStyles";
import Slider from "../../../components/Slider";
import { SliderProvider } from "../../../context/SliderContext";
import DownloadIcon from "@mui/icons-material/Download";
import FilterPopup from "./CompanyFilters";
import SouthOutlinedIcon from "@mui/icons-material/SouthOutlined";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import NorthOutlinedIcon from "@mui/icons-material/NorthOutlined";
import dayjs from "dayjs";
import PopupDetails from "./CompanyDetails";
import CloseIcon from "@mui/icons-material/Close";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import Tooltip from "@mui/material/Tooltip";
import CustomToolTip from "@/components/customToolTip";
import CalendarPopup from "@/components/CustomCalendar";
import { Paginator } from "@/components/PaginationComponent";
import { useNotification } from "@/context/NotificationContext";
import CompanyEmployees from "./CompanyEmployees";
import GettingStartedSection from "@/components/PixelInstallationSection";
import { FirstTimeScreenCommonVariant2 } from "@/components/first-time-screens";
import HintCard from "../components/HintCard";
import { useCompanyHints } from "./context/CompanyHintsContext";
import { companyTableCards } from "./context/hintsCardsContent";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import { SmartCell } from "@/components/table";
import { EmptyAnalyticsPlaceholder } from "../analytics/components/placeholders/EmptyPlaceholder";
import { CalendarButton } from "./CalendarButton";
import { FilterButton } from "./FilterButton";
import { SelectedFilter } from "./schemas";
import { usePagination } from "@/hooks/usePagination";
import { useClampTableHeight } from "@/hooks/useClampTableHeight";
import { useZohoChatToggle } from "@/hooks/useZohoChatToggle";
import { checkPixelInstallationPaid } from "@/services/checkPixelInstallPaid";

interface FetchDataParams {
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	page: number;
	rowsPerPage: number;
	appliedDates: { start: Date | null; end: Date | null };
}

const Leads: React.FC = () => {
	const router = useRouter();
	const { hasNotification } = useNotification();
	const [data, setData] = useState<any[]>([]);
	const [count_companies, setCount] = useState<number | null>(null);
	const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
	const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
	const [appliedDates, setAppliedDates] = useState<{
		start: Date | null;
		end: Date | null;
	}>({ start: null, end: null });
	const [status, setStatus] = useState<string | null>(null);
	const [showSlider, setShowSlider] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [dropdownEl, setDropdownEl] = useState<null | HTMLElement>(null);
	const dropdownOpen = Boolean(dropdownEl);
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
	const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const [selectedDates, setSelectedDates] = useState<{
		start: Date | null;
		end: Date | null;
	}>({ start: null, end: null });
	const isCalendarOpen = Boolean(calendarAnchorEl);
	const [formattedDates, setFormattedDates] = useState<string>("");
	const [companyName, setCompanyName] = useState<string>("");
	const [companyId, setCompanyId] = useState<number>(0);
	const [filterPopupOpen, setFilterPopupOpen] = useState(false);
	const [companyEmployeesOpen, setCompanyEmployeesOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selectedFilters, setSelectedFilters] = useState<SelectedFilter[]>([]);
	const [openPopup, setOpenPopup] = React.useState(false);
	const [popupData, setPopupData] = React.useState<any>(null);
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const [selectedIndustry, setSelectedIndustry] = React.useState<string | null>(
		null,
	);
	const [industry, setIndustry] = React.useState<string[]>([]);
	const { changeCompanyTableHint, companyTableHints, resetCompanyTableHints } =
		useCompanyHints();
	const tableContainerRef = useRef<HTMLDivElement>(null);
	const { isScrolledX, isScrolledY } = useScrollShadow(
		tableContainerRef,
		data.length,
	);

	const paginationProps = usePagination(count_companies ?? 0);
	const { page, rowsPerPage } = paginationProps;
	const paginatorRef = useClampTableHeight(tableContainerRef, 8, 124, [
		data.length,
	]);
	useZohoChatToggle(isCalendarOpen || openPopup || filterPopupOpen);

	const handleOpenPopover = (
		event: React.MouseEvent<HTMLElement>,
		industry: string,
	) => {
		setSelectedIndustry(industry);
		setAnchorEl(event.currentTarget);
	};

	const handleClosePopover = () => {
		setAnchorEl(null);
		setSelectedIndustry(null);
	};

	const isOpen = Boolean(anchorEl);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, []);

	useEffect(() => {
		checkPixelInstallationPaid();
	}, []);

	const handleOpenPopup = (row: any) => {
		setPopupData(row);
		setOpenPopup(true);
	};

	const handleClosePopup = () => {
		setOpenPopup(false);
	};

	const handleFilterPopupOpen = () => {
		setFilterPopupOpen(true);
	};

	const handleFilterPopupClose = () => {
		setFilterPopupOpen(false);
	};

	const handleSortRequest = (property: string) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
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
		setSelectedDates(dates);
		const { start, end } = dates;
		if (start && end) {
			setFormattedDates(
				`${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
			);
		} else if (start) {
			setFormattedDates(`${start.toLocaleDateString()}`);
		} else {
			setFormattedDates("");
		}
	};

	const handleApply = (dates: { start: Date | null; end: Date | null }) => {
		if (dates.start && dates.end) {
			const formattedStart = dates.start.toLocaleDateString();
			const formattedEnd = dates.end.toLocaleDateString();

			const dateRange = `${formattedStart} - ${formattedEnd}`;

			setAppliedDates(dates);
			setCalendarAnchorEl(null);

			setSelectedFilters((prevFilters) => {
				const existingIndex = prevFilters.findIndex(
					(filter) => filter.label === "Dates",
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

	const installPixel = () => {
		router.push("/dashboard");
	};

	const fetchData = async ({
		sortBy,
		sortOrder,
		page,
		rowsPerPage,
	}: FetchDataParams) => {
		try {
			setIsLoading(true);
			const accessToken = localStorage.getItem("token");
			if (!accessToken) {
				router.push("/signin");
				return;
			}

			const timezoneOffsetInHours = -new Date().getTimezoneOffset() / 60;
			let url = `/company?page=${page + 1}&per_page=${rowsPerPage}&timezone_offset=${timezoneOffsetInHours}`;

			const startEpoch = appliedDates.start
				? Math.floor(
						new Date(appliedDates.start.toISOString()).getTime() / 1000,
					)
				: null;

			const endEpoch = appliedDates.end
				? Math.floor(new Date(appliedDates.end.toISOString()).getTime() / 1000)
				: null;

			if (startEpoch !== null && endEpoch !== null) {
				url += `&from_date=${startEpoch}&to_date=${endEpoch}`;
			}

			// Processing "From Date"
			if (selectedFilters.some((filter) => filter.label === "From Date")) {
				const fromDate =
					selectedFilters.find((filter) => filter.label === "From Date")
						?.value || "";
				if (fromDate) {
					const fromDateUtc = new Date(fromDate);
					fromDateUtc.setHours(0, 0, 0, 0);
					const fromDateEpoch = Math.floor(fromDateUtc.getTime() / 1000);
					url += `&from_date=${fromDateEpoch}`;
				}
			}

			// Processing "To Date"
			if (selectedFilters.some((filter) => filter.label === "To Date")) {
				const toDate =
					selectedFilters.find((filter) => filter.label === "To Date")?.value ||
					"";
				if (toDate) {
					const toDateUtc = new Date(toDate);
					toDateUtc.setHours(23, 59, 59, 999);
					const toDateEpoch = Math.floor(toDateUtc.getTime() / 1000);
					url += `&to_date=${toDateEpoch}`;
				}
			}

			// employee visits
			const employeeVisits = selectedFilters.find(
				(filter) => filter.label === "Employee Visits",
			)?.value;
			if (employeeVisits) {
				url += `&employee_visits=${encodeURIComponent(employeeVisits)}`;
			}

			// filter with checkbox or radio button
			const processMultiFilter = (label: string, paramName: string) => {
				const filter = selectedFilters.find(
					(filter) => filter.label === label,
				)?.value;
				if (filter) {
					url += `&${paramName}=${encodeURIComponent(filter?.split(", ").join(","))}`;
				}
			};

			processMultiFilter("Regions", "regions");
			processMultiFilter("Number of Employees", "employees_range");
			processMultiFilter("Revenue", "revenue_range");
			processMultiFilter("Industry", "industry");

			// search
			const searchQuery = selectedFilters.find(
				(filter) => filter.label === "Search",
			)?.value;
			if (searchQuery) {
				url += `&search_query=${encodeURIComponent(searchQuery)}`;
			}

			// sort
			if (sortBy) {
				url += `&sort_by=${sortBy}&sort_order=${sortOrder}`;
			}

			const response = await axiosInstance.get(url);
			const [leads, count] = response.data;

			setData(Array.isArray(leads) ? leads : []);
			setCount(count || 0);
			setStatus(response.data.status);
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === 403) {
				if (error.response.data.status === "NEED_BOOK_CALL") {
					sessionStorage.setItem("is_slider_opened", "true");
					setShowSlider(true);
				} else if (error.response.data.status === "PIXEL_INSTALLATION_NEEDED") {
					setStatus(error.response.data.status);
				} else {
					setShowSlider(false);
				}
			}
			setIsLoading(false);
		} finally {
			setIsLoading(false);
		}
	};

	const handleIndustry = async () => {
		setLoading(true);
		try {
			const response = await axiosInstance.get("/company/industry");
			setIndustry(Array.isArray(response.data) ? response.data : []);
		} catch {
		} finally {
			setLoading(false);
		}
	};

	interface FilterParams {
		from_date: number | null;
		to_date: number | null;
		regions: string[];
		searchQuery: string | null;
		selectedPageVisit: string | null;
		checkedFiltersNumberOfEmployees: {
			"1-10": boolean;
			"11-25": boolean;
			"26-50": boolean;
			"51-100": boolean;
			"101-250": boolean;
			"251-500": boolean;
			"501-1000": boolean;
			"1001-5000": boolean;
			"2001-5000": boolean;
			"5001-10000": boolean;
			"10001+": boolean;
			unknown: boolean;
		};
		checkedFiltersRevenue: {
			"Below 10k": boolean;
			"$10k - $50k": boolean;
			"$50k - $100k": boolean;
			"$100k - $500k": boolean;
			"$500k - $1M": boolean;
			"$1M - $5M": boolean;
			"$5M - $10M": boolean;
			"$10M - $50M": boolean;
			"$50M - $100M": boolean;
			"$100M - $500M": boolean;
			"$500M - $1B": boolean;
			"$1 Billion +": boolean;
			unknown: boolean;
		};
		checkedFilters: {
			lastWeek: boolean;
			last30Days: boolean;
			last6Months: boolean;
			allTime: boolean;
		};
		industry: Record<string, boolean>;
	}

	useEffect(() => {
		handleIndustry();
	}, []);

	useEffect(() => {
		fetchData({
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

	const handleDateLabelChange = (label: string) => {};

	if (isLoading) {
		return <CustomizedProgressBar />;
	}

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

	const handleDownload = async () => {
		setLoading(true);
		try {
			const startEpoch = appliedDates.start
				? Math.floor(appliedDates.start.getTime() / 1000)
				: null;
			const endEpoch = appliedDates.end
				? Math.floor(appliedDates.end.getTime() / 1000)
				: null;

			const params = new URLSearchParams();

			if (startEpoch !== null && endEpoch !== null) {
				params.append("from_date", startEpoch.toString());
				params.append("to_date", endEpoch.toString());
			}

			const employeeVisits = selectedFilters.find(
				(filter) => filter.label === "Employee Visits",
			)?.value;
			if (employeeVisits) {
				params.append("employee_visits", employeeVisits);
			}

			const processMultiFilter = (label: string, paramName: string) => {
				const filter = selectedFilters.find(
					(filter) => filter.label === label,
				)?.value;
				if (filter) {
					params.append(paramName, filter.split(", ").join(","));
				}
			};

			processMultiFilter("Regions", "regions");
			processMultiFilter("Number of Employees", "employees_range");
			processMultiFilter("Revenue", "revenue_range");
			processMultiFilter("Industry", "industry");

			const searchQuery = selectedFilters.find(
				(filter) => filter.label === "Search",
			)?.value;
			if (searchQuery) {
				params.append("search_query", searchQuery);
			}

			let url = "/company/download-companies";
			const queryString = params.toString();
			if (queryString) {
				url += `?${queryString}`;
			}

			const response = await axiosInstance.get(url, {
				responseType: "blob",
			});

			if (response.status === 200) {
				const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
				const link = document.createElement("a");
				link.href = blobUrl;
				link.setAttribute("download", "companies.csv");
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(blobUrl);
			} else {
				console.error("Error downloading file:", response.statusText);
			}
		} catch (error) {
			console.error("Error during the download process:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleApplyFilters = (filters: FilterParams) => {
		const newSelectedFilters: { label: string; value: string }[] = [];

		const dateFormat = "YYYY-MM-DD";

		const getSelectedValues = (obj: Record<string, boolean>): string => {
			return Object.entries(obj)
				.filter(([_, value]) => value)
				.map(([key]) => key)
				.join(", ");
		};

		// Map of filter conditions to their labels
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
				condition: filters.regions?.length,
				label: "Regions",
				value: () => filters.regions!.join(", "),
			},
			{
				condition: filters.searchQuery?.trim() !== "",
				label: "Search",
				value: filters.searchQuery || "",
			},
			{
				condition: filters.selectedPageVisit?.trim() !== "",
				label: "Employee Visits",
				value: filters.selectedPageVisit || "",
			},
			{
				condition:
					filters.checkedFiltersNumberOfEmployees &&
					Object.values(filters.checkedFiltersNumberOfEmployees).some(Boolean),
				label: "Number of Employees",
				value: () =>
					getSelectedValues(filters.checkedFiltersNumberOfEmployees!),
			},
			{
				condition:
					filters.checkedFiltersRevenue &&
					Object.values(filters.checkedFiltersRevenue).some(Boolean),
				label: "Revenue",
				value: () => getSelectedValues(filters.checkedFiltersRevenue!),
			},
			{
				condition:
					filters.industry && Object.values(filters.industry).some(Boolean),
				label: "Industry",
				value: () => getSelectedValues(filters.industry!),
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

	const capitalizeCity = (city: string) => {
		return city
			?.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");
	};

	const handleResetFilters = async () => {
		const url = `/company`;

		try {
			setIsLoading(true);
			setAppliedDates({ start: null, end: null });
			setFormattedDates("");
			sessionStorage.removeItem("filters");
			const response = await axiosInstance.get(url);
			const [leads, count] = response.data;

			setData(Array.isArray(leads) ? leads : []);
			setCount(count || 0);
			setStatus(response.data.status);
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
			(filter) => filter.label !== filterToDelete.label,
		);
		setSelectedFilters(updatedFilters);

		const filters = JSON.parse(sessionStorage.getItem("filters") || "{}");

		switch (filterToDelete.label) {
			case "From Date":
				filters.from_date = null;
				setSelectedDates({ start: null, end: null });
				break;
			case "To Date":
				filters.to_date = null;
				setSelectedDates({ start: null, end: null });
				break;
			case "Regions":
				filters.regions = [];
				break;
			case "Search":
				filters.searchQuery = "";
				break;
			case "Employee Visits":
				filters.selectedPageVisit = "";
				break;
			case "Number of Employees":
				Object.keys(filters.checkedFiltersNumberOfEmployees).forEach((key) => {
					filters.checkedFiltersNumberOfEmployees[key] = false;
				});
				break;
			case "Revenue":
				Object.keys(filters.checkedFiltersRevenue).forEach((key) => {
					filters.checkedFiltersRevenue[key] = false;
				});
				break;
			case "Industry":
				Object.keys(filters.industry).forEach((key) => {
					filters.industry[key] = false;
				});
				break;
			default:
				break;
		}

		if (!filters.from_date && !filters.to_date) {
			filters.checkedFilters = {
				lastWeek: false,
				last30Days: false,
				last6Months: false,
				allTime: false,
			};
		}

		sessionStorage.setItem("filters", JSON.stringify(filters));

		if (filterToDelete.label === "Dates") {
			setAppliedDates({ start: null, end: null });
			setFormattedDates("");
			setSelectedDates({ start: null, end: null });
		}

		// Обновляем фильтры для применения
		const newFilters: FilterParams = {
			from_date: updatedFilters.find((f) => f.label === "From Date")
				? dayjs(
						updatedFilters.find((f) => f.label === "From Date")!.value,
					).unix()
				: null,
			to_date: updatedFilters.find((f) => f.label === "To Date")
				? dayjs(updatedFilters.find((f) => f.label === "To Date")!.value).unix()
				: null,
			regions: updatedFilters.find((f) => f.label === "Regions")
				? updatedFilters.find((f) => f.label === "Regions")!.value?.split(", ")
				: [],
			searchQuery: updatedFilters.find((f) => f.label === "Search")
				? updatedFilters.find((f) => f.label === "Search")!.value
				: "",
			selectedPageVisit: updatedFilters.find(
				(f) => f.label === "Employee Visits",
			)
				? updatedFilters.find((f) => f.label === "Employee Visits")!.value
				: "",
			checkedFiltersNumberOfEmployees: {
				...Object.keys(filters.checkedFiltersNumberOfEmployees).reduce(
					(acc, key) => {
						acc[key as keyof typeof filters.checkedFiltersNumberOfEmployees] =
							updatedFilters.some(
								(f) =>
									f.label === "Number of Employees" && f.value.includes(key),
							);
						return acc;
					},
					{} as Record<
						keyof typeof filters.checkedFiltersNumberOfEmployees,
						boolean
					>,
				),
				"1-10": false,
				"11-25": false,
				"26-50": false,
				"51-100": false,
				"101-250": false,
				"251-500": false,
				"501-1000": false,
				"1001-5000": false,
				"2001-5000": false,
				"5001-10000": false,
				"10001+": false,
				unknown: false,
			},
			checkedFiltersRevenue: {
				...Object.keys(filters.checkedFiltersRevenue).reduce(
					(acc, key) => {
						acc[key as keyof typeof filters.checkedFiltersRevenue] =
							updatedFilters.some(
								(f) => f.label === "Revenue" && f.value.includes(key),
							);
						return acc;
					},
					{} as Record<keyof typeof filters.checkedFiltersRevenue, boolean>,
				),
				"Below 10k": false,
				"$10k - $50k": false,
				"$50k - $100k": false,
				"$100k - $500k": false,
				"$500k - $1M": false,
				"$1M - $5M": false,
				"$5M - $10M": false,
				"$10M - $50M": false,
				"$50M - $100M": false,
				"$100M - $500M": false,
				"$500M - $1B": false,
				"$1 Billion +": false,
				unknown: false,
			},
			checkedFilters: {
				lastWeek: updatedFilters.some(
					(f) => f.label === "Date Range" && f.value === "lastWeek",
				),
				last30Days: updatedFilters.some(
					(f) => f.label === "Date Range" && f.value === "last30Days",
				),
				last6Months: updatedFilters.some(
					(f) => f.label === "Date Range" && f.value === "last6Months",
				),
				allTime: updatedFilters.some(
					(f) => f.label === "Date Range" && f.value === "allTime",
				),
			},
			industry: Object.fromEntries(
				Object.keys(filters.industry).map((key) => [
					key,
					updatedFilters.some(
						(f) => f.label === "Industry" && f.value.includes(key),
					),
				]),
			),
		};

		// Применяем обновленные фильтры
		handleApplyFilters(newFilters);
	};

	const columns = [
		{
			key: "company_name",
			label: "Company",
			sortable: true,
			widths: { width: "15vw", minWidth: "15vw", maxWidth: "15vw" },
		},
		{
			key: "phone_number",
			label: "Phone Number",
			widths: { width: "115px", minWidth: "115px", maxWidth: "115px" },
		},
		{
			key: "linkedin",
			label: "LinkedIn",
			widths: { width: "12vw", minWidth: "12vw", maxWidth: "12vw" },
		},
		{
			key: "employees_visited",
			label: "Visitors",
			sortable: true,
			widths: { width: "100px", minWidth: "100px", maxWidth: "100px" },
		},
		{
			key: "visited_date",
			label: "Visited date",
			sortable: true,
			widths: { width: "120px", minWidth: "120px", maxWidth: "120px" },
		},
		{
			key: "revenue",
			label: "Revenue",
			sortable: true,
			widths: { width: "125px", minWidth: "125px", maxWidth: "125px" },
		},
		{
			key: "number_of_employees",
			label: "No. of Employees",
			sortable: true,
			widths: { width: "11vw", minWidth: "11vw", maxWidth: "11vw" },
		},
		{
			key: "location",
			label: "Location",
			widths: { width: "150px", minWidth: "150px", maxWidth: "150px" },
		},
		{
			key: "average_time_sec",
			label: "Industry",
			widths: { width: "150px", minWidth: "150px", maxWidth: "150px" },
		},
	];

	const noContactsYet = data.length === 0 && selectedFilters.length === 0;

	const DownloadButton = (
		<Tooltip
			title={
				<Box
					sx={{
						backgroundColor: "#fff",
						margin: 0,
						padding: 0,
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<Typography
						className="table-data"
						component="div"
						sx={{ fontSize: "12px !important" }}
					>
						Download max 20,000 companies
					</Typography>
				</Box>
			}
			componentsProps={{
				tooltip: {
					sx: {
						backgroundColor: "#fff",
						color: "#000",
						boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
						border: " 0.2px solid rgba(255, 255, 255, 1)",
						borderRadius: "4px",
						maxHeight: "100%",
						maxWidth: "500px",
						padding: "11px 10px",
					},
				},
			}}
		>
			<Button
				aria-controls={dropdownOpen ? "account-dropdown" : undefined}
				aria-haspopup="true"
				aria-expanded={dropdownOpen ? "true" : undefined}
				disabled={status === "PIXEL_INSTALLATION_NEEDED"}
				sx={{
					textTransform: "none",
					color: "rgba(128, 128, 128, 1)",
					opacity: status === "PIXEL_INSTALLATION_NEEDED" ? "0.5" : "1",
					border: "1px solid rgba(184, 184, 184, 1)",
					borderRadius: "4px",
					padding: "8px",
					minWidth: "auto",
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
				onClick={handleDownload}
			>
				<DownloadIcon fontSize="medium" />
			</Button>
		</Tooltip>
	);

	const ButtonGroup = (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				position: "relative",
				alignItems: "center",
				gap: "15px",
				pt: "4px",
				"@media (max-width: 900px)": {
					gap: "8px",
				},
			}}
		>
			{DownloadButton}
			<HintCard
				card={companyTableCards["download"]}
				positionLeft={-420}
				positionTop={20}
				rightSide={true}
				isOpenBody={companyTableHints["download"].showBody}
				toggleClick={() => {
					if (companyTableHints["overview"].showBody) {
						changeCompanyTableHint("overview", "showBody", "close");
					}
					if (companyTableHints["employees"].showBody) {
						changeCompanyTableHint("employees", "showBody", "close");
					}
					changeCompanyTableHint("download", "showBody", "toggle");
				}}
				closeClick={() => {
					changeCompanyTableHint("download", "showBody", "close");
				}}
			/>

			<FilterButton
				dropdownOpen={dropdownOpen}
				handleFilterPopupOpen={handleFilterPopupOpen}
				selectedFilters={selectedFilters}
				status={status}
			/>
			<CalendarButton
				isCalendarOpen={isCalendarOpen}
				handleCalendarClick={handleCalendarClick}
				formattedDates={formattedDates}
				status={status}
			/>
		</Box>
	);

	return (
		<>
			{loading && <CustomizedProgressBar />}
			{companyEmployeesOpen && (
				<CompanyEmployees
					companyId={companyId}
					companyName={companyName}
					onBack={() => {
						setCompanyEmployeesOpen(false);
						sessionStorage.removeItem("filters-employee");
					}}
				/>
			)}
			{!companyEmployeesOpen && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						pr: 2.5,
						height: "100%",
						"@media (max-width: 900px)": {
							paddingRight: 0,
							minHeight: "100vh",
						},
						"@media (max-width: 599px)": {
							paddingRight: "16px",
							marginLeft: 0,
						},
					}}
				>
					<Box
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							gap: noContactsYet ? 2 : undefined,
						}}
					>
						{status !== "PIXEL_INSTALLATION_NEEDED" && (
							<>
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
											gap: 3,
											height: "46px",
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
											<Typography
												className="first-sub-title"
												style={{ textWrap: "nowrap" }}
											>
												Company list{" "}
												{data.length === 0
													? ""
													: `(${count_companies?.toLocaleString("en-US")})`}
											</Typography>
											<CustomToolTip
												title={
													"Contacts automatically sync across devices and platforms."
												}
												linkText="Learn more"
												linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/company"
											/>
										</Box>
									</Box>

									{!noContactsYet && ButtonGroup}
								</Box>
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
										let displayValue = filter.value;
										if (filter.label === "Regions") {
											const regions = filter.value?.split(", ") || [];
											const formattedRegions = regions.map((region) => {
												const [name] = region?.split("-");
												return name;
											});
											displayValue = formattedRegions.join(", ");
										}
										return (
											<Chip
												className="paragraph"
												key={filter.label}
												label={`${filter.label}: ${displayValue.charAt(0).toUpperCase() + displayValue.slice(1)}`}
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
							</>
						)}

						<Box
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								maxWidth: "100%",
								pl: 0,
								pr: 0,
								pb: "20px",
								"@media (max-width: 900px)": {
									pt: "2px",
									pb: "18px",
								},
							}}
						>
							{status === "PIXEL_INSTALLATION_NEEDED" ? (
								<Box sx={{ mr: 2 }}>
									<FirstTimeScreenCommonVariant2
										Header={{
											TextTitle: "Install Pixel",
										}}
										InfoNotification={{
											Text: "Company page will be available after pixel installation",
										}}
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
										Content={<GettingStartedSection />}
										ContentStyleSX={{
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "center",
											width: "100%",
											pb: 2,
											mt: 2,
										}}
									/>
								</Box>
							) : data.length === 0 ? (
								<EmptyAnalyticsPlaceholder />
							) : (
								<>
									<TableContainer
										ref={tableContainerRef}
										sx={{
											overflowX: "auto",
										}}
									>
										<Table
											stickyHeader
											component={Paper}
											aria-label="leads table"
											sx={{
												tableLayout: "fixed",
											}}
										>
											<TableHead
												sx={{
													position: "relative",
												}}
											>
												<TableRow>
													{columns.map((column) => {
														const {
															key,
															label,
															sortable = false,
															widths,
														} = column;
														const isNameColumn = key === "company_name";
														const isActionsColumn = key === "average_time_sec";
														const hideDivider =
															(isNameColumn && isScrolledX) || isActionsColumn;
														const baseCellSX: SxProps<Theme> = {
															...widths,
															position: "sticky",
															top: 0,
															zIndex: 7,
															borderBottom: "1px solid rgba(235,235,235,1)",
															borderTop: "1px solid rgba(235,235,235,1)",
															cursor: sortable ? "pointer" : "default",
															borderRight: isActionsColumn
																? "1px solid rgba(235,235,235,1)"
																: "none",
															whiteSpace: isActionsColumn ? "normal" : "wrap",
															overflow: isActionsColumn ? "visible" : "hidden",
														};

														if (isNameColumn) {
															baseCellSX.left = 0;
															baseCellSX.zIndex = 9;
															baseCellSX.boxShadow = isScrolledX
																? "3px 0px 3px rgba(0,0,0,0.2)"
																: "none";
														}

														const className = isNameColumn
															? "sticky-cell"
															: undefined;
														const onClickHandler = sortable
															? () => handleSortRequest(key)
															: undefined;

														return (
															<SmartCell
																key={key}
																cellOptions={{
																	sx: baseCellSX,
																	hideDivider,
																	onClick: onClickHandler,
																	className,
																}}
																contentOptions={{}}
															>
																<Box
																	sx={{
																		display: "flex",
																		alignItems: "center",
																		position: "relative",
																		justifyContent: "space-between",
																	}}
																>
																	<Typography
																		variant="body2"
																		sx={{
																			...companyStyles.table_column,
																			borderRight: "0",
																		}}
																	>
																		{label}
																	</Typography>
																	{sortable && (
																		<IconButton
																			size="small"
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
																			{orderBy === key ? (
																				order === "asc" ? (
																					<NorthOutlinedIcon fontSize="inherit" />
																				) : (
																					<SouthOutlinedIcon fontSize="inherit" />
																				)
																			) : (
																				<SwapVertIcon fontSize="inherit" />
																			)}
																		</IconButton>
																	)}
																</Box>
																{key === "number_of_employees" && (
																	<HintCard
																		card={companyTableCards["employees"]}
																		positionLeft={-300}
																		positionTop={80}
																		rightSide={true}
																		isOpenBody={
																			companyTableHints["employees"].showBody
																		}
																		toggleClick={() => {
																			if (
																				companyTableHints["download"].showBody
																			) {
																				changeCompanyTableHint(
																					"download",
																					"showBody",
																					"close",
																				);
																			}
																			if (
																				companyTableHints["overview"].showBody
																			) {
																				changeCompanyTableHint(
																					"overview",
																					"showBody",
																					"close",
																				);
																			}
																			changeCompanyTableHint(
																				"employees",
																				"showBody",
																				"toggle",
																			);
																		}}
																		closeClick={() => {
																			changeCompanyTableHint(
																				"employees",
																				"showBody",
																				"close",
																			);
																		}}
																	/>
																)}
																{key === "company_name" && (
																	<HintCard
																		card={companyTableCards["overview"]}
																		positionLeft={110}
																		positionTop={100}
																		isOpenBody={
																			companyTableHints["overview"].showBody
																		}
																		toggleClick={() => {
																			if (
																				companyTableHints["download"].showBody
																			) {
																				changeCompanyTableHint(
																					"download",
																					"showBody",
																					"close",
																				);
																			}
																			if (
																				companyTableHints["employees"].showBody
																			) {
																				changeCompanyTableHint(
																					"employees",
																					"showBody",
																					"close",
																				);
																			}
																			changeCompanyTableHint(
																				"overview",
																				"showBody",
																				"toggle",
																			);
																		}}
																		closeClick={() => {
																			changeCompanyTableHint(
																				"overview",
																				"showBody",
																				"close",
																			);
																		}}
																	/>
																)}
															</SmartCell>
														);
													})}
												</TableRow>
											</TableHead>
											<TableBody>
												{data.map((row) => (
													<TableRow
														key={row.id}
														selected={selectedRows.has(row.id)}
														sx={{
															backgroundColor: selectedRows.has(row.id)
																? "rgba(247, 247, 247, 1)"
																: "#fff",
															"&:hover": {
																backgroundColor: "rgba(247, 247, 247, 1)",
																"& .sticky-cell": {
																	backgroundColor: "rgba(247, 247, 247, 1)",
																},
															},
															"&:last-of-type .MuiTableCell-root": {
																borderBottom: "none",
															},
														}}
													>
														{/* Company name Column */}
														<SmartCell
															tooltipOptions={{
																content: row.name,
																always: false,
															}}
															cellOptions={{
																className: "sticky-cell",
																onClick: (e) => {
																	e.stopPropagation();
																	handleOpenPopup(row);
																},
																sx: {
																	zIndex: 8,
																	position: "sticky",
																	left: 0,
																	backgroundColor: "#fff",
																	boxShadow: isScrolledX
																		? "3px 0px 3px #00000033"
																		: "none",
																},
																hideDivider: isScrolledX,
															}}
															contentOptions={{
																sx: {
																	cursor: "pointer",
																	color: "rgba(56, 152, 252, 1)",
																},
															}}
														>
															{row.name ? row.name : "--"}
														</SmartCell>

														{/* Company phone Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	position: "relative",
																},
															}}
															tooltipOptions={{
																content: row.phone?.split(",")[0] || "--",
															}}
														>
															{row.phone?.split(",")[0] || "--"}
														</SmartCell>

														{/* Company linkedIn Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	position: "relative",
																},
																onClick: () => {
																	if (row.linkedin_url) {
																		window.open(
																			`https://${row.linkedin_url}`,
																			"_blank",
																		);
																	}
																},
															}}
															tooltipOptions={{
																content: row.linkedin_url
																	? row.linkedin_url.replace(
																			"linkedin.com/company/",
																			"",
																		)
																	: "--",
															}}
															contentOptions={{
																sx: {
																	color: row.linkedin_url
																		? "rgba(56, 152, 252, 1)"
																		: "",
																	cursor: row.linkedin_url
																		? "pointer"
																		: "default",
																},
															}}
														>
															{row.linkedin_url ? (
																<>
																	<Image
																		src="/linkedIn.svg"
																		alt="linkedIn"
																		width={16}
																		height={16}
																		style={{
																			marginRight: "2px",
																		}}
																	/>
																	/
																	{row.linkedin_url.replace(
																		"linkedin.com/company/",
																		"",
																	)}
																</>
															) : (
																"--"
															)}
														</SmartCell>

														{/* Employess Visited  Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	...companyStyles.table_array,
																	position: "relative",
																},
															}}
															tooltipOptions={{
																content: row.employees_visited || "--",
															}}
														>
															{row.employees_visited || "--"}
														</SmartCell>

														{/* Employess Visited date  Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	position: "relative",
																},
															}}
															tooltipOptions={{
																content: row.visited_date
																	? (() => {
																			const [day, month, year] =
																				row.visited_date.split(".");
																			return `${month}/${day}/${year}`;
																		})()
																	: "--",
															}}
														>
															{row.visited_date
																? (() => {
																		const [day, month, year] =
																			row.visited_date.split(".");
																		return `${month}/${day}/${year}`;
																	})()
																: "--"}
														</SmartCell>

														{/* Company revenue  Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	position: "relative",
																},
															}}
															tooltipOptions={{
																content: row.company_revenue || "--",
															}}
														>
															{row.company_revenue || "--"}
														</SmartCell>

														{/* Company employee count  Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	position: "relative",
																},
																onClick: () => {
																	setCompanyEmployeesOpen(true);
																	setCompanyName(row.name);
																	setCompanyId(row.id);
																},
															}}
															tooltipOptions={{
																content: row.employee_count || "--",
															}}
															contentOptions={{
																sx: {
																	cursor: "pointer",
																	color: "rgba(56, 152, 252, 1)",
																},
															}}
														>
															{row.employee_count || "--"}
														</SmartCell>

														{/* Company location  Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	position: "relative",
																},
															}}
															tooltipOptions={{
																content:
																	row.city || row.state
																		? [capitalizeCity(row.city), row.state]
																				.filter(Boolean)
																				.join(", ")
																		: "--",
															}}
														>
															{row.city || row.state
																? [capitalizeCity(row.city), row.state]
																		.filter(Boolean)
																		.join(", ")
																: "--"}
														</SmartCell>

														{/* Company industry  Column */}
														<SmartCell
															cellOptions={{
																sx: {
																	"::after": {
																		content: "none",
																	},
																	// cursor: row.industry ? "pointer" : "default",
																	borderRight: "1px solid rgba(235,235,235,1)",
																},
																// onClick: (e) => {
																//     if (row.industry) {
																//         handleOpenPopover(e, row.industry);
																//     }
																// },
															}}
															tooltipOptions={{
																content: row.industry || "--",
															}}
														>
															{row.industry && row.industry.length > 30
																? `${row.industry.slice(0, 20)}...`
																: row.industry || "--"}
														</SmartCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
									<Box
										ref={paginatorRef}
										sx={{ borderTop: "1px solid rgba(235,235,235,1)" }}
									>
										<Paginator tableMode {...paginationProps} />
									</Box>
								</>
							)}
							{showSlider && <Slider />}
						</Box>
						<Popover
							open={isOpen}
							anchorEl={anchorEl}
							onClose={handleClosePopover}
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
								{selectedIndustry?.split(",").map((part, index) => (
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
												index < selectedIndustry?.split(",").length - 1
													? "4px"
													: 0, // Отступы между строками
										}}
									>
										{part.trim()}
									</Typography>
								))}
							</Box>
						</Popover>

						<PopupDetails
							open={openPopup}
							onClose={handleClosePopup}
							rowData={popupData}
						/>
						<FilterPopup
							open={filterPopupOpen}
							onClose={handleFilterPopupClose}
							onApply={handleApplyFilters}
							industry={industry || []}
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
			)}
		</>
	);
};

const LeadsPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<SliderProvider>
				<Leads />
			</SliderProvider>
		</Suspense>
	);
};

export default LeadsPage;
