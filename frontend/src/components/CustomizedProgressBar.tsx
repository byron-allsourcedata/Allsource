import React from "react";
import { Box, Backdrop, LinearProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNotification } from "../context/NotificationContext";
import { usePathname } from "next/navigation";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
	height: 4,
	borderRadius: 0,
	backgroundColor: "#c6dafc",
	"& .MuiLinearProgress-bar": {
		borderRadius: 5,
		backgroundColor: "#4285f4",
	},
}));

const PageWithLoader: React.FC = () => {
	const { hasNotification } = useNotification();
	const pathname = usePathname();

	const pixelPages = [
		"/analytics",
		"/leads",
		"/company",
		"/suppressions",
		"/data-sync-pixel",
	];

	const hasSubheader =
		(pathname.startsWith("/management") && pathname !== "/management") ||
		pixelPages.includes(pathname);

	const computeTop = () => {
		if (hasNotification && hasSubheader) return "10.85rem";
		if (hasSubheader) return "8.25rem";
		if (hasNotification) return "6.25rem";
		return "4.25rem";
	};

	return (
		<Box
			sx={{
				width: "100%",
				position: "fixed",
				top: computeTop(),
				zIndex: 1200,
				left: "175px",
				"@media (min-height: 900px)": { top: "4.25rem" },
				"@media (max-width: 899px)": { left: 0, top: "4.5rem" },
			}}
		>
			<BorderLinearProgress variant="indeterminate" />
		</Box>
	);
};

export default PageWithLoader;
