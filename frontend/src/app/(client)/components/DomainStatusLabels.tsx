import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

interface DomainStatusLabelsProps {
	isPixelInstalled: boolean;
	contactsResolving: boolean;
	dataSynced: boolean;
	dataSyncFailed: boolean;
}

interface LabelConfig {
	key: string;
	label: React.ReactNode;
	bg: string;
}

const DomainStatusLabels: React.FC<DomainStatusLabelsProps> = ({
	isPixelInstalled,
	contactsResolving,
	dataSynced,
	dataSyncFailed,
}) => {
	const router = useRouter();

	const statuses: LabelConfig[] = [];

	// Pixel
	statuses.push({
		key: "pixel",
		label: isPixelInstalled ? (
			"✓ Pixel Installed"
		) : (
			<Button
				variant="outlined"
				color="primary"
				onClick={() => router.push("/management/install-pixel")}
				sx={{
					textTransform: "none",
					borderRadius: "200px",
					fontWeight: 400,
					fontSize: "14px",
					padding: "2px 12px",
					minHeight: "28px",
				}}
			>
				Install Pixel
			</Button>
		),
		bg: isPixelInstalled ? "rgba(234, 248, 221, 1)" : "transparent",
	});

	// Contacts
	if (isPixelInstalled) {
		statuses.push({
			key: "contacts",
			label: contactsResolving ? "✓ Contacts Resolving" : "Waiting Contacts",
			bg: contactsResolving
				? "rgba(254, 243, 205, 1)"
				: "rgba(255, 249, 196, 1)",
		});
	}

	// Data Sync
	if (isPixelInstalled) {
		if (dataSyncFailed) {
			statuses.push({
				key: "sync-failed",
				label: "✗ Sync Error",
				bg: "rgba(253, 221, 218, 1)",
			});
		} else if (dataSynced) {
			statuses.push({
				key: "sync-success",
				label: "✓ Data Synced",
				bg: "rgba(204, 230, 254, 1)",
			});
		}
	}

	const renderAddDataSyncButton = () => {
		if (isPixelInstalled && !dataSynced && !dataSyncFailed) {
			return (
				<Button
					variant="outlined"
					color="primary"
					onClick={() => router.push("/data-sync-pixel")}
					sx={{
						textTransform: "none",
						borderRadius: "200px",
						fontWeight: 400,
						fontSize: "14px",
						padding: "2px 12px",
						minHeight: "28px",
					}}
				>
					+ Add Data Sync
				</Button>
			);
		}
		return null;
	};

	return (
		<Box
			sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}
		>
			{statuses.map((status) => (
				<Box
					key={status.key}
					sx={{
						backgroundColor: status.bg,
						borderRadius: "200px",
						padding: typeof status.label === "string" ? "4px 12px" : 0,
						display: "flex",
						alignItems: "center",
					}}
				>
					{typeof status.label === "string" ? (
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
					) : (
						status.label
					)}
				</Box>
			))}

			{renderAddDataSyncButton()}
		</Box>
	);
};

export default DomainStatusLabels;
