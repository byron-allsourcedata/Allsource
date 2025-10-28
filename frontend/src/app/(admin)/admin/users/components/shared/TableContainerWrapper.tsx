"use client";

import { Box, Paper, TableContainer } from "@mui/material";
import { useRef } from "react";

interface TableContainerWrapperProps {
	children: React.ReactNode;
}

const TableContainerWrapper: React.FC<TableContainerWrapperProps> = ({
	children,
}) => {
	const tableContainerRef = useRef<HTMLDivElement>(null);

	return (
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
			{children}
		</TableContainer>
	);
};

export default TableContainerWrapper;
