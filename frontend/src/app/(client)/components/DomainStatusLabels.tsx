import React from "react";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

interface DomainStatusLabelsProps {
	isPixelInstalled: boolean;
	contactsResolving: boolean;
	dataSynced: boolean;
	dataSyncFailed: boolean;
}

const statusConfig = {
	pixel: {
		success: {
			label: "✓ Pixel Installed",
			bg: "rgba(234, 248, 221, 1)",
		},
		error: {
			label: "✗ Pixel Not Installed",
			bg: "rgba(253, 221, 218, 1)",
		},
	},
	contacts: {
		success: {
			label: "✓ Contacts Resolving",
			bg: "rgba(254, 243, 205, 1)",
		},
		error: {
			label: "✗ Resolution Failed",
			bg: "rgba(253, 221, 218, 1)",
		},
	},
	sync: {
		success: {
			label: "✓ Data Synced",
			bg: "rgba(204, 230, 254, 1)",
		},
		error: {
			label: "✗ Sync Error",
			bg: "rgba(253, 221, 218, 1)",
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
	const router = useRouter();
	const getLabelProps = (key: StatusKey) => {
		switch (key) {
			case "pixel":
				return isPixelInstalled
					? statusConfig.pixel.success
					: statusConfig.pixel.error;
			case "contacts":
				if (contactsResolving) {
					return statusConfig.contacts.success;
				}
				if (isPixelInstalled) {
					return {
						label: "Waiting Contacts",
						bg: "rgba(255, 249, 196, 1)",
					};
				}
				return statusConfig.contacts.error;
			case "sync":
				if (dataSyncFailed) return statusConfig.sync.error;
				if (dataSynced) return statusConfig.sync.success;
				return null;
			default:
				return null;
		}
	};

	const renderAddDataSyncButton = () => {
		if (isPixelInstalled && !dataSynced && !dataSyncFailed) {
			return (
				<Box
					sx={{
						cursor: "pointer",
						color: "rgba(56, 152, 252, 1)",
						fontFamily: "Roboto",
						fontWeight: 400,
						fontSize: "14px",
						lineHeight: "100%",
						letterSpacing: "0%",
						textDecoration: "underline",
						textDecorationStyle: "solid",
						textDecorationOffset: "10%",
						textDecorationThickness: "6%",
					}}
					onClick={() => {
						router.push("/data-sync-pixel");
					}}
				>
					+ Add Data Sync
				</Box>
			);
		}
		return null;
	};

	const keys: StatusKey[] = ["pixel", "contacts", "sync"];
	const statuses = keys.map(getLabelProps).filter(Boolean) as {
		label: string;
		bg: string;
		color?: string;
	}[];

	return (
		<Box
			sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
		>
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
							color: "rgba(74, 74, 74, 1)",
							fontFamily: "Roboto",
							fontWeight: "400",
							fontSize: "14px",
						}}
					>
						{status.label}
					</Typography>
				</Box>
			))}

			{renderAddDataSyncButton()}
		</Box>
	);
};

export default DomainStatusLabels;
