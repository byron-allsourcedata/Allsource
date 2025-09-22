import type { FC } from "react";
import type React from "react";
import type { PremiumSync } from "./schemas";
import { SmartTable, type TableColumn } from "./SmartTable";
import { TableCell, useTheme, type TableCellProps } from "@mui/material";
import { Column } from "@/components/Column";
import { Actions } from "./actions";
import { PremiumSyncStatus } from "./status";
import { minWidth } from "@mui/system";
import { UserPremiumDataSyncsZeroScreen } from "@/app/features/premium-data/components/UserPremiumDataSyncsZeroScreen";

type Props = {
	syncs?: PremiumSync[];
	onBeginSync: () => void;
	onDelete: (syncId: string) => void;
};

export const PremiumDataSyncsTable: FC<Props> = ({
	syncs,
	onDelete,
	onBeginSync,
}) => {
	if (!syncs || syncs.length === 0) {
		return <UserPremiumDataSyncsZeroScreen onBeginClick={onBeginSync} />;
	}

	const columns: TableColumn[] = [
		{
			head: "Name",
			name: "name",
			cells: syncs.map((sync) => sync.name),
		},
		{
			head: "Created",
			name: "created",
			cells: syncs.map((sync) => sync.created_at),
		},
		{
			head: "Last sync",
			name: "last_sync",
			cells: syncs.map((sync) => sync.last_sync),
		},
		{
			head: "Sync",
			name: "sync",
			cells: syncs.map((sync) => sync.sync_platform),
		},
		{
			head: "Rows",
			name: "rows",
			cells: syncs.map((sync) => sync.rows),
		},
		{
			head: <Header shrink content="Records synced" />,
			name: "records_synced",
			cells: syncs.map((sync) => sync.records_synced),
		},
		{
			head: <Header shrink content="Status" sx={{ minWidth: "120px" }} />,
			name: "progress",
			cells: syncs.map((sync, i) => (
				<TableCell key={"sync" + i}>
					<PremiumSyncStatus
						key={i}
						progress={sync.progress}
						status={sync.status}
					/>
				</TableCell>
			)),
		},
		{
			head: <Header shrink content={"Actions"} />,
			name: "actions",
			cells: syncs.map((s, i) => (
				<TableCell key={"actions" + i}>
					<Actions
						onDelete={() => {
							onDelete(s.id);
						}}
					/>
				</TableCell>
			)),
		},
	];

	return (
		<Column>
			<SmartTable columns={columns} />
		</Column>
	);
};

type HeaderProps = {
	content: string;
	shrink: boolean;
} & TableCellProps;

const Header: FC<HeaderProps> = ({ content, ...props }) => {
	const theme = useTheme();
	const defaultSx = theme.components?.MuiTableCell?.defaultProps?.sx ?? {};

	let sx = {};

	const { shrink, ...rest } = props;
	if (shrink) {
		sx = {
			whiteSpace: "nowrap",
			width: "1px",
		};
	}

	const newProps = {
		...rest,
		sx: { ...defaultSx, ...sx, ...rest.sx },
	};

	return <TableCell {...newProps}>{content}</TableCell>;
};
