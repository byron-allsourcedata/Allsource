"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { usersStyle } from "./userStyle";
import {
	Box,
	Typography,
	Tabs,
	Tab,
	Chip,
	TextField,
	InputAdornment,
	Button,
	IconButton,
} from "@mui/material";
import axios from "axios";
import axiosInstance from "../../../../axios/axiosInterceptorInstance";
import { useRouter } from "next/navigation";
import AccountsTab from "./components/AccountsTab";
import UsersTab from "./components/UsersTab";
import PixelsTab, { DomainData } from "./components/PixelsTab";
import InviteAdmin from "./components/InviteAdmin";
import CustomCards from "./components/CustomCards";
import FilterPopup from "./components/FilterPopup";
import CustomizedProgressBar from "@/app/(admin)/components/AdminProgressBar";
import { showErrorToast } from "@/components/ToastNotification";
import { CloseIcon, SearchIcon, FilterListIcon } from "@/icon";
import CustomSwitch from "@/components/ui/CustomSwitch";

interface CustomCardsProps {
	users: number;
	pixel_contacts: number;
	sources: number;
	lookalikes: number;
	smart_audience: number;
	data_sync: number;
	total_revenue: number;
}

interface FilterParams {
	joinDate: { fromDate: number | null; toDate: number | null };
	lastLoginDate: { fromDate: number | null; toDate: number | null };
	statuses: Record<string, boolean>;
}

export interface UserData {
	id: number;
	full_name: string;
	email: string;
	created_at: string;
	status?: string;
	is_trial?: boolean;
	last_login: string;
	invited_by_email?: string;
	subscription_plan?: string;
	role: string[];
	team_access_level: string[];
	team_owner_id: number | null;
	pixel_installed_count?: number;
	contacts_count?: number;
	sources_count?: number;
	lookalikes_count?: number;
	credits_count?: number;
	premium_sources: number;
	type?: string;
	is_email_validation_enabled: boolean;
	is_another_domain_resolved: boolean;
	has_credit_card: boolean;
	cost_leads_overage: number;
	is_partner: boolean;
	is_master: boolean;
	whitelabel_settings_enabled?: boolean;
}

const Users: React.FC = () => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [tabIndex, setTabIndex] = useState(0);
	const [rowsPerPageOptions, setRowsPerPageOptions] = useState<number[]>();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState<number>(50);
	const [totalCount, setTotalCount] = useState(0);
	const [order, setOrder] = useState<"asc" | "desc" | "unset">("unset");
	const [orderBy, setOrderBy] = useState<string>("");
	const [isSliderOpen, setSliderOpen] = useState(false);
	const [filterPopupOpen, setFilterPopupOpen] = useState(false);
	const [excludeTestUsers, setExcludeTestUsers] = useState(true);
	const [selectedFilters, setSelectedFilters] = useState<
		{ label: string; value: string }[]
	>([]);
	const [userData, setUserData] = useState<UserData[]>([]);
	const [domainData, setDomainData] = useState<DomainData[]>([]);
	const [valuesMetrics, setValueMetrics] = useState<CustomCardsProps>({
		users: 0,
		pixel_contacts: 0,
		sources: 0,
		lookalikes: 0,
		smart_audience: 0,
		data_sync: 0,
		total_revenue: 0,
	});

	useEffect(() => {
		fetchData();
	}, [order, orderBy, selectedFilters, excludeTestUsers]);

	useEffect(() => {
		fetchUserData();
	}, [tabIndex, page, rowsPerPage, order, orderBy, selectedFilters]);

	const refresh = () => {
		fetchUserData(); // или fetchData(), если нужно всё обновлять
	};

	const handleSearchChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setSearch(event.target.value);
	};

	const handleResetFilters = async () => {
		const url =
			`/admin/admins?page=${page + 1}&per_page=${rowsPerPage}` +
			`&sort_by=${orderBy}&sort_order=${order}`;

		try {
			setLoading(true);
			sessionStorage.removeItem("filtersByAdmin");
			const response = await axiosInstance.get(url);
			if (response.status === 200) {
				setUserData(response.data.users);
				setTotalCount(response.data.count);
				const options = [50, 100, 300, 500];
				let RowsPerPageOptions = options.filter(
					(option) => option <= response.data.count,
				);
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
			}
			setSelectedFilters([]);
		} catch (error) {
			console.error("Error fetching leads:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			let url = "/admin/audience-metrics?";

			if (selectedFilters.length > 0) {
				for (const filter of selectedFilters) {
					url += `&${filter.label}=${filter.value}`;
				}
			}

			if (search.trim() !== "") {
				url += `&search_query=${encodeURIComponent(search.trim())}`;
			}

			if (excludeTestUsers) {
				url += `&exclude_test_users=true`;
			}

			const response = await axiosInstance.get(url);
			if (response.status === 200) {
				setValueMetrics({
					users: response.data.audience_metrics.users_count ?? 0,
					pixel_contacts: response.data.audience_metrics.pixel_contacts ?? 0,
					sources: response.data.audience_metrics.sources_count ?? 0,
					lookalikes: response.data.audience_metrics.lookalike_count ?? 0,
					smart_audience: response.data.audience_metrics.smart_count ?? 0,
					data_sync: response.data.audience_metrics.sync_count ?? 0,
					total_revenue: response.data.audience_metrics.total_revenue ?? 0,
				});
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 403) {
					showErrorToast("Error 403: Access is denied");
					router.push("/signin");
				} else {
					showErrorToast(`Error: ${error.response?.status}`);
				}
			}
		} finally {
			setLoading(false);
		}
		fetchUserData();
	};

	const fetchUserData = async () => {
		try {
			setLoading(true);
			const basePath = "/admin";
			let endpoint = "/accounts";

			switch (tabIndex) {
				case 0:
					endpoint = "/accounts";
					break;
				case 1:
					endpoint = "/users";
					break;
				case 2:
					endpoint = "/domains";
					break;
				case 3:
					endpoint = "/admins";
					break;
				case 4:
					endpoint = "/partners?is_master=true";
					break;
				case 5:
					endpoint = "/partners";
					break;
				default:
					endpoint = "/accounts";
			}

			let queryParams = [
				`page=${page + 1}`,
				`per_page=${rowsPerPage}`,
				`sort_by=${orderBy}`,
				`sort_order=${order}`,
			];

			if (selectedFilters.length > 0) {
				for (const filter of selectedFilters) {
					queryParams.push(`${filter.label}=${filter.value}`);
				}
			}

			if (excludeTestUsers) {
				queryParams.push("exclude_test_users=true");
			}

			if (search.trim() !== "") {
				queryParams.push(`search_query=${encodeURIComponent(search.trim())}`);
			}

			let url = basePath + endpoint;
			url += endpoint.includes("?") ? "&" : "?";
			url += queryParams.join("&");

			const response = await axiosInstance.get(url);
			if (response.status === 200) {
				if (tabIndex === 2) {
					setDomainData(response.data.domains);
					setTotalCount(response.data.count);
				}
				if (tabIndex === 0) {
					setUserData(response.data.accounts);
				} else {
					setUserData(response.data.users);
				}
				setTotalCount(response.data.count);
				const options = [50, 100, 300, 500];
				let RowsPerPageOptions = options.filter(
					(option) => option <= response.data.count,
				);
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
			}
		} catch (error) {
			console.error("Failed to fetch user data:", error);
		} finally {
			setLoading(false);
		}
	};

	const tabs = [
		{ id: 0, label: "Account", visible: true },
		{ id: 1, label: "Users", visible: true },
		{ id: 2, label: "Pixels", visible: true },
		{ id: 3, label: "Admins", visible: true },
		{ id: 4, label: "Master Partners", visible: true },
		{ id: 5, label: "Partners", visible: true },
	];

	const handleFilterPopupOpen = () => {
		setFilterPopupOpen(true);
	};

	const handleFilterPopupClose = () => {
		setFilterPopupOpen(false);
	};

	const handleDeleteFilter = (filterToDelete: {
		label: string;
		value: string;
	}) => {
		const updatedFilters = selectedFilters.filter(
			(filter) => filter.label !== filterToDelete.label,
		);

		setSelectedFilters(updatedFilters);

		const filters = JSON.parse(
			sessionStorage.getItem("filtersByAdmin") || "{}",
		);

		switch (filterToDelete.label) {
			case "From Date":
				filters.from_date = null;
				break;
			case "To Date":
				filters.to_date = null;
				break;
			case "statuses":
				filters.statuses = {};
				break;
			default:
				break;
		}

		sessionStorage.setItem("filtersByAdmin", JSON.stringify(filters));
	};

	function formatFilterValue(value: string): string {
		if (/^\d+$/.test(value)) {
			const date = new Date(Number.parseInt(value, 10) * 1000);
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			const day = date.getDate().toString().padStart(2, "0");
			const year = date.getFullYear();
			return `${month}/${day}/${year}`;
		}
		return value
			.split(", ")
			.map((item) =>
				item
					.split("_")
					.map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
					.join(" "),
			)
			.join(", ");
	}

	function formatFilterLabel(label: string) {
		if (typeof label !== "string") return "";
		const normalized = label.replace(/_/g, " ");
		return normalized.charAt(0).toUpperCase() + normalized.slice(1);
	}

	const getSelectedValues = (obj: Record<string, boolean>): string => {
		return Object.entries(obj)
			.filter(([_, value]) => value)
			.map(([key]) => toSnakeCase(key))
			.join(", ");
	};

	const toSnakeCase = (str: string) =>
		str.trim().toLowerCase().replace(/\s+/g, "_");

	const handleApplyFilters = (filters: FilterParams) => {
		const newSelectedFilters: { label: string; value: string }[] = [];

		const processDateRange = (key: keyof FilterParams, baseLabel: string) => {
			const from = filters[key].fromDate;
			const to = filters[key].toDate;

			if (from) {
				newSelectedFilters.push({
					label: `${baseLabel}_start`,
					value: String(from),
				});
			}

			if (to) {
				newSelectedFilters.push({
					label: `${baseLabel}_end`,
					value: String(to),
				});
			}
		};

		if (
			Object.keys(filters.statuses).length > 0 &&
			Object.values(filters.statuses).includes(true)
		) {
			newSelectedFilters.push({
				label: "statuses",
				value: getSelectedValues(filters.statuses!),
			});
		}

		processDateRange("lastLoginDate", "last_login_date");
		processDateRange("joinDate", "join_date");

		setSelectedFilters(newSelectedFilters);
	};

	const handleFormOpenPopup = () => {
		setSliderOpen(true);
	};

	const handleFormClosePopup = () => {
		setSliderOpen(false);
	};

	const handleTabChange = (
		event: React.SyntheticEvent | null,
		newIndex: number,
	) => {
		setSearch("");
		setExcludeTestUsers(false);
		setTabIndex(newIndex);
	};

	const tabConfig: Record<
		number,
		{ placeholder: string; showExclude: boolean }
	> = {
		0: { placeholder: "Search company name", showExclude: false },
		1: { placeholder: "Search by account name, emails", showExclude: true },
		2: {
			placeholder: "Search by domain, account name",
			showExclude: false,
		},
		3: { placeholder: "Search by admin account", showExclude: false },
		4: { placeholder: "Search master partner name, emails", showExclude: true },
		5: { placeholder: "Search by partner name, emails", showExclude: true },
	};

	const { placeholder, showExclude } = tabConfig[tabIndex] || {
		placeholder: "Search...",
		showExclude: false,
	};

	return (
		<>
			<Box
				sx={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					pr: 2,
					pl: 2,
					width: "100%",
					overflow: "auto",
					height: "100%",
				}}
			>
				{loading && <CustomizedProgressBar />}
				<Box sx={{ display: "flex", flexDirection: "column", pt: 3 }}>
					<Box>
						<CustomCards values={valuesMetrics} />
					</Box>
					<InviteAdmin open={isSliderOpen} onClose={handleFormClosePopup} />
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							pb: "24px",
						}}
					>
						<Box>
							<Tabs
								value={tabIndex}
								onChange={handleTabChange}
								aria-label="admin tabs"
								TabIndicatorProps={{
									sx: {
										backgroundColor: "rgba(56, 152, 252, 1)",
										height: "2px",
										bottom: 5,
									},
								}}
								sx={{
									minHeight: 0,
									justifyContent: "flex-start",
									alignItems: "left",
									"@media (max-width: 600px)": {
										border: "1px solid rgba(228, 228, 228, 1)",
										borderRadius: "4px",
										width: "100%",
										"& .MuiTabs-indicator": {
											height: "1.4px",
										},
									},
								}}
							>
								{tabs
									.filter((t) => t.visible)
									.map((tab, index) => (
										<Tab
											key={index}
											label={tab.label}
											sx={{
												fontFamily: "var(--font-nunito)",
												fontWeight: 500,
												fontSize: "14px",
												lineHeight: "100%",
												letterSpacing: "0%",
												color: "rgba(112, 112, 113, 1)",
												textTransform: "none",
												padding: "4px 1px",
												minHeight: "auto",
												flexGrow: 1,
												pb: "10px",
												textAlign: "center",
												mr: 2,
												minWidth: "auto",
												"&.Mui-selected": {
													fontWeight: 700,
													color: "rgba(56, 152, 252, 1)",
												},
												"&.MuiTabs-indicator": {
													backgroundColor: "rgba(56, 152, 252, 1)",
												},
												"@media (max-width: 600px)": {
													mr: 1,
													borderRadius: "4px",
													"&.Mui-selected": {
														backgroundColor: "rgba(249, 249, 253, 1)",
														border: "1px solid rgba(220, 220, 239, 1)",
													},
												},
											}}
										/>
									))}
							</Tabs>

							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									flexDirection: "row",
									flexWrap: "wrap",
									gap: 1,
									mt: 2,
									mb: 2,
									overflowX: "auto",
									"@media (max-width: 600px)": {
										mb: 1,
									},
								}}
							>
								{selectedFilters.length > 0 && (
									<Chip
										className="second-sub-title"
										label="Clear all"
										onClick={handleResetFilters}
										sx={{
											color: `${"rgba(56, 152, 252, 1)"} !important`,
											backgroundColor: "transparent",
											lineHeight: "20px !important",
											fontWeight: "400 !important",
											borderRadius: "4px",
										}}
									/>
								)}
								{selectedFilters.map((filter) => (
									<Chip
										key={filter.label}
										label={`${formatFilterLabel(filter.label)}: ${formatFilterValue(filter.value)}`}
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
								))}
							</Box>
						</Box>

						<Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
							{showExclude && (
								<Box sx={{ display: "flex", alignItems: "center" }}>
									<Typography className="black-table-header">
										Exclude test users
									</Typography>
									<CustomSwitch
										stateSwitch={excludeTestUsers}
										changeState={() => setExcludeTestUsers((prev) => !prev)}
									/>
								</Box>
							)}

							<TextField
								placeholder={placeholder}
								value={search}
								onChange={(e) => {
									handleSearchChange(e);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										fetchData();
									}
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<IconButton
												sx={{ ":hover": { backgroundColor: "transparent" } }}
												size="small"
												onClick={() => fetchData()}
											>
												<SearchIcon style={{ cursor: "pointer" }} />{" "}
											</IconButton>
										</InputAdornment>
									),
								}}
								variant="outlined"
								sx={{
									flex: 1,
									width: "360px",
									"& .MuiOutlinedInput-root": {
										borderRadius: "4px",
										height: "40px",
									},
									"& input": {
										paddingLeft: 0,
									},
									"& input::placeholder": {
										fontSize: "14px",
										color: "#8C8C8C",
									},
								}}
							/>
							{tabIndex === 3 && (
								<Button
									variant="outlined"
									sx={{
										height: "40px",
										borderRadius: "4px",
										textTransform: "none",
										fontSize: "14px",
										fontWeight: "500",
										color: "rgba(56, 152, 252, 1)",
										borderColor: "rgba(56, 152, 252, 1)",
										"&:hover": {
											backgroundColor: "rgba(80, 82, 178, 0.1)",
											borderColor: "rgba(56, 152, 252, 1)",
										},
									}}
									onClick={() => {
										handleFormOpenPopup();
									}}
								>
									Add Admin
								</Button>
							)}
							{(showExclude || tabIndex === 0) && (
								<Button
									onClick={handleFilterPopupOpen}
									aria-haspopup="true"
									sx={{
										textTransform: "none",
										height: "40px",
										color:
											selectedFilters.length > 0
												? "rgba(56, 152, 252, 1)"
												: "rgba(128, 128, 128, 1)",
										border:
											selectedFilters.length > 0
												? `1px solid ${"rgba(56, 152, 252, 1)"}`
												: "1px solid rgba(184, 184, 184, 1)",
										borderRadius: "4px",
										padding: "8px",
										opacity: "1",
										minWidth: "auto",
										position: "relative",
										"@media (max-width: 900px)": {
											border: "none",
											padding: 0,
										},
										"&:hover": {
											backgroundColor: "transparent",
											border: `1px solid ${"rgba(56, 152, 252, 1)"}`,
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
							)}
							<FilterPopup
								open={filterPopupOpen}
								onClose={handleFilterPopupClose}
								onApply={handleApplyFilters}
							/>
						</Box>
					</Box>
					{tabIndex === 0 && (
						<AccountsTab
							rowsPerPageOptions={rowsPerPageOptions}
							totalCount={totalCount}
							userData={userData}
							setPage={setPage}
							page={page}
							setRowsPerPage={setRowsPerPage}
							rowsPerPage={rowsPerPage}
							order={order}
							orderBy={orderBy}
							setOrder={setOrder}
							setOrderBy={setOrderBy}
							setLoading={setLoading}
							onPlanChanged={fetchUserData}
						/>
					)}
					{tabIndex === 1 && (
						<UsersTab
							rowsPerPageOptions={rowsPerPageOptions}
							totalCount={totalCount}
							userData={userData}
							setPage={setPage}
							page={page}
							setRowsPerPage={setRowsPerPage}
							rowsPerPage={rowsPerPage}
							order={order}
							orderBy={orderBy}
							setOrder={setOrder}
							setOrderBy={setOrderBy}
							setLoading={setLoading}
							onPlanChanged={fetchUserData}
							isMaster={false}
							isPartnerTab={false}
						/>
					)}
					{tabIndex === 2 && (
						<PixelsTab
							domains={domainData}
							setPage={setPage}
							page={page}
							setRowsPerPage={setRowsPerPage}
							rowsPerPage={rowsPerPage}
							order={order}
							orderBy={orderBy}
							setOrder={setOrder}
							setOrderBy={setOrderBy}
							setLoading={setLoading}
							totalCount={totalCount}
							refresh={refresh}
						/>
					)}
					{tabIndex === 3 && (
						<UsersTab
							rowsPerPageOptions={rowsPerPageOptions}
							totalCount={totalCount}
							userData={userData}
							setPage={setPage}
							page={page}
							setRowsPerPage={setRowsPerPage}
							rowsPerPage={rowsPerPage}
							order={order}
							orderBy={orderBy}
							setOrder={setOrder}
							setOrderBy={setOrderBy}
							setLoading={setLoading}
							onPlanChanged={fetchUserData}
							isMaster={false}
							isPartnerTab={false}
						/>
					)}
					{tabIndex === 4 && (
						<UsersTab
							rowsPerPageOptions={rowsPerPageOptions}
							totalCount={totalCount}
							userData={userData}
							setPage={setPage}
							page={page}
							setRowsPerPage={setRowsPerPage}
							rowsPerPage={rowsPerPage}
							order={order}
							orderBy={orderBy}
							setOrder={setOrder}
							setOrderBy={setOrderBy}
							setLoading={setLoading}
							onPlanChanged={fetchUserData}
							isMaster={true}
							isPartnerTab={true}
						/>
					)}
					{tabIndex === 5 && (
						<UsersTab
							rowsPerPageOptions={rowsPerPageOptions}
							totalCount={totalCount}
							userData={userData}
							setPage={setPage}
							page={page}
							setRowsPerPage={setRowsPerPage}
							rowsPerPage={rowsPerPage}
							order={order}
							orderBy={orderBy}
							setOrder={setOrder}
							setOrderBy={setOrderBy}
							setLoading={setLoading}
							onPlanChanged={fetchUserData}
							isMaster={false}
							isPartnerTab={true}
						/>
					)}
				</Box>
			</Box>
		</>
	);
};

export default Users;
