"use client";

import axiosInstance from "@/axios/axiosInterceptorInstance";
import Image from "next/image";
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
	Grid,
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
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import CustomSwitch from "@/components/ui/CustomSwitch";

interface TableHeaders {
	key: string;
	label: string;
	sortable: boolean;
}

export interface DomainData {
	id: number;
	domain: string;
	company_name: string;
	user_name: string;
	is_pixel_installed: boolean;
	is_enable: boolean;
	total_leads: number;
	created_at: string;
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
}> = ({ data, changeUserIsEmailValidation }) => {
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
			{data?.length > 0 ? (
				data.map((row) => (
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
							className="description"
							sx={{
								...leadsStyles.table_array,
								position: "relative",
								textAlign: "left",
								padding: "8px",
								borderBottom: "1px solid rgba(224, 224, 224, 1)",
							}}
						>
							{row.user_name || "--"}
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
									fontSize: "14px",
									lineHeight: "140%",
									letterSpacing: 0,
									color: row.is_enable
										? "rgba(74, 158, 79, 1)"
										: "rgba(205, 40, 43, 1)",
									display: "flex",
									backgroundColor: row.is_enable
										? "rgba(220, 245, 221, 1)"
										: "rgba(255, 235, 238, 1)",
									padding: "4px 8px",
									borderRadius: "4px",
									textAlign: "center",
									justifyContent: "center",
									alignItems: "center",
									gap: "4px",
								}}
							>
								{row.is_enable ? "Resolved" : "Unresolved"}
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
							<IconButton size="small">
								<MoreVert fontSize="small" />
							</IconButton>
						</TableCell>
					</TableRow>
				))
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
		{ key: "domain", label: "Domain", sortable: true },
		{ key: "company_name", label: "Company Name", sortable: false },
		{ key: "user_name", label: "User", sortable: false },
		{ key: "is_pixel_installed", label: "Pixel", sortable: false },
		{ key: "is_enable", label: "Status", sortable: false },
		{ key: "total_leads", label: "Leads", sortable: true },
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
					mt: 2,
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
								maxHeight: "60vh",
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
