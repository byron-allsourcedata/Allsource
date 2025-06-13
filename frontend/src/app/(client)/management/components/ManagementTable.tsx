import type React from "react";
import { useState } from "react";
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
} from "@mui/material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
} from "recharts";
import { useSSE } from "@/context/SSEContext";
import { MenuIconButton } from "@/components/table";
import { useRouter } from "next/navigation";
import { MoreVert } from "@/icon";
import { AdditionalPixel, PixelKey, PixelManagementItem } from "../page";
import { style } from "./TableManagement";

interface TableContainerProps {
	tableData?: PixelManagementItem[];
}

const ManagementTable: React.FC<TableContainerProps> = ({ tableData }) => {
	const router = useRouter();
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [activeRow, setActiveRow] = useState<number | null>(null);

	const handleOpenMenu = (
		event: React.MouseEvent<HTMLElement>,
		rowId: number,
	) => {
		setMenuAnchor(event.currentTarget);
		setActiveRow(rowId);
	};

	const handleDomainClick = (domain: string) => {
		sessionStorage.setItem("current_domain", domain);
		router.push("/analytics");
	};

	return (
		<TableContainer
			component={Paper}
			sx={{
				width: "100%",
				boxShadow: "none",
				borderRadius: ".25rem",
				padding: "1rem",
				overflowX: "auto",
			}}
		>
			<Table
				sx={{
					borderCollapse: "separate",
					width: "100%",
					display: "table",
					"@media (max-width: 37.5rem)": {
						display: "none",
					},
				}}
			>
				<TableHead
					sx={{
						"& .MuiTableCell-root": {
							fontFamily: "Nunito Sans",
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
								Additional Pixel
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
								Data sync
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
						const rawAdditionalPixel = row.additional_pixel;

						const additional_pixel: AdditionalPixel = {
							is_add_to_cart_installed:
								rawAdditionalPixel?.is_add_to_cart_installed ?? false,
							is_converted_sales_installed:
								rawAdditionalPixel?.is_converted_sales_installed ?? false,
							is_view_product_installed: row.pixel_status === true,
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

						const tooltipText = flags
							.map(
								(f) =>
									`${f.label}: ${additional_pixel[f.key] ? "true" : "false"}`,
							)
							.join("\n");

						return (
							<TableRow
								key={index}
								sx={{
									height: "48px",
									"& .MuiTableCell-root": {
										padding: "6px 12px", // уменьшить внутренние отступы
										verticalAlign: "middle",
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
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
											pointerEvents: "auto",
											width: "100%",
										}}
									>
										<Typography
											onClick={() => handleDomainClick(row.domain_name)}
											noWrap
											sx={{
												cursor: "pointer",
												color: "rgba(56, 152, 252, 1)",
												fontFamily: "Roboto",
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
											fontFamily: "Roboto",
											fontWeight: 400,
											fontSize: "14px",
											lineHeight: "140%",
											letterSpacing: 0,
											color: row.pixel_status
												? "rgba(74, 158, 79, 1)" // зелёный
												: "rgba(205, 40, 43, 1)", // красный
											display: "flex",
											alignItems: "center",
											gap: "4px",
										}}
									>
										{row.pixel_status ? "✓ Installed" : "✗ Not Installed"}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography
										sx={{
											color: "rgba(56, 152, 252, 1)",
											fontFamily: "Roboto",
											fontSize: "14px",
											fontWeight: 400,
											lineHeight: "140%",
											textDecoration: "underline",
											"&:hover": {
												textDecoration: "none",
											},
										}}
									>
										{trueCount}/3
									</Typography>
								</TableCell>
								<TableCell sx={{ width: 120, height: 40 }}>
									{Array.isArray(row.resulutions) &&
									row.resulutions.length > 0 ? (
										<ResponsiveContainer width="100%" height={40}>
											<LineChart data={row.resulutions}>
												<Line
													type="monotone"
													dataKey="lead_count"
													stroke="#3B82F6"
													strokeWidth={2}
													dot={false}
												/>
												<XAxis dataKey="date" hide />
												<YAxis hide />
												<RechartsTooltip
													contentStyle={{ fontSize: "0.75rem" }}
													formatter={(value: any) => [`Leads: ${value}`]}
												/>
											</LineChart>
										</ResponsiveContainer>
									) : (
										"--"
									)}
								</TableCell>

								<TableCell>{/* render data_sync here */}</TableCell>
								<TableCell sx={{ width: 20, height: 20 }}>
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
												width: "auto", // адаптивно под содержимое
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
													<Button sx={style.actionButtonText}>
														Check Health
													</Button>
													<Button sx={style.actionButtonText}>
														Reinstall Pixel
													</Button>
													<Button sx={style.actionButtonText}>
														Add Additional Pixel Script
													</Button>
													<Button sx={style.actionButtonText}>Delete</Button>
												</Box>
											) : (
												<Box
													display="flex"
													flexDirection="column"
													alignItems="flex-start"
												>
													<Button sx={style.actionButtonText}>
														Install Pixel
													</Button>
													<Button sx={style.actionButtonText}>Delete</Button>
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
	);
};

export default ManagementTable;
