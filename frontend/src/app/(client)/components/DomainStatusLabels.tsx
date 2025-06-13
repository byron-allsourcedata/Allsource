import React from "react";
import { Box, Typography } from "@mui/material";

interface DomainStatusLabelsProps {
	isPixelInstalled: boolean;
	contactsResolving: boolean;
	dataSynced: boolean;
	dataSyncFailed: boolean;
}

const statusConfig = {
	pixel: {
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
	contacts: {
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
	sync: {
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
} as const;

type StatusKey = keyof typeof statusConfig;

const DomainStatusLabels: React.FC<DomainStatusLabelsProps> = ({
	isPixelInstalled,
	contactsResolving,
	dataSynced,
	dataSyncFailed,
}) => {
	const getLabelProps = (key: StatusKey) => {
		switch (key) {
			case "pixel":
				return isPixelInstalled
					? statusConfig.pixel.success
					: statusConfig.pixel.error;
			case "contacts":
				return contactsResolving
					? statusConfig.contacts.success
					: statusConfig.contacts.error;
			case "sync":
				if (dataSyncFailed) return statusConfig.sync.error;
				if (dataSynced) return statusConfig.sync.success;
				return null;
			default:
				return null;
		}
	};

	const keys: StatusKey[] = ["pixel", "contacts", "sync"];
	const statuses = keys.map(getLabelProps).filter(Boolean) as {
		label: string;
		bg: string;
		color: string;
	}[];

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
