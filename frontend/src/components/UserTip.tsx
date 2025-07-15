"use client";

import { InfoIcon } from "@/icon";
import { Box, SxProps, Typography } from "@mui/material";

interface UserHintProps {
	title?: string;
	content?: string;
	service?: string;
	limit?: number;
	sx?: SxProps;
}

const UserTip = ({
	title = "Data Sync Speed",
	service,
	limit,
	content,
	sx,
}: UserHintProps) => {
	return (
		<Box
			sx={{
				// margin: "0px 32px",
				marginTop: "16px",
				width: "95%",
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
					{content ??
						`${service}'s standard sync speed is ${limit} contacts per minute.`}
				</Typography>
			</Box>
		</Box>
	);
};

export default UserTip;
