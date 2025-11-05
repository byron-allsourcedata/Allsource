import { Box, Tooltip, Typography } from "@mui/material";

interface PlatformIconWithNameInTooltipProps {
	platformName: string;
	getPlatformIcon: (platform: string) => void;
}

const PlatformIconWithNameInTooltip = ({
	platformName,
	getPlatformIcon,
}: PlatformIconWithNameInTooltipProps) => {
	function toCamelCase(platform: string): string {
		return platform
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");
	}

	return (
		<Tooltip
			title={
				<Box
					sx={{
						backgroundColor: "#fff",
						margin: 0,
						padding: 0,
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<Typography
						className="table-data"
						component="div"
						sx={{
							fontSize: "12px !important",
						}}
					>
						{toCamelCase(platformName) || "--"}
					</Typography>
				</Box>
			}
			componentsProps={{
				tooltip: {
					sx: {
						backgroundColor: "#fff",
						color: "#000",
						boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
						border: "0.5px solid rgba(225, 225, 225, 1)",
						borderRadius: "4px",
						maxHeight: "100%",
						maxWidth: "500px",
						padding: "11px 10px",
						marginLeft: "0.5rem !important",
					},
				},
			}}
			enterDelay={100}
		>
			{getPlatformIcon(platformName) ?? <span>--</span>}
		</Tooltip>
	);
};

export default PlatformIconWithNameInTooltip;
