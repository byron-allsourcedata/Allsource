import type React from "react";
import type { FC } from "react";
import {
	Box,
	Paper,
	Table,
	Typography,
	type SxProps,
	type TableProps,
} from "@mui/material";
import CustomTablePagination from "@/components/CustomTablePagination";
import { borderBottom } from "@mui/system";

interface PaginationComponentProps {
	countRows: number | null;
	page: number;
	rowsPerPage: number;
	onPageChange: (
		event: React.MouseEvent<HTMLButtonElement> | null,
		newPage: number,
	) => void;
	onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	rowsPerPageOptions?: number[];
	radiusTop?: string;
	tableMode?: boolean;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
	countRows,
	page,
	rowsPerPage,
	onPageChange: handleChangePage,
	onRowsPerPageChange: handleChangeRowsPerPage,
	rowsPerPageOptions,
	radiusTop,
	tableMode,
}) => {
	const radius = {
		borderRadius: "4px",
		borderTopLeftRadius: radiusTop,
		borderTopRightRadius: radiusTop,
	};

	const gray = "rgba(235, 235, 235, 1)";
	const grayBorder = `1px solid ${gray}`;
	const bordersSx = {
		borderLeft: grayBorder,
		borderRight: grayBorder,
		borderBottom: grayBorder,
	};

	// return null;

	// return <Box>dd</Box>;

	if (countRows && countRows > 10) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-end",
					padding: "6px 0 0",
					backgroundColor: "#fff",
					...radius,
					...(tableMode && bordersSx),
					"@media (max-width: 600px)": {
						padding: "12px 0 0",
					},
				}}
			>
				<CustomTablePagination
					count={countRows ?? 0}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					rowsPerPageOptions={rowsPerPageOptions}
				/>
			</Box>
		);
	}

	return (
		<Box
			display="flex"
			justifyContent="flex-end"
			alignItems="center"
			sx={{
				padding: "16px",
				backgroundColor: "#fff",
				...radius,
				...(tableMode && bordersSx),
				"@media (max-width: 600px)": {
					padding: "12px",
				},
			}}
		>
			<Typography
				sx={{
					fontFamily: "var(--font-nunito)",
					fontWeight: "400",
					fontSize: "12px",
					lineHeight: "16px",
					marginRight: "16px",
				}}
			>
				{countRows ? `1 - ${countRows} of ${countRows}` : ""}
			</Typography>
		</Box>
	);
};

export default PaginationComponent;

export type PaginatorProps = PaginationComponentProps;

export const Paginator: FC<PaginatorProps> = (props) => {
	return <PaginationComponent {...props} radiusTop="0px" />;
};

export type PaginatorTableProps = {
	paginator: PaginatorProps;
} & TableProps;

export const PaginatorTable: FC<PaginatorTableProps> = ({
	paginator,
	children,
	sx,
	...props
}) => {
	const gray = "rgba(235, 235, 235, 1)";
	const grayBorder = `1px solid ${gray}`;

	return (
		<>
			<Table
				sx={{
					tableLayout: "fixed",
					border: "1px solid rgba(235, 235, 235, 1)",
					borderBottomLeftRadius: "0px",
					borderBottomRightRadius: "0px",
					borderBottom: "0px",
					...sx,
				}}
				{...props}
			>
				{children}
			</Table>
		</>
	);
};
