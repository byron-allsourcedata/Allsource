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
	resulutions: string;
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

	const handleCloseMenu = () => {
		setMenuAnchor(null);
		setActiveRow(null);
	};

	const [lookalikeSize, setLookalikeSize] = useState(0);
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
				<TableBody
					sx={{
						"& .MuiTableCell-root": {
							fontFamily: "Roboto",
							fontWeight: 400,
							fontSize: ".75rem",
							lineHeight: "1.05rem",
							color: "#5F6368",
							border: "none",
							padding: ".5rem",
						},
					}}
				>
					{tableData?.map((row, index) => (
						<TableRow key={index}>
							<TableCell>{row.domain_name}</TableCell>
							<TableCell>
								{row.pixel_status === true ? "Installed" : "Not Installed"}
							</TableCell>
							<TableCell>{row.additional_pixel}</TableCell>
							<TableCell>{row.resulutions}</TableCell>
							<TableCell>{row.data_sync}</TableCell>
							<TableCell className="table-data">
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 2,
									}}
								>
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
								</Box>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default ManagementTable;
