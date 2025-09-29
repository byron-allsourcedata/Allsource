"use client";

import { InfoIcon } from "@/icon";
import { Box, SxProps, Typography } from "@mui/material";

interface TipInsideProps {
	title?: string;
	content?: string;
	sx?: SxProps;
}

const TipInsideDrawer = ({
	title,
	content,
	sx,
}: TipInsideProps) => {
	return (
		<Box
			sx={{
				...sx,
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					bgcolor: "#FEF7DF",
					border: "1px solid #F8E7AA",
					borderRadius: "4px",
					padding: "16px",
					"@media (max-width: 900px)": {
						margin: "0px 6px",
					},
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						marginBottom: "16px",
					}}
				>
					<InfoIcon
						sx={{
							color: "#EBC12E",
							marginRight: "0.3em",
						}}
					/>
					<Typography
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "16px",
							lineHeight: "normal",
							fontWeight: 600,
							color: "#202124",
						}}
					>
						{title}
					</Typography>
				</Box>

				<Typography
					sx={{
						fontFamily: "var(--font-roboto)",
						fontSize: "14px",
						lineHeight: "1.8em",
						fontWeight: 400,
						color: "rgba(95, 99, 104, 1)",
					}}
				>
					{content}
				</Typography>
			</Box>
		</Box>
	);
};

export default TipInsideDrawer;
