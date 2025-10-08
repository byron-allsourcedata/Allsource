"use client";

import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
	Box,
	Typography,
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
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import {
	MoreVert,
	SwapVertIcon,
	ArrowDownwardIcon,
	ArrowUpwardIcon,
} from "@/icon";
import { Paginator } from "@/components/PaginationComponent";
import type { UserData } from "../schemas";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

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

const TableBodyDomains: React.FC<{ data: any[] }> = ({ data }) => {
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "--";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<TableBody>
			{data.map((row) => (
				<TableRow key={row.id} hover>
					<TableCell sx={{ fontWeight: 500 }}>{row.domain}</TableCell>
					<TableCell>{row.user_name || "—"}</TableCell>
					<TableCell>
						<Chip
							label={row.is_pixel_installed ? "Installed" : "Missing"}
							color={row.is_pixel_installed ? "success" : "warning"}
							size="small"
						/>
					</TableCell>
					<TableCell>
						<Chip
							label={row.is_enable ? "Active" : "Disabled"}
							color={row.is_enable ? "success" : "default"}
							size="small"
						/>
					</TableCell>
					<TableCell>{row.total_leads}</TableCell>
					<TableCell>{formatDate(row.created_at)}</TableCell>
					<TableCell>
						<IconButton size="small">
							<MoreVert fontSize="small" />
						</IconButton>
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	);
};

export interface DomainData {
	id: number;
	domain: string;
	user_name: string;
	is_pixel_installed: boolean;
	is_enable: boolean;
	total_leads: number;
	created_at: string;
}

interface PixelTabProps {
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
}

const PixelTab: React.FC<PixelTabProps> = ({
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
}) => {
	const [search, setSearch] = useState("");
	const [loadingLocal, setLoadingLocal] = useState(false);
	const tableContainerRef = useRef<HTMLDivElement>(null);

	const tableHeaders = [
		{ key: "domain", label: "Domain", sortable: true },
		{ key: "user_name", label: "User", sortable: false },
		{ key: "is_pixel_installed", label: "Pixel", sortable: false },
		{ key: "is_enable", label: "Status", sortable: false },
		{ key: "total_leads", label: "Leads", sortable: true },
		{ key: "created_at", label: "Created", sortable: true },
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

	if (loadingLocal) return <CustomizedProgressBar />;

	return (
		<Box sx={{ background: "#fff", borderRadius: 2, overflow: "hidden" }}>
			<TableContainer
				ref={tableContainerRef}
				component={Paper}
				sx={{ maxHeight: "70vh" }}
			>
				<Table stickyHeader>
					<TableHeader
						onSort={handleSortRequest}
						sortField={orderBy}
						sortOrder={order}
						tableHeaders={tableHeaders}
					/>

					<TableBodyDomains data={domains} />
				</Table>
			</TableContainer>

			<Box sx={{ borderTop: "1px solid rgba(235,235,235,1)" }}>
				<Paginator
					tableMode
					countRows={totalCount ?? 0}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					rowsPerPageOptions={rowsPerPageOptions}
				/>
			</Box>
		</Box>
	);
};

export default PixelTab;
