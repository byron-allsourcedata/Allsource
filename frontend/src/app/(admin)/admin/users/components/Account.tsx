import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
	Box,
	Typography,
	Button,
	Grid,
	Chip,
	Popover,
	Paper,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { useState } from "react";
import { suppressionsStyles } from "@/css/suppressions";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import Image from "next/image";
import CustomTablePagination from "@/components/CustomTablePagination";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { fetchUserData } from "@/services/meService";
import { MenuIconButton } from "@/components/table";
import {
	MoreVert,
	SwapVertIcon,
	ArrowDownwardIcon,
	ArrowUpwardIcon,
} from "@/icon";

interface UserData {
	id: number;
	full_name: string;
	email: string;
	created_at: string;
	payment_status?: string;
	is_trial?: boolean;
	last_login: string;
	invited_by_email?: string;
	role: string[];
	pixel_installed_count?: number;
	sources_count?: number;
	lookalikes_count?: number;
	credits_count?: number;
	type?: string;
}

interface tableHeaders {
	key: string;
	label: string;
	sortable: boolean;
}

interface TableBodyUserProps {
	data: UserData[];
	currentPage: number;
	tableHeaders: tableHeaders[];
	setLoading: (state: boolean) => void;
}

const TableHeader: React.FC<{
	onSort: (field: string) => void;
	sortField?: string;
	sortOrder?: string;
	tableHeaders: tableHeaders[];
}> = ({ onSort, sortField, sortOrder, tableHeaders }) => {
	return (
		<TableHead>
			<TableRow>
				{tableHeaders.map(({ key, label, sortable }) => (
					<TableCell
						key={key}
						sx={{
							...datasyncStyle.table_column,
							backgroundColor: "#fff",
							textWrap: "wrap",
							textAlign: "center",
							position: "relative",
							...(key === "account_name" && {
								position: "sticky",
								left: 0,
								zIndex: 1,
							}),
							...(key === "actions" && {
								"::after": {
									content: "none",
								},
							}),
						}}
						onClick={sortable ? () => onSort(key) : undefined}
					>
						<Box
							sx={{ display: "flex", alignItems: "center" }}
							style={
								key === "email" || key === "status" || key === "actions"
									? { justifyContent: "left" }
									: {}
							}
						>
							<Typography variant="body2" className="table-heading">
								{label}
							</Typography>
							{sortable && (
								<IconButton size="small" sx={{ ml: 1 }}>
									{sortField === key ? (
										sortOrder === "asc" ? (
											<ArrowUpwardIcon fontSize="inherit" />
										) : (
											<ArrowDownwardIcon fontSize="inherit" />
										)
									) : (
										<SwapVertIcon fontSize="inherit" />
									)}
								</IconButton>
							)}
						</Box>
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
};

const TableBodyClient: React.FC<TableBodyUserProps> = ({
	data,
	tableHeaders,
	setLoading,
	currentPage,
}) => {
	const router = useRouter();
	const { setBackButton, triggerBackButton } = useUser();

	const meItem =
		typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
	const meData = meItem ? JSON.parse(meItem) : { full_name: "", email: "" };

	const handleLogin = async (user_account_id: number) => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/admin/generate-token", {
				params: {
					user_account_id: user_account_id,
				},
			});
			if (response.status === 200) {
				const current_token = localStorage.getItem("token");
				const current_domain = sessionStorage.getItem("current_domain");
				sessionStorage.setItem("parent_domain", current_domain || "");
				if (current_token) {
					localStorage.setItem("parent_token", current_token);
					localStorage.setItem("token", response.data.token);
					sessionStorage.removeItem("current_domain");
					sessionStorage.removeItem("me");
					await fetchUserData();
					router.push("/dashboard");
					router.refresh();
					setBackButton(true);
					triggerBackButton();
				}
			}
		} catch {
		} finally {
			setLoading(false);
		}
	};

	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [activeRow, setActiveRow] = useState<number | null>(null);

	const handleOpenMenu = (
		event: React.MouseEvent<HTMLElement>,
		rowId: number,
	) => {
		setMenuAnchor(event.currentTarget);
		setActiveRow(rowId);
	};

	function formatCreditsCount(count: number | null) {
		if (count === -1) {
			return "unlimited";
		}
		if (typeof count === "number" && count > 0) {
			return count.toLocaleString("en-US");
		}
		return "0";
	}

	const handleCloseMenu = () => {
		setMenuAnchor(null);
		setActiveRow(null);
	};

	const formatDate = (dateString: string | null): string => {
		if (!dateString) return "--";
		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "short",
			day: "numeric",
		};
		return new Date(dateString).toLocaleDateString("en-US", options);
	};
	const getStatusStyle = (behavior_type: string) => {
		switch (behavior_type) {
			case "TRIAL_ACTIVE":
				return {
					background: "rgba(235, 243, 254, 1)",
					color: "rgba(20, 110, 246, 1) !important",
				};
			case "PIXEL_INSTALLED":
				return {
					background: "rgba(234, 248, 221, 1)",
					color: "rgba(43, 91, 0, 1) !important",
				};
			case "FILL_COMPANY_DETAILS":
				return {
					background: "rgba(254, 243, 205, 1)",
					color: "rgba(101, 79, 0, 1) !important",
				};
			case "SUBSCRIPTION_ACTIVE":
				return {
					background: "rgba(234, 248, 221, 1)",
					color: "rgba(43, 91, 0, 1) !important",
				};
			case "NEED_CONFIRM_EMAIL":
				return {
					background: "rgba(241, 241, 249, 1)",
					color: "rgba(56, 152, 252, 1) !important",
				};
			case "NEED_CHOOSE_PLAN":
				return {
					background: "rgba(254, 238, 236, 1)",
					color: "rgba(244, 87, 69, 1) !important",
				};
			case "NEED_BOOK_CALL":
				return {
					background: "rgba(254, 238, 236, 1)",
					color: "rgba(244, 87, 69, 1) !important",
				};
			default:
				return {
					background: "transparent",
					color: "inherit",
				};
		}
	};

	const formatFunnelText = (text: string) => {
		if (text === "NEED_CHOOSE_PLAN") {
			return "Need choose Plan";
		}
		if (text === "FILL_COMPANY_DETAILS") {
			return "Fill company details";
		}
		if (text === "TRIAL_ACTIVE") {
			return "Trial Active";
		}
		if (text === "SUBSCRIPTION_ACTIVE") {
			return "Subscription Active";
		}
		if (text === "NEED_CONFIRM_EMAIL") {
			return "Need confirm email";
		}
		if (text === "NEED_BOOK_CALL") {
			return "Need book call";
		}
		if (text === "PAYMENT_NEEDED") {
			return "Payment needed";
		}
		if (text === "PIXEL_INSTALLED") {
			return "Pixel installed";
		}
	};

	const renderCellContent = (key: string, row: UserData) => {
		const isCurrentUser = meData.email === row.email;
		switch (key) {
			case "name":
				return (
					<Box
						className="table-data sticky-cell"
						sx={{
							...suppressionsStyles.tableBodyColumn,
							paddingLeft: "16px",
							position: "sticky",
							justifyContent: "left",
							left: 0,
							zIndex: 1,
							cursor:
								isCurrentUser || row.type !== "user" ? "default" : "pointer",
							"& .icon-button": {
								opacity: 0,
								pointerEvents: "none",
								transition: "opacity 0.2s",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								mr: 2,
							},
							"&:hover .icon-button": {
								opacity: 1,
								pointerEvents: "auto",
							},
						}}
						onClick={() => {
							if (!isCurrentUser && row.type === "user") {
								handleLogin(row.id);
							}
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								overflowWrap: "break-word",
								justifyContent: "space-between",
								color: "rgba(56, 152, 252, 1)",
								gap: 0,
								width: "100%",
							}}
						>
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									alignItems: "center",
									color:
										isCurrentUser || row.type !== "user"
											? "#000"
											: "rgba(56, 152, 252, 1)",
									gap: 0.5,
								}}
							>
								<Box
									sx={{
										maxWidth: "150px",
										display: "flex",
										flexWrap: "wrap",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									<Box
										sx={{
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
											minWidth: 0,
											flexShrink: 1,
											pr: "10px",
										}}
									>
										{row.full_name.replace("#test_allsource", "").trim()}
									</Box>

									{row.full_name.includes("#test_allsource") && (
										<Chip
											label="Test"
											size="small"
											sx={{
												fontSize: "0.7rem",
												height: "20px",
												backgroundColor: "#E8F5E9",
												color: "#388E3C",
												flexShrink: 0,
											}}
										/>
									)}
								</Box>

								{row.type === "invitation" && (
									<Chip
										label="Invitation"
										size="small"
										sx={{
											fontSize: "0.7rem",
											height: "20px",
											backgroundColor: "#FFE0B2",
											color: "#BF360C",
											ml: 0,
										}}
									/>
								)}
							</Box>

							{!isCurrentUser && row.type === "user" && (
								<IconButton
									onClick={(e) => {
										e.stopPropagation();
										handleLogin(row.id);
									}}
									className="icon-button"
									sx={{
										display: "none",
										alignItems: "center",
										color: "rgba(56, 152, 252, 1)",
									}}
								>
									<Image
										src="/outband.svg"
										alt="outband"
										width={15.98}
										height={16}
									/>
								</IconButton>
							)}
						</Box>
					</Box>
				);
			case "email":
				return row.email || "--";
			case "last_login_date":
				return formatDate(row.last_login);
			case "invited_by":
				return row.invited_by_email || "--";
			case "access_level":
				return Array.isArray(row.role) && row.role.length > 0
					? row.role.join(", ")
					: "--";
			case "pixel_installed_count":
				return row.pixel_installed_count || "0";
			case "join_date":
				return formatDate(row.created_at);
			case "sources_count":
				return row.sources_count || "0";
			case "lookalikes_count":
				return row.lookalikes_count || "0";
			case "credits_count":
				return formatCreditsCount(row.credits_count || 0);
			case "status":
				return (
					<Typography
						className="paragraph"
						sx={{
							display: "flex",
							padding: "2px 8px",
							borderRadius: "2px",
							fontFamily: "Roboto",
							fontSize: "12px",
							fontWeight: "400",
							lineHeight: "normal",
							backgroundColor: getStatusStyle(row.payment_status ?? "")
								.background,
							color: getStatusStyle(row?.payment_status ?? "").color,
							justifyContent: "center",
							minWidth: "130px",
							textTransform: "capitalize",
						}}
					>
						{formatFunnelText(row.payment_status ?? "") || "--"}
					</Typography>
				);
			case "actions":
				if (currentPage === 0) {
					return (
						<>
							<MenuIconButton
								buttonProps={{
									onClick: (event) => handleOpenMenu(event, row.id),
								}}
								iconProps={{
									icon: <MoreVert />,
								}}
							/>
							<Popover
								open={Boolean(menuAnchor) && activeRow === row.id}
								anchorEl={menuAnchor}
								onClose={handleCloseMenu}
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "center",
								}}
							>
								<Box
									sx={{
										p: 1,
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										width: "100%",
										maxWidth: "160px",
									}}
								>
									<Button
										sx={{
											justifyContent: "flex-start",
											width: "100%",
											textTransform: "none",
											fontFamily: "Nunito Sans",
											fontSize: "14px",
											color: "rgba(32, 33, 36, 1)",
											fontWeight: 600,
											":hover": {
												color: "rgba(56, 152, 252, 1)",
												backgroundColor: "rgba(80, 82, 178, 0.1)",
											},
										}}
										onClick={() => {
											console.log("Customer: View Orders clicked");
										}}
									>
										View Orders
									</Button>
								</Box>
							</Popover>
						</>
					);
				}
				if (currentPage === 1) {
					return (
						<>
							<MenuIconButton
								buttonProps={{
									onClick: (event) => handleOpenMenu(event, row.id),
								}}
								iconProps={{
									icon: <MoreVert />,
								}}
							/>
							<Popover
								open={Boolean(menuAnchor) && activeRow === row.id}
								anchorEl={menuAnchor}
								onClose={handleCloseMenu}
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "center",
								}}
							>
								<Box
									sx={{
										p: 1,
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										width: "100%",
										maxWidth: "160px",
									}}
								>
									<Button
										sx={{
											justifyContent: "flex-start",
											width: "100%",
											textTransform: "none",
											fontFamily: "Nunito Sans",
											fontSize: "14px",
											color: "rgba(32, 33, 36, 1)",
											fontWeight: 600,
											":hover": {
												color: "rgba(56, 152, 252, 1)",
												backgroundColor: "rgba(80, 82, 178, 0.1)",
											},
										}}
										onClick={() => {
											console.log("Customer: View Orders clicked");
										}}
									>
										View Orders
									</Button>
								</Box>
							</Popover>
						</>
					);
				}
				return null;
		}
	};

	return (
		<TableBody>
			{data.map((row) => (
				<TableRow
					key={row.id}
					sx={{
						"&:hover": {
							backgroundColor: "rgba(247, 247, 247, 1)",
						},
					}}
				>
					{tableHeaders.map(({ key }) => (
						<TableCell
							key={key}
							sx={{
								...leadsStyles.table_array,
								textAlign: key === "actions" ? "center" : "left",
								position: "relative",
								padding: "8px",
							}}
						>
							{renderCellContent(key, row)}
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	);
};

interface PartnersAccountsProps {
	is_admin?: boolean;
	rowsPerPageOptions?: number[];
	totalCount: number;
	userData: AccountData[];
	setPage: any;
	page: number;
	setLoading?: any;
	rowsPerPage: number;
	accountsData?: any;
	order?: any;
	orderBy?: string;
	setRowsPerPage?: any;
	setOrder?: any;
	setOrderBy?: any;
}

interface AccountData {
	id: number;
	full_name: string;
	email: string;
	created_at: string;
	payment_status?: string;
	is_trial?: boolean;
	last_login: string;
	invited_by_email?: string;
	role: string[];
	pixel_installed_count?: number;
	sources_count?: number;
	lookalikes_count?: number;
	credits_count?: number;
	type?: string;
}

const Account: React.FC<PartnersAccountsProps> = ({
	is_admin,
	rowsPerPageOptions,
	totalCount,
	userData,
	setPage,
	page,
	setRowsPerPage,
	rowsPerPage,
	order,
	orderBy,
	setLoading,
	setOrder,
	setOrderBy,
}) => {
	const tableHeaders = is_admin
		? [
				{ key: "name", label: "Account name", sortable: false },
				{ key: "email", label: "Email", sortable: false },
				{ key: "join_date", label: "Join date", sortable: true },
				{ key: "last_login_date", label: "Last Login Date", sortable: true },
				{ key: "invited_by", label: "Invited by", sortable: false },
				{ key: "access_level", label: "Access level", sortable: false },
				{ key: "actions", label: "Actions", sortable: false },
			]
		: [
				{ key: "name", label: "Account name", sortable: false },
				{ key: "email", label: "Email", sortable: false },
				{ key: "join_date", label: "Join date", sortable: true },
				{ key: "last_login_date", label: "Last Login Date", sortable: true },
				{ key: "pixel_installed_count", label: "Pixel", sortable: false },
				{ key: "sources_count", label: "Sources", sortable: false },
				{ key: "lookalikes_count", label: "Lookalikes", sortable: false },
				{ key: "credits_count", label: "Credits count", sortable: false },
				{ key: "status", label: "Status", sortable: false },
				{ key: "actions", label: "Actions", sortable: false },
			];

	const handlePageChange = (
		event: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number,
	) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (
		event: React.ChangeEvent<{ value: unknown }>,
	) => {
		setRowsPerPage(Number.parseInt(event.target.value as string, 10));
		setPage(0);
	};

	const handleSortRequest = (property: string) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
	};

	return (
		<>
			<Box
				sx={{
					backgroundColor: "#fff",
					width: "100%",
					padding: 0,
					margin: "0 auto",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					minHeight: "77vh",
					"@media (max-width: 600px)": { margin: "0rem auto 0rem" },
				}}
			>
				<Grid
					container
					direction="column"
					justifyContent="flex-start"
					spacing={2}
					sx={{ minHeight: "100vh" }}
				>
					<Grid item xs={12} sx={{ pl: 1, mt: 0 }}>
						<TableContainer
							component={Paper}
							sx={{
								border: "1px solid rgba(235, 235, 235, 1)",
								maxHeight: "calc(100vh - 400px)",
								overflowY: "auto",
								overflowX: "auto",
							}}
						>
							<Table stickyHeader>
								<TableHeader
									onSort={handleSortRequest}
									tableHeaders={tableHeaders}
									sortField={orderBy}
									sortOrder={order}
								/>
								<TableBodyClient
									data={userData}
									tableHeaders={tableHeaders}
									setLoading={setLoading}
									currentPage={page}
								/>
							</Table>
						</TableContainer>
						<Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
							<CustomTablePagination
								count={totalCount ?? 0}
								page={page}
								rowsPerPage={rowsPerPage}
								onPageChange={handlePageChange}
								onRowsPerPageChange={handleRowsPerPageChange}
								rowsPerPageOptions={rowsPerPageOptions}
							/>
						</Box>
					</Grid>
				</Grid>
			</Box>
		</>
	);
};

export default Account;
