import type React from "react";
import { useRef, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Paper,
	Button,
	Tooltip,
	TableContainer,
	Box,
	Popover,
	IconButton,
	Typography,
	DialogActions,
	DialogContent,
	DialogContentText,
	Dialog,
	Theme,
	SxProps,
} from "@mui/material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
	Area,
	AreaChart,
} from "recharts";
import { useSSE } from "@/context/SSEContext";
import { MenuIconButton } from "@/components/table";
import { useRouter } from "next/navigation";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { MoreVert } from "@/icon";
import { AdditionalPixel, PixelKey, PixelManagementItem } from "../page";
import { style } from "./TableManagement";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInstance from "@/axios/axiosInterceptorInstance";

type Resolution = {
	date: string;
	lead_count: number;
};

interface TableContainerProps {
	tableData?: PixelManagementItem[];
	onDelete: (item: PixelManagementItem) => void;
}

const ManagementTable: React.FC<TableContainerProps> = ({
	tableData,
	onDelete,
}) => {
	const router = useRouter();
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [activeRow, setActiveRow] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [rowToDelete, setRowToDelete] = useState<PixelManagementItem | null>(
		null,
	);

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
		row: PixelManagementItem,
	) => {
		setMenuAnchor(null);
		setRowToDelete(row);
		setOpenConfirmDialog(true);
	};

	const handleCloseConfirmDialog = () => {
		setOpenConfirmDialog(false);
		setRowToDelete(null);
	};

	const handleConfirmDelete = () => {
		if (rowToDelete) {
			onDelete(rowToDelete);
		}
		handleCloseConfirmDialog();
		handleCloseMenu();
	};

	const handleDomainClick = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		router.push("/analytics");
	};

	const handleDataSyncClick = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		router.push("/data-sync-pixel");
	};

	const handleAdditionalPixelClick = (domain: string, domain_id: number) => {
		sessionStorage.setItem("current_domain", domain);
		router.push(`/management/add-additional-script?domain_id=${domain_id}`);
	};

	const handleCheckPixelHealthClick = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		router.push("/management/check-pixel-health");
	};

	const handleReinstallPixelClick = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		router.push("/management/reinstall-pixel");
	};

	const handleInstallPixelClick = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		router.push("/management/install-pixel");
	};

	return (
		<>
			<TableContainer
				component={Paper}
				sx={{
					width: "100%",
					boxShadow: "none",
					borderRadius: ".25rem",
					padding: "1rem",
				}}
			>
				{loading && <CustomizedProgressBar />}
				<Table
					sx={{
						borderCollapse: "separate",
						width: "100%",
						display: "table",
					}}
				>
					<TableHead
						sx={{
							"& .MuiTableCell-root": {
								fontFamily: "var(--font-nunito)",
								fontWeight: 600,
								fontSize: ".75rem",
								lineHeight: "1.05rem",
								letterSpacing: "0%",
								border: "none",
								padding: ".5rem",
								color: "#202124",
								borderBottom: "1px solid rgba(228, 228, 228, 1)",
							},
						}}
					>
						<TableRow sx={{ borderBottom: "1px solid rgba(228, 228, 228, 1)" }}>
							<TableCell>
								<Typography className="management-table-header">
									{" "}
									Domain
								</Typography>
							</TableCell>
							<TableCell>
								<Typography className="management-table-header">
									{" "}
									Pixel Status
								</Typography>
							</TableCell>
							<TableCell>
								<Typography className="management-table-header">
									Additional Pixels
								</Typography>
							</TableCell>
							<TableCell>
								<Typography className="management-table-header">
									{" "}
									Resolutions
								</Typography>
							</TableCell>
							<TableCell>
								<Typography className="management-table-header">
									{" "}
									Data syncs
								</Typography>
							</TableCell>
							<TableCell>
								<Typography className="management-table-header">
									{" "}
									Actions
								</Typography>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{tableData?.map((row, index) => {
							const isLastRow = index === tableData.length - 1;
							const rawAdditionalPixel = row.additional_pixel;

							const additional_pixel: AdditionalPixel = {
								is_add_to_cart_installed:
									rawAdditionalPixel?.is_add_to_cart_installed ?? false,
								is_converted_sales_installed:
									rawAdditionalPixel?.is_converted_sales_installed ?? false,
								is_view_product_installed:
									rawAdditionalPixel.is_view_product_installed ?? false,
							};

							const flags: { key: PixelKey; label: string }[] = [
								{
									key: "is_view_product_installed",
									label: "View Product Installed",
								},
								{
									key: "is_add_to_cart_installed",
									label: "Add to Cart Installed",
								},
								{
									key: "is_converted_sales_installed",
									label: "Converted Sales Installed",
								},
							];

							const trueCount = flags.reduce(
								(count, f) => (additional_pixel[f.key] ? count + 1 : count),
								0,
							);

							const total = row.resolutions.reduce(
								(acc, r) => acc + r.lead_count,
								0,
							);

							const formatNumber = (num: number): string => {
								if (num >= 1000)
									return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}к`;
								return num.toString();
							};

							function getResolvedGraphData(
								resolutions: Resolution[],
							): Resolution[] {
								const last = resolutions[resolutions.length - 1];
								const lastDate = last ? new Date(last.date) : new Date();

								const days = 7;
								const fullSeries: Resolution[] = [];

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

							return (
								<TableRow
									key={index}
									sx={{
										height: "48px",
										"& .MuiTableCell-root": {
											padding: "4px 8px",
											verticalAlign: "middle",
											borderBottom: isLastRow
												? "none"
												: "1px solid rgba(228, 228, 228, 1)",
										},
									}}
								>
									<TableCell
										sx={{
											width: "340px",
											maxWidth: "340px",
											overflow: "hidden",
											padding: 0,
										}}
									>
										<Box
											sx={{
												display: "inline-block",
												maxWidth: "100%",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											<Typography
												onClick={() => handleDomainClick(row.domain_name)}
												noWrap
												sx={{
													cursor: "pointer",
													color: "rgba(56, 152, 252, 1)",
													fontFamily: "var(--font-roboto)",
													fontSize: "14px",
													fontWeight: 400,
													lineHeight: "140%",
													maxWidth: "100%",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
													"&:hover": {
														textDecoration: "none",
													},
												}}
											>
												{row.domain_name}
											</Typography>
										</Box>
									</TableCell>

									<TableCell>
										<Typography
											sx={{
												fontFamily: "var(--font-roboto)",
												fontWeight: 400,
												fontSize: "14px",
												lineHeight: "140%",
												letterSpacing: 0,
												color: row.pixel_status
													? "rgba(74, 158, 79, 1)"
													: "rgba(205, 40, 43, 1)",
												display: "flex",
												alignItems: "center",
												gap: "4px",
											}}
										>
											{row.pixel_status ? (
												"✓ Installed"
											) : (
												<Button
													variant="text"
													onClick={() =>
														handleInstallPixelClick(row.domain_name)
													}
													sx={{
														p: 0,
														minWidth: 0,
														textTransform: "none",
														fontSize: "14px",
														fontFamily: "var(--font-roboto)",
														fontWeight: 400,
														color: "rgba(56, 152, 252, 1)",
														textDecoration: "underline",
														display: "inline-flex",
														alignItems: "center",
														"&:hover": {
															textDecoration: "none",
															backgroundColor: "transparent",
														},
													}}
												>
													<DownloadIcon sx={{ fontSize: "18px", mt: 0.25 }} />
													Install Pixel
												</Button>
											)}
										</Typography>
									</TableCell>
									<TableCell>
										<Box
											sx={{
												display: "inline-block",
												maxWidth: "100%",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											<Typography
												onClick={() =>
													handleAdditionalPixelClick(row.domain_name, row.id)
												}
												sx={{
													color: "rgba(56, 152, 252, 1)",
													fontFamily: "var(--font-roboto)",
													fontSize: "14px",
													fontWeight: 400,
													lineHeight: "140%",
													cursor: "pointer",
													textDecoration: "underline",
													"&:hover": {
														textDecoration: "none",
													},
												}}
											>
												{trueCount}/3
											</Typography>
										</Box>
									</TableCell>
									<TableCell>
										{row.pixel_status ? (
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

									<TableCell>
										<Box
											sx={{
												display: "inline-block",
												maxWidth: "100%",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											<Typography
												sx={{
													cursor: "pointer",
													color: "rgba(56, 152, 252, 1)",
													fontFamily: "var(--font-roboto)",
													fontSize: "14px",
													fontWeight: 400,
													lineHeight: "140%",
												}}
												onClick={() => handleDataSyncClick(row.domain_name)}
											>
												{row.data_syncs_count}
											</Typography>
										</Box>
									</TableCell>
									<TableCell
										sx={{ width: 20, height: 20, textAlign: "center" }}
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
												{row.pixel_status ? (
													<Box
														display="flex"
														flexDirection="column"
														alignItems="flex-start"
													>
														<Button
															sx={style.actionButtonText}
															onClick={() =>
																handleCheckPixelHealthClick(row.domain_name)
															}
														>
															Check Health
														</Button>
														<Button
															sx={style.actionButtonText}
															onClick={() =>
																handleReinstallPixelClick(row.domain_name)
															}
														>
															Reinstall Pixel
														</Button>
														<Button
															sx={style.actionButtonText}
															onClick={() =>
																handleAdditionalPixelClick(
																	row.domain_name,
																	row.id,
																)
															}
														>
															Add Additional Pixel Script
														</Button>
														<DeleteButton
															onClick={(e) => handleOpenConfirmDialog(e, row)}
															disabled={row.contacts_resolving}
															sx={style.actionButtonText}
														/>
													</Box>
												) : (
													<Box
														display="flex"
														flexDirection="column"
														alignItems="flex-start"
													>
														<Button
															sx={style.actionButtonText}
															onClick={() =>
																handleInstallPixelClick(row.domain_name)
															}
														>
															Install Pixel
														</Button>
														<DeleteButton
															onClick={(e) => handleOpenConfirmDialog(e, row)}
															disabled={row.contacts_resolving}
															sx={style.actionButtonText}
														/>
													</Box>
												)}
											</Box>
										</Popover>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
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
						<span style={{ fontWeight: "600" }}>
							{rowToDelete?.domain_name}{" "}
						</span>
						?
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
	);
};

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

export default ManagementTable;
