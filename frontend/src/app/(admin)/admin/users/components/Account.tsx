"use client";

import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
	Box,
	Typography,
	Grid,
	Chip,
	Paper,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { useRef, useState } from "react";
import { suppressionsStyles } from "@/css/suppressions";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import Image from "next/image";
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
import { Paginator } from "@/components/PaginationComponent";
import CustomSwitch from "@/components/ui/CustomSwitch";
import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";
import type { UserData } from "../schemas";
import { ActionsMenu } from "../accounts/ActionsMenu";
import {
	useDisableWhitelabel,
	useEnableWhitelabel,
} from "../accounts/requests";
import { formatMoney } from "@/components/PartnersAccounts";

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
	changeUserIsEmailValidation: (userId: number) => void;
	onPlanChanged: () => void;
	isPartnerTab: boolean;
	isMaster: boolean;
}

const TableHeader: React.FC<{
	onSort: (field: string) => void;
	sortField?: string;
	sortOrder?: string;
	tableHeaders: tableHeaders[];
}> = ({ onSort, sortField, sortOrder, tableHeaders }) => {
	return (
		<TableHead>
			<TableRow
				sx={{
					position: "sticky",
					top: 0,
					zIndex: 97,
				}}
			>
				{tableHeaders.map(({ key, label, sortable }) => (
					<TableCell
						key={key}
						sx={{
							...datasyncStyle.table_column,
							backgroundColor: "#fff",
							textWrap: "wrap",
							textAlign: "center",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							...(key === "name" && {
								width: "100px",
								maxWidth: "200px",
								minWidth: "100px",
								position: "sticky",
								left: 0,
								zIndex: 2,
							}),
							...(key === "status" && {
								width: "180px",
								maxWidth: "100px",
								minWidth: "120px",
								left: 0,
								zIndex: 1,
							}),
							...(key === "email" && {
								width: "200px",
								maxWidth: "200px",
								minWidth: "150px",
								zIndex: 1,
							}),
							// ...(key === "actions" && {
							// 	width: "100px",
							// 	maxWidth: "100px",
							// 	minWidth: "60px",
							// 	"::after": {
							// 		content: "none",
							// 	},
							// }),
						}}
						onClick={sortable ? () => onSort(key) : undefined}
					>
						<Box
							sx={{ display: "flex", alignItems: "center" }}
							style={
								key === "email" || key === "status"
									? { justifyContent: "left" }
									: {}
							}
						>
							<Typography variant="body2" className="table-heading">
								{label}
							</Typography>
							{sortable && (
								<IconButton size="small">
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
	changeUserIsEmailValidation,
	onPlanChanged,
	isPartnerTab,
	isMaster,
}) => {
	const router = useRouter();
	const { setBackButton, triggerBackButton } = useUser();

	const meItem =
		typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
	const meData = meItem ? JSON.parse(meItem) : { full_name: "", email: "" };

	const [enableWhitelabel, enableWhitelabelLoading] = useEnableWhitelabel();
	const [disableWhitelabel, disableWhitelabelLoading] = useDisableWhitelabel();

	const whitelabelActionsLoading =
		enableWhitelabelLoading || disableWhitelabelLoading;

	const whitelabel = useWhitelabel();

	const handleLogin = async (user_account_id: number) => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/admin/generate-token", {
				params: { user_account_id },
			});

			if (response.status === 200) {
				const current_token = localStorage.getItem("token");
				const current_domain = sessionStorage.getItem("current_domain");

				if (current_token) {
					const stack = JSON.parse(
						localStorage.getItem("impersonationStack") || "[]",
					);
					stack.push({
						type: "admin",
						token: current_token,
						domain: current_domain || undefined,
					});
					localStorage.setItem("impersonationStack", JSON.stringify(stack));
				}

				localStorage.setItem("token", response.data.token);
				sessionStorage.removeItem("current_domain");
				sessionStorage.removeItem("me");

				await fetchUserData();

				router.push("/dashboard");
				router.refresh();

				setBackButton(true);
				triggerBackButton();
				whitelabel.refetch();
			}
		} catch (error) {
			console.error("Admin login error:", error);
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
			case "NEED_CONFIRM_EMAIL":
				return {
					background: "rgba(253, 221, 218, 1)",
				};

			case "PIXEL_NOT_INSTALLED":
				return {
					background: "rgba(253, 221, 218, 1)",
				};

			case "WAITING_CONTACTS":
				return {
					background: "rgba(254, 243, 205, 1)",
				};

			case "RESOLUTION_FAILED":
				return {
					background: "rgba(253, 221, 218, 1)",
				};

			case "SYNC_NOT_COMPLETED":
				return {
					background: "rgba(254, 243, 205, 1)",
				};

			case "SYNC_ERROR":
				return {
					background: "rgba(253, 221, 218, 1)",
				};

			case "DATA_SYNCING":
				return {
					background: "rgba(221, 248, 234, 1)",
				};

			default:
				return {
					background: "transparent",
					color: "inherit",
				};
		}
	};

	const formatFunnelText = (text: string) => {
		if (text === "NEED_CONFIRM_EMAIL") {
			return "Need confirm email";
		}
		if (text === "PIXEL_NOT_INSTALLED") {
			return "Pixel Not Installed";
		}
		if (text === "WAITING_CONTACTS") {
			return "Waiting Contacts";
		}
		if (text === "RESOLUTION_FAILED") {
			return "Resolution Failed";
		}
		if (text === "SYNC_NOT_COMPLETED") {
			return "Sync Not Completed";
		}
		if (text === "SYNC_ERROR") {
			return "Sync Error";
		}
		if (text === "DATA_SYNCING") {
			return "Data Syncing";
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
							zIndex: 20,
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
											flexShrink: 1,
											minWidth: 0,
											overflow: "hidden",
											pr: "10px",
										}}
									>
										{row.full_name.replace("#test", "").trim()}
									</Box>

									{row.full_name.includes("#test") && (
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
			case "contacts_count":
				return row.contacts_count || "0";
			case "cost_leads_overage":
				return row.cost_leads_overage
					? `${formatMoney(row.cost_leads_overage)}`
					: "N/A";
			case "has_credit_card":
				return row.has_credit_card ? "Yes" : "No";
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
							fontFamily: "var(--font-roboto)",
							fontSize: "12px",
							fontWeight: "400",
							lineHeight: "normal",
							backgroundColor: row.is_another_domain_resolved
								? "rgba(253, 221, 218, 1)"
								: getStatusStyle(row.status ?? "").background,
							color: "#4A4A4A",
							justifyContent: "center",
							minWidth: "130px",
							textTransform: "capitalize",
						}}
					>
						{row.is_another_domain_resolved
							? "Multiple Domain"
							: formatFunnelText(row.status ?? "") || "--"}
					</Typography>
				);
			case "subscription_plan":
				return (
					<Box
						sx={{ display: "flex", justifyContent: "center", width: "100%" }}
					>
						{row.subscription_plan || "--"}
					</Box>
				);
			case "is_email_validation_enabled":
				return (
					<Box
						sx={{ display: "flex", justifyContent: "center", width: "100%" }}
					>
						<CustomSwitch
							stateSwitch={row.is_email_validation_enabled}
							changeState={() => changeUserIsEmailValidation(row.id)}
						/>
					</Box>
				);

			case "actions":
				return (
					<Box
						sx={{ display: "flex", justifyContent: "center", width: "100%" }}
					>
						<MenuIconButton
							buttonProps={{
								onClick: (event) => handleOpenMenu(event, row.id),
							}}
							iconProps={{ icon: <MoreVert /> }}
						/>

						<ActionsMenu
							anchorEl={activeRow === row.id ? menuAnchor : null}
							handleClose={handleCloseMenu}
							userId={row.id}
							currentPlanAlias={row.subscription_plan ?? ""}
							user={{
								name: row.full_name,
								email: row.email,
								joinDate: row.created_at,
							}}
							onPlanChanged={onPlanChanged}
							isPartnerTab={isPartnerTab || row.is_partner}
							isMaster={isMaster || row.is_master}
							actionsLoading={whitelabelActionsLoading}
							whitelabelEnabled={row.whitelabel_settings_enabled}
							enableWhitelabel={() =>
								enableWhitelabel(row.id).then(onPlanChanged)
							}
							disableWhitelabel={() =>
								disableWhitelabel(row.id).then(onPlanChanged)
							}
						/>
					</Box>
				);
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
						"&:last-of-type .MuiTableCell-root": {
							borderBottom: "none",
						},
					}}
				>
					{tableHeaders.map(({ key }) => (
						<TableCell
							key={key}
							sx={{
								...leadsStyles.table_array,
								textAlign: "left",
								position: "relative",
								padding: "8px",
								"&:last-of-type::after": {
									display:
										key === "subscription_plan" || key === "access_level"
											? "none"
											: "block",
								},
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
	changeUserIsEmailValidation: (userId: number) => void;
	onPlanChanged: () => void;
	isPartnerTab: boolean;
	isMaster: boolean;
}

type AccountData = UserData;

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
	changeUserIsEmailValidation,
	onPlanChanged,
	isPartnerTab,
	isMaster,
}) => {
	const tableHeaders = is_admin
		? [
				{ key: "name", label: "Account name", sortable: false },
				{ key: "email", label: "Email", sortable: false },
				{ key: "join_date", label: "Join date", sortable: true },
				{ key: "last_login_date", label: "Last Login", sortable: true },
				{ key: "invited_by", label: "Invited by", sortable: false },
				{ key: "access_level", label: "Access level", sortable: false },
				// { key: "actions", label: "Actions", sortable: false },
			]
		: [
				{ key: "name", label: "Account name", sortable: false },
				{ key: "email", label: "Email", sortable: false },
				{ key: "join_date", label: "Join date", sortable: true },
				{ key: "last_login_date", label: "Last Login", sortable: true },
				{ key: "has_credit_card", label: "Has CC", sortable: true },
				{ key: "pixel_installed_count", label: "Pixel", sortable: false },
				{ key: "contacts_count", label: "Contacts", sortable: true },
				{ key: "sources_count", label: "Sources", sortable: false },
				{ key: "lookalikes_count", label: "Lookalikes", sortable: false },
				{ key: "credits_count", label: "Credits", sortable: false },
				{ key: "cost_leads_overage", label: "Revenue", sortable: true },

				{ key: "status", label: "Status", sortable: false },
				{
					key: "subscription_plan",
					label: "Plan",
					sortable: false,
				},
				{
					key: "is_email_validation_enabled",
					label: "Email Validation",
					sortable: false,
				},
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
		const isDesc = orderBy === property && order === "desc";
		setOrder(isDesc ? "asc" : "desc");
		setOrderBy(property);
	};

	const tableContainerRef = useRef<HTMLDivElement>(null);
	const paginationProps = {
		countRows: totalCount ?? 0,
		page,
		rowsPerPage,
		onPageChange: handlePageChange,
		onRowsPerPageChange: handleRowsPerPageChange,
		rowsPerPageOptions,
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
				}}
			>
				<Grid
					container
					direction="column"
					justifyContent="flex-start"
					sx={{ width: "100%" }}
				>
					<Grid item xs={12} sx={{ mt: 0, width: "100%" }}>
						<TableContainer
							component={Paper}
							ref={tableContainerRef}
							sx={{
								border: "1px solid rgba(235, 235, 235, 1)",
								borderBottom: "none",
								overflowX: "auto",
								maxHeight: "50vh",
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
									changeUserIsEmailValidation={changeUserIsEmailValidation}
									onPlanChanged={onPlanChanged}
									isPartnerTab={isPartnerTab}
									isMaster={isMaster}
								/>
							</Table>
						</TableContainer>
						<Box sx={{ borderTop: "1px solid rgba(235,235,235,1)" }}>
							<Paginator tableMode {...paginationProps} />
						</Box>
					</Grid>
				</Grid>
			</Box>
		</>
	);
};

export default Account;
