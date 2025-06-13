import { useState } from "react";

type PaginationProps = {
	countRows: number;
	page: number;
	rowsPerPage: number;
	setPage: (page: number) => void;
	setRowsPerPage: (rowsPerPage: number) => void;
	onPageChange: (
		event: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number,
	) => void;
	onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	rowsPerPageOptions?: number[];
};

export function usePagination(countRows: number): PaginationProps {
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<{ value: string }>,
	) => {
		setRowsPerPage(Number.parseInt(event.target.value, 10));
		setPage(0);
	};

	return {
		countRows,
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		onPageChange: (_, newPage) => {
			setPage(newPage);
		},
		onRowsPerPageChange: handleChangeRowsPerPage,
	};
}
