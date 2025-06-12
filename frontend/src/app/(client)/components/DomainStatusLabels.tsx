import React from "react";
import { Box, Typography } from "@mui/material";

interface DomainStatusLabelsProps {
	isPixelInstalled: boolean;
	contactsResolving: boolean;
	dataSynced: boolean;
	dataSyncFailed: boolean;
}

const statusConfig = [
	{
		key: "pixel",
		success: {
			label: "Pixel Installed",
			bg: "rgba(234, 248, 221, 1)",
			color: "rgba(43, 91, 0, 1)",
		},
		error: {
			label: "Pixel Not Installed",
			bg: "rgba(253, 221, 218, 1)",
			color: "rgba(244, 87, 69, 1)",
		},
	},
	{
		key: "contacts",
		success: {
			label: "Contacts Resolving",
			bg: "rgba(254, 243, 205, 1)",
			color: "rgba(179, 151, 9, 1)",
		},
		error: {
			label: "Resolution Failed",
			bg: "rgba(253, 221, 218, 1)",
			color: "rgba(244, 87, 69, 1)",
		},
	},
	{
		key: "sync",
		success: {
			label: "Data Synced",
			bg: "rgba(204, 230, 254, 1)",
			color: "rgba(0, 129, 251, 1)",
		},
		error: {
			label: "Sync Error",
			bg: "rgba(253, 221, 218, 1)",
			color: "rgba(244, 87, 69, 1)",
		},
	},
];

const DomainStatusLabels: React.FC<DomainStatusLabelsProps> = ({
	isPixelInstalled,
	contactsResolving,
	dataSynced,
	dataSyncFailed,
}) => {
	const getLabelProps = (key: string) => {
		switch (key) {
			case "pixel":
				return isPixelInstalled
					? statusConfig[0].success
					: statusConfig[0].error;
			case "contacts":
				return contactsResolving
					? statusConfig[1].success
					: statusConfig[1].error;
			case "sync":
				if (dataSyncFailed) return statusConfig[2].error;
				if (dataSynced) return statusConfig[2].success;
				return null;
			default:
				return null;
		}
	};

	const statuses = ["pixel", "contacts", "sync"]
		.map(getLabelProps)
		.filter(Boolean) as { label: string; bg: string; color: string }[];

	return (
		<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
			{statuses.map((status, index) => (
				<Box
					key={index}
					sx={{
						backgroundColor: status.bg,
						borderRadius: "200px",
						padding: "4px 12px",
					}}
				>
					<Typography
						variant="body2"
						sx={{
							color: status.color,
							fontFamily: "Roboto",
							fontWeight: "400",
							fontSize: "14px",
						}}
					>
						{status.label}
					</Typography>
				</Box>
			))}
		</Box>
	);
};

export default DomainStatusLabels;
