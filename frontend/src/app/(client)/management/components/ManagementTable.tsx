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
import { MoreVert } from "@/icon";

interface TableData {
	id: number;
	domain_name: string;
	pixel_status: boolean;
	additional_pixel: number;
	resulutions: any;
	data_sync: number;
}

interface TableContainerProps {
	tableData?: TableData[];
}

const ManagementTable: React.FC<TableContainerProps> = ({ tableData }) => {
	const { smartLookaLikeProgress } = useSSE();
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
	const [activeRow, setActiveRow] = useState<number | null>(null);

	const handleOpenMenu = (
		event: React.MouseEvent<HTMLElement>,
		rowId: number,
	) => {
		setMenuAnchor(event.currentTarget);
		setActiveRow(rowId);
	};

	return (
		<TableContainer
			component={Paper}
			sx={{
				width: "100%",
				boxShadow: "none",
				borderRadius: ".25rem",
				border: ".0625rem solid #EBEBEB",
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
						},
					}}
				>
					<TableRow>
						<TableCell>Domain</TableCell>
						<TableCell>Pixel Status</TableCell>
						<TableCell>Additional Pixel</TableCell>
						<TableCell>Resolutions</TableCell>
						<TableCell>Data sync</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{tableData?.map((row, index) => {
						const rawAdditionalPixel = row.additional_pixel;

						const additional_pixel =
							typeof rawAdditionalPixel === "object" &&
							rawAdditionalPixel !== null
								? {
										is_add_to_cart_installed:
											rawAdditionalPixel?.is_add_to_cart_installed || false,
										is_converted_sales_installed:
											rawAdditionalPixel?.is_converted_sales_installed || false,
										is_view_product_installed:
											row?.pixel_status === true ? true : false,
									}
								: {
										is_add_to_cart_installed: false,
										is_converted_sales_installed: false,
										is_view_product_installed:
											row?.pixel_status === true ? true : false,
									};

						const flags = [
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
							<TableRow key={index}>
								<TableCell>{row.domain_name}</TableCell>
								<TableCell>
									{row.pixel_status === true ? "Installed" : "Not Installed"}
								</TableCell>
								<TableCell>
									<Tooltip
										title={
											<pre style={{ whiteSpace: "pre-wrap" }}>
												{tooltipText}
											</pre>
										}
									>
										<span style={{ cursor: "help" }}>{trueCount}/3</span>
									</Tooltip>
								</TableCell>
								<TableCell sx={{ width: 120, height: 40 }}>
									{Array.isArray(row.resulutions) &&
									row.resulutions.length > 0 ? (
										<ResponsiveContainer width="100%" height={40}>
											<LineChart data={row.resulutions}>
												<Line
													type="monotone"
													dataKey="lead_count"
													stroke="#3B82F6" // синий цвет
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
								<TableCell>{/* Actions */}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ManagementTable;
