"use client";

import { Box } from "@mui/material";
import { Paginator } from "@/components/PaginationComponent";

interface PaginationProps {
	countRows: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (
		event: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number,
	) => void;
	onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>) => void;
	rowsPerPageOptions?: number[];
}

const TablePagination: React.FC<PaginationProps> = ({
	countRows,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	rowsPerPageOptions,
}) => {
	const paginationProps = {
		countRows,
		page,
		rowsPerPage,
		onPageChange,
		onRowsPerPageChange,
		rowsPerPageOptions,
	};

	return (
		<Box sx={{ borderTop: "1px solid rgba(235,235,235,1)" }}>
			<Paginator tableMode {...paginationProps} />
		</Box>
	);
};

export default TablePagination;
