"use client";

import { Box, Typography, Button, SxProps, Theme } from "@mui/material";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import { wrap } from "module";

interface FixCardProps {
	title: string;
	description: string;
	boldNote: string;
	learnMoreHref?: string;
}

export const fixCardStyle: Record<string, SxProps<Theme>> = {
	regularText: {
		marginTop: "16px",
		fontFamily: "var(--font-roboto)",
		fontSize: "16px",
		fontWeight: 400,
		color: "#5F6368",
	},
	boldText: {
		fontSize: "16px",
		fontWeight: 500,
		fontFamily: "var(--font-roboto)",
		color: "#5F6368",
	},
	learnMoreText: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		fontWeight: 500,
		textTransform: "none",
		textDecoration: "underline",
		color: "#3898FC",
	},
	learnMoreIcon: {
		fontSize: "16px",
		marginLeft: "5px",
	},
	fixCardHeader: {
		color: "#202124",
		fontFamily: "var(--font-nunito)",
		fontSize: "16px",
		fontWeight: 600,
		textAlign: "center",
	},
	fixCardContent: {
		position: "relative" as const,
		marginBottom: "24px",
		padding: "8px 16px",
		border: "1px solid #E4E4E4",
		borderRadius: "4px",
		bgcolor: "#FFFFFF",
		boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.08) ",
	},
};

const FixCard = ({
	title,
	description,
	boldNote,
	learnMoreHref,
}: FixCardProps) => {
	return (
		<Box sx={fixCardStyle.fixCardContent}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",

					"@media (max-width:900px)": {
						flexWrap: "wrap",
						flexDirection: "column",
					},
				}}
			>
				<Typography sx={fixCardStyle.fixCardHeader}>{title}</Typography>
				<Box sx={{ flexGrow: 1 }} />
				{learnMoreHref && (
					<Box
						sx={{
							position: "absolute",
							top: 0,
							right: 0,
							marginTop: "4px",
							marginRight: "8px",

							"@media (max-width:900px)": {
								position: "static",
							},
						}}
					>
						<Button href={learnMoreHref} sx={fixCardStyle.learnMoreText}>
							Learn more <LaunchRoundedIcon sx={fixCardStyle.learnMoreIcon} />
						</Button>
					</Box>
				)}
			</Box>

			<Typography sx={fixCardStyle.regularText}>
				{description}
				<Typography sx={fixCardStyle.boldText}> {boldNote}</Typography>
			</Typography>
		</Box>
	);
};

export default FixCard;
