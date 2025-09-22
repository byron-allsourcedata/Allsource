import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@mui/material";
import type { FC, ReactNode } from "react";
import type React from "react";

export type TableColumn<T = unknown> = {
	name: string;
	head: React.ReactNode;
	cells: React.ReactNode[] | string[];
	data?: T[];
	mapper?: (data: T) => React.ReactNode | string;
};

function buildRows(columns: TableColumn[]): ReactNode[] {
	const objects: Record<string, ReactNode>[] = [];

	const keys = columns.map((column) => column.name);

	const firstColumn = columns[0];

	const wrapString = (value: string | number) => <TableCell>{value}</TableCell>;

	for (let i = 0; i < firstColumn.cells.length; i++) {
		const object: Record<string, ReactNode> = {};

		for (let j = 0; j < columns.length; j++) {
			const key = keys[j];
			const reactNode = columns[j].cells[i];
			if (typeof reactNode === "string" || typeof reactNode === "number") {
				object[key] = wrapString(reactNode);
			} else {
				object[key] = reactNode;
			}
		}
		objects.push(object);
	}

	return objects.map((record, i) => (
		<TableRow key={i}>{Object.values(record)}</TableRow>
	));
}

type Props = {
	columns: TableColumn[];
};

export const SmartTable: FC<Props> = ({ columns }) => {
	const headers = columns.map((column, index) => {
		if (typeof column.head === "string" || typeof column.head === "number") {
			return <TableCell key={index}>{column.head}</TableCell>;
		}
		return column.head;
	});

	const rows = buildRows(columns);

	return (
		<Table>
			<TableHead>
				<TableRow>{headers}</TableRow>
			</TableHead>
			<TableBody>{rows}</TableBody>
		</Table>
	);
};
