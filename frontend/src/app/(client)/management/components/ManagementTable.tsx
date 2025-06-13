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
						const additional_pixel =
							Array.isArray(row.additional_pixel) &&
							row.additional_pixel.length > 0
								? row.additional_pixel[0]
								: {
										is_view_product_installed: false,
										is_add_to_cart_installed: false,
										is_converted_sales_installed: false,
									};

						const flags = [
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
								<TableCell>{/* render resulutions here */}</TableCell>
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
