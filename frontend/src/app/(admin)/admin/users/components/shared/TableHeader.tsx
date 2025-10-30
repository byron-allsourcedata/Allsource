"use client";

import {
	Box,
	Typography,
	IconButton,
	TableHead,
	TableCell,
	TableRow,
} from "@mui/material";
import { SwapVertIcon, ArrowDownwardIcon, ArrowUpwardIcon } from "@/icon";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";

export interface TableHeaders {
	key: string;
	label: string;
	sortable: boolean;
}

interface TableHeaderProps {
	onSort: (field: string) => void;
	sortField?: string;
	sortOrder?: string;
	tableHeaders: TableHeaders[];
	stickyColumns?: {
		name?: boolean;
		status?: boolean;
		email?: boolean;
		domain?: boolean;
		company_name?: boolean;
		user_name?: boolean;
	};
}

const TableHeader: React.FC<TableHeaderProps> = ({
	onSort,
	sortField,
	sortOrder,
	tableHeaders,
	stickyColumns = {},
}) => {
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
							...(stickyColumns.name &&
								key === "name" && {
									width: "100px",
									maxWidth: "200px",
									minWidth: "100px",
									position: "sticky",
									left: 0,
									zIndex: 2,
								}),
							...(stickyColumns.status &&
								key === "status" && {
									width: "180px",
									maxWidth: "100px",
									minWidth: "120px",
									left: 0,
									zIndex: 1,
								}),
							...(stickyColumns.email &&
								key === "email" && {
									width: "200px",
									maxWidth: "200px",
									minWidth: "150px",
									zIndex: 1,
								}),
							...(stickyColumns.domain &&
								key === "domain" && {
									width: "200px",
									maxWidth: "250px",
									minWidth: "150px",
									position: "sticky",
									left: 0,
									zIndex: 2,
								}),
							...(stickyColumns.company_name &&
								key === "company_name" && {
									width: "200px",
									maxWidth: "200px",
									minWidth: "150px",
									zIndex: 1,
								}),
							...(stickyColumns.user_name &&
								key === "user_name" && {
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
								key === "email" ||
								key === "status" ||
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

export default TableHeader;
