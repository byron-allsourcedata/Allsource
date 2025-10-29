"use client";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";
import {
	Box,
	Typography,
	Paper,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Grid,
	Popover,
	Button,
	Theme,
	SxProps,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
} from "@mui/material";
import { XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useRef, useState } from "react";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import {
	MoreVert,
	SwapVertIcon,
	ArrowDownwardIcon,
	ArrowUpwardIcon,
} from "@/icon";
import { Paginator } from "@/components/PaginationComponent";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import CustomSwitch from "@/components/ui/CustomSwitch";
import { style } from "@/app/(client)/management/components/TableManagement";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useRouter } from "next/navigation";
import { pad } from "lodash";

export interface PixelManagementItem {
	id: number;
	domain_name: string;
	pixel_status: boolean;
	contacts_resolving: boolean;
	data_syncs_count: number;
}

interface DeleteButtonProps {
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
	sx?: SxProps<Theme>;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
	onClick,
	disabled = false,
	sx,
}) => {
	if (disabled) return null;

	return (
		<Button sx={sx} onClick={onClick}>
			Delete
		</Button>
	);
};

interface TableHeaders {
	key: string;
	label: string;
	sortable: boolean;
}

interface ResolutionItem {
	date: string;
	lead_count: number;
}

export interface DomainData {
	id: number;
	domain: string;
	company_name: string;
	user_name: string;
	is_pixel_installed: boolean;
	is_enable: boolean;
	status: "Leads" | "No Leads" | "Synced";
	resolutions: ResolutionItem[];
	total_leads: number;
	created_at: string;
	data_syncs_count: number;
	is_email_validation_enabled: boolean;
}

const TableHeader: React.FC<{
	onSort: (field: string) => void;
	sortField?: string;
	sortOrder?: string;
	tableHeaders: TableHeaders[];
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
							...(key === "domain" && {
								width: "200px",
								maxWidth: "250px",
								minWidth: "150px",
								position: "sticky",
								left: 0,
								zIndex: 2,
							}),
							...(key === "company_name" && {
								width: "200px",
								maxWidth: "200px",
								minWidth: "150px",
								zIndex: 1,
							}),
							...(key === "user_name" && {
								width: "150px",
								maxWidth: "150px",
								minWidth: "120px",
								zIndex: 1,
							}),
						}}
						onClick={sortable ? () => onSort(key) : undefined}
					>
						<Box
							sx={{ display: "flex", alignItems: "center" }}
							style={
								key === "domain" ||
								key === "company_name" ||
								key === "user_name"
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

const TableBodyDomains: React.FC<{
	data: DomainData[];
	changeUserIsEmailValidation: (userId: number) => void;
	refresh: () => void;
}> = ({ data, changeUserIsEmailValidation, refresh }) => {
	const router = useRouter();
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [activeRow, setActiveRow] = useState<number | null>(null);
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [rowToDelete, setRowToDelete] = useState<DomainData | null>(null);
	const [loading, setLoading] = useState(false);
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "--";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const handleOpenMenu = (
		event: React.MouseEvent<HTMLElement>,
		rowId: number,
	) => {
		setMenuAnchor(event.currentTarget);
		setActiveRow(rowId);
	};

	const handleCloseMenu = () => {
		setMenuAnchor(null);
		setActiveRow(null);
	};

	const handleOpenConfirmDialog = (
		event: React.MouseEvent<HTMLElement>,
		row: DomainData,
	) => {
		setMenuAnchor(null);
		setRowToDelete(row);
		setOpenConfirmDialog(true);
	};

	const handleCloseConfirmDialog = () => {
		setOpenConfirmDialog(false);
		setRowToDelete(null);
	};

	const handleCheckPixelHealthClick = (domain: string) => {
		let url = domain.trim();

		if (url) {
			if (!/^https?:\/\//i.test(url)) {
				url = "http://" + url;
			}

			const hasQuery = url.includes("?");
			const newUrl =
				url +
				(hasQuery ? "&" : "?") +
				"mff=true" +
				`&api=${process.env.NEXT_PUBLIC_API_DOMAIN}` +
				`&domain_url=${process.env.NEXT_PUBLIC_BASE_URL}/leads`;
			window.open(newUrl, "_blank");
		}
	};

	const handleDelete = async (toDelete: DomainData) => {
		if (toDelete.status === "Leads" || toDelete.status === "Synced") {
			showErrorToast(
				"Domain cannot be deleted because it has associated leads",
			);
			return;
		}
		try {
			setLoading(true);

			await axiosInstance.delete(`admin/domains/${toDelete.id}`, {
				data: { domain: toDelete.domain },
			});
			showToast("Successfully removed domain");

			refresh();
		} catch (error) {
			showErrorToast("Failed to delete domain. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmDelete = () => {
		if (rowToDelete) {
			handleDelete(rowToDelete);
		}
		handleCloseConfirmDialog();
		handleCloseMenu();
	};

	function getResolvedGraphData(
		resolutions: ResolutionItem[],
	): ResolutionItem[] {
		const last = resolutions[resolutions.length - 1];
		const lastDate = last ? new Date(last.date) : new Date();

		const days = 7;
		const fullSeries: ResolutionItem[] = [];

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(lastDate);
			date.setDate(date.getDate() - i);
			const isoDate = date.toISOString().split("T")[0];

			const match = resolutions.find((r) => r.date === isoDate);
			fullSeries.push({
				date: isoDate,
				lead_count: match?.lead_count ?? 0,
			});
		}

		return fullSeries;
	}

	const formatNumber = (num: number): string => {
		if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}к`;
		return num.toString();
	};

	return (
		<TableBody>
			{data?.length > 0 ? (
				data.map((row) => {
					const total = row.resolutions.reduce(
						(acc, r) => acc + r.lead_count,
						0,
					);
					return (
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
							<TableCell
								className="description"
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "left",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								{row.company_name || "--"}
							</TableCell>

							<TableCell
								className="seventh-sub-title"
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "left",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								{row.domain}
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "left",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								<Typography
									sx={{
										fontFamily: "var(--font-roboto)",
										fontWeight: 400,
										fontSize: "14px",
										lineHeight: "140%",
										letterSpacing: 0,
										color: row.is_pixel_installed
											? "rgba(74, 158, 79, 1)"
											: "rgba(205, 40, 43, 1)",
										display: "flex",
										alignItems: "center",
										gap: "4px",
									}}
								>
									{row.is_pixel_installed ? "✓ Installed" : "✗ Missing"}
								</Typography>
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								<Typography
									sx={{
										fontFamily: "var(--font-roboto)",
										fontWeight: 400,
										fontSize: "12px",
										lineHeight: "140%",
										letterSpacing: 0,
										color:
											row.status === "Synced"
												? "rgba(74,158,79,1)"
												: row.status === "Leads"
													? "rgba(158,132,58,1)"
													: "rgba(205,40,43,1)",
										display: "flex",
										backgroundColor:
											row.status === "Synced"
												? "rgba(220,245,221,1)"
												: row.status === "Leads"
													? "rgba(255,249,196,1)"
													: "rgba(255,235,238,1)",
										padding: "4px 8px",
										borderRadius: "4px",
										textAlign: "center",
										justifyContent: "center",
										alignItems: "center",
										gap: "4px",
									}}
								>
									{row.status}
								</Typography>
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "center",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								{row.total_leads}
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "center",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								{row.is_pixel_installed ? (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											maxWidth: "120px",
										}}
									>
										<ResponsiveContainer width={80} height={30}>
											<AreaChart
												data={getResolvedGraphData(row.resolutions)}
												margin={{ top: 0, right: 0, bottom: 1, left: 0 }}
											>
												<defs>
													<linearGradient
														id="colorGradient"
														x1="0"
														y1="0"
														x2="0"
														y2="1"
													>
														<stop
															offset="0%"
															stopColor="#3898FC"
															stopOpacity={1}
														/>
														<stop
															offset="98.31%"
															stopColor="rgba(224, 236, 255, 1)"
															stopOpacity={0.1}
														/>
													</linearGradient>
												</defs>
												<Area
													type="monotone"
													dataKey="lead_count"
													stroke="rgba(56, 152, 252, 1)"
													strokeWidth={2}
													fill="url(#colorGradient)"
												/>
												<XAxis dataKey="date" hide />
												<YAxis hide domain={[0, 2]} />
											</AreaChart>
										</ResponsiveContainer>
										<Box ml={0.75}>
											<Typography
												sx={{
													fontFamily: "var(--font-roboto)",
													fontWeight: "400",
													fontSize: "14px",
													lineHeight: "140%",
													letterSpacing: "0%",
													color: "rgba(32, 33, 36, 0.7)",
												}}
											>
												{formatNumber(total)}
											</Typography>
										</Box>
									</Box>
								) : (
									<Box
										sx={{
											display: "flex",
										}}
									>
										<Typography
											sx={{
												fontFamily: "var(--font-roboto)",
												fontWeight: "400",
												fontSize: "14px",
												letterSpacing: "0%",
												color: "rgba(32, 33, 36, 0.7)",
											}}
										>
											Pending Pixel
										</Typography>
									</Box>
								)}
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "center",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								{row.data_syncs_count}
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "left",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								{formatDate(row.created_at)}
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "left",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								<Box
									sx={{
										display: "flex",
										justifyContent: "center",
										width: "100%",
									}}
								>
									<CustomSwitch
										stateSwitch={row.is_email_validation_enabled}
										changeState={() => changeUserIsEmailValidation(row.id)}
									/>
								</Box>
							</TableCell>

							<TableCell
								sx={{
									...leadsStyles.table_array,
									position: "relative",
									textAlign: "center",
									padding: "8px",
									borderBottom: "1px solid rgba(224, 224, 224, 1)",
								}}
							>
								<IconButton
									onClick={(e) => handleOpenMenu(e, row.id)}
									size="small"
								>
									<MoreVert
										fontSize="small"
										sx={{ color: "rgba(32, 33, 36, 1)" }}
									/>
								</IconButton>

								<Popover
									open={Boolean(menuAnchor) && activeRow === row.id}
									anchorEl={menuAnchor}
									onClose={() => setMenuAnchor(null)}
									anchorOrigin={{
										vertical: "bottom",
										horizontal: "left",
									}}
									transformOrigin={{
										vertical: "top",
										horizontal: "right",
									}}
									PaperProps={{
										sx: {
											boxShadow: 2,
											borderRadius: 1,
											maxWidth: 240,
											width: "auto",
										},
									}}
								>
									<Box display="flex" flexDirection="column" p={1}>
										{row.is_pixel_installed === true ? (
											<Box
												display="flex"
												flexDirection="column"
												alignItems="flex-start"
											>
												<Button
													sx={style.actionButtonText}
													onClick={() =>
														handleCheckPixelHealthClick(row.domain)
													}
												>
													Check Health
												</Button>
												<DeleteButton
													onClick={(e) => handleOpenConfirmDialog(e, row)}
													disabled={
														row.status === "Leads" || row.status === "Synced"
													}
													sx={style.actionButtonText}
												/>
											</Box>
										) : (
											<Box
												display="flex"
												flexDirection="column"
												alignItems="flex-start"
											>
												<DeleteButton
													onClick={(e) => handleOpenConfirmDialog(e, row)}
													disabled={
														row.status === "Leads" || row.status === "Synced"
													}
													sx={style.actionButtonText}
												/>
											</Box>
										)}
									</Box>
								</Popover>
							</TableCell>
						</TableRow>
					);
				})
			) : (
				<TableRow>
					<TableCell
						colSpan={9}
						sx={{
							position: "relative",
							height: 400,
							borderBottom: "none",
						}}
					>
						<Box
							sx={{
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%, -50%)",
								textAlign: "center",
								width: "100%",
								pointerEvents: "none", // не блокирует скролл
							}}
						>
							<Typography
								variant="h5"
								sx={{
									mb: 2,
									fontFamily: "var(--font-nunito)",
									fontSize: "20px",
									color: "#4a4a4a",
									fontWeight: 600,
									lineHeight: "28px",
								}}
							>
								Data not matched yet!
							</Typography>
							<Image
								src="/no-data.svg"
								alt="No Data"
								height={250}
								width={340}
							/>
							<Typography
								variant="body1"
								color="textSecondary"
								sx={{
									mt: 2,
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									color: "#808080",
									fontWeight: 600,
									lineHeight: "20px",
								}}
							>
								No data found for the current search query or applied filters.
							</Typography>
						</Box>
					</TableCell>
				</TableRow>
			)}
			<>
				<Dialog
					open={openConfirmDialog}
					onClose={handleCloseConfirmDialog}
					PaperProps={{
						sx: {
							padding: 2,

							width: "fit-content",
							borderRadius: 2,
							border: "1px solid rgba(175, 175, 175, 1)",
						},
					}}
				>
					<Typography
						className="first-sub-title"
						sx={{ paddingLeft: 1, pt: 1, pb: 0 }}
					>
						Confirm Deletion
					</Typography>
					<DialogContent sx={{ padding: 2, pr: 1, pl: 1 }}>
						<DialogContentText className="table-data">
							Are you sure you want to delete this domain -{" "}
							<span style={{ fontWeight: "600" }}>{rowToDelete?.domain} </span>?
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button
							className="second-sub-title"
							onClick={handleCloseConfirmDialog}
							sx={{
								backgroundColor: "#fff",
								color: "rgba(56, 152, 252, 1) !important",
								fontSize: "14px",
								textTransform: "none",
								padding: "0.75em 1em",
								border: "1px solid rgba(56, 152, 252, 1)",
								maxWidth: "50px",
								maxHeight: "30px",
								"&:hover": {
									backgroundColor: "#fff",
									boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
								},
							}}
						>
							Cancel
						</Button>
						<Button
							className="second-sub-title"
							onClick={handleConfirmDelete}
							sx={{
								backgroundColor: "rgba(56, 152, 252, 1)",
								color: "#fff !important",
								fontSize: "14px",
								textTransform: "none",
								padding: "0.75em 1em",
								border: "1px solid rgba(56, 152, 252, 1)",
								maxWidth: "60px",
								maxHeight: "30px",
								"&:hover": {
									backgroundColor: "rgba(56, 152, 252, 1)",
									boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
								},
							}}
						>
							Delete
						</Button>
					</DialogActions>
				</Dialog>
			</>
		</TableBody>
	);
};

interface PixelsTabProps {
	rowsPerPageOptions?: number[];
	totalCount: number;
	setTotalCount?: (n: number) => void;
	setPage: any;
	page: number;
	setLoading?: any;
	rowsPerPage: number;
	order?: "asc" | "desc" | "unset";
	orderBy?: string;
	setRowsPerPage?: any;
	setOrder?: any;
	setOrderBy?: any;
	domains: DomainData[];
	changeUserIsEmailValidation: (userId: number) => void;
	refresh: () => void;
}

const PixelsTab: React.FC<PixelsTabProps> = ({
	rowsPerPageOptions,
	totalCount,
	setTotalCount,
	setPage,
	page,
	setRowsPerPage,
	rowsPerPage,
	order,
	orderBy,
	setLoading,
	setOrder,
	setOrderBy,
	domains,
	changeUserIsEmailValidation,
	refresh,
}) => {
	const [search, setSearch] = useState("");
	const [loadingLocal, setLoadingLocal] = useState(false);
	const tableContainerRef = useRef<HTMLDivElement>(null);

	const handleRowsPerPageChange = (
		event: React.ChangeEvent<{ value: unknown }>,
	) => {
		setRowsPerPage(Number.parseInt(event.target.value as string, 10));
		setPage(0);
	};

	const handlePageChange = (
		event: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number,
	) => {
		setPage(newPage);
	};

	const paginationProps = {
		countRows: totalCount ?? 0,
		page,
		rowsPerPage,
		onPageChange: handlePageChange,
		onRowsPerPageChange: handleRowsPerPageChange,
		rowsPerPageOptions,
	};

	const tableHeaders = [
		{ key: "company_name", label: "Account name", sortable: true },
		{ key: "domain", label: "Domain", sortable: true },
		{ key: "is_pixel_installed", label: "Pixel", sortable: false },
		{ key: "contacts_resolving", label: "Status", sortable: false },
		{ key: "total_leads", label: "Leads", sortable: true },
		{ key: "resolutions", label: "Resolutions", sortable: false },
		{ key: "data_syncs_count", label: "Data Syncs", sortable: true },
		{ key: "created_at", label: "Created", sortable: true },
		{
			key: "is_email_validation_enabled",
			label: "Email Validation",
			sortable: false,
		},
		{ key: "actions", label: "Actions", sortable: false },
	];

	const handleSortRequest = (property: string) => {
		const isDesc = orderBy === property && order === "desc";
		setOrder(isDesc ? "asc" : "desc");
		setOrderBy(property);
	};

	if (loadingLocal) return <CustomizedProgressBar />;

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
							ref={tableContainerRef}
							component={Paper}
							sx={{
								border: "1px solid rgba(235, 235, 235, 1)",
								borderBottom: "none",
								overflowX: "auto",
								maxHeight: "56vh",
							}}
						>
							<Table stickyHeader>
								<TableHeader
									onSort={handleSortRequest}
									sortField={orderBy}
									sortOrder={order}
									tableHeaders={tableHeaders}
								/>

								<TableBodyDomains
									data={domains}
									changeUserIsEmailValidation={changeUserIsEmailValidation}
									refresh={refresh}
								/>
							</Table>
						</TableContainer>
						{paginationProps.countRows > 0 && (
							<Box sx={{ borderTop: "1px solid rgba(235,235,235,1)" }}>
								<Paginator tableMode {...paginationProps} />
							</Box>
						)}
					</Grid>
				</Grid>
			</Box>
		</>
	);
};

export default PixelsTab;
