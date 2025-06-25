import { FeatureCardProps } from "@/types/first_time_screens";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import React from "react";

type FeatureCardWithButtonProps = {
	buttonLabel?: string;
	img_width: number;
	mainContent?: React.ReactNode | React.ComponentType;
} & FeatureCardProps;

const FeatureCardWithButton: React.FC<FeatureCardWithButtonProps> = ({
	title,
	subtitle,
	imageSrc,
	onClick,
	showRecommended = false,
	img_height = 140,
	showInstalled = false,
	buttonLabel,
	img_width = 140,
	mainContent,
}) => {
	const isComponent =
		typeof mainContent === "function" ||
		(typeof mainContent === "object" &&
			(mainContent as any)?.prototype?.isReactComponent);
	return (
		<Card
			variant="outlined"
			//{...(onClick && { onClick })}
			sx={{
				width: "100%",
				height: "100%",
				backgroundColor: showInstalled
					? "rgba(246, 248, 250, 1)"
					: "transparent",
				boxShadow: "none",
				//cursor: showInstalled ? "default" : "pointer",
				// ":hover": showInstalled
				//     ? {}
				//     : {
				//         backgroundColor: "rgba(246, 249, 255, 1)",
				//         border: "1px solid rgba(1, 113, 248, 0.4)",
				//         boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
				//         "& .feature-card-title": { color: "rgba(21, 22, 25, 1)" },
				//     },
			}}
		>
			<CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between" }}>
					<Box sx={{ display: "flex" }}>
						{showInstalled && (
							<CheckCircleIcon
								sx={{
									fontSize: 20,
									color: "rgba(96, 178, 21, 1)",
									mr: 1,
								}}
							/>
						)}
						<Typography className="first-sub-title">{title}</Typography>
					</Box>
					{showRecommended && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
							}}
						>
							<Typography
								className="table-data"
								sx={{
									color: "rgba(43, 91, 0, 1) !important",
									fontSize: "14px !important",
									backgroundColor: "rgba(234, 248, 221, 1) !important",
									padding: "4px 12px",
									borderRadius: "4px",
								}}
							>
								Recommended
							</Typography>
						</Box>
					)}
					{showInstalled && (
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
							}}
						>
							<Typography
								className="table-data"
								sx={{
									color: "rgba(43, 91, 0, 1) !important",
									fontSize: "14px !important",
									backgroundColor: "rgba(234, 248, 221, 1) !important",
									padding: "4px 12px",
									borderRadius: "4px",
								}}
							>
								Completed
							</Typography>
						</Box>
					)}
				</Box>
				<Typography className="description">{subtitle}</Typography>

				<Box
					sx={{
						width: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderRadius: 2,
						overflow: "hidden",
					}}
				>
					<img
						src={imageSrc}
						alt=""
						style={{ maxHeight: "100%", maxWidth: "100%" }}
					/>
				</Box>

				{mainContent && (
					<Box>
						{isComponent
							? React.createElement(mainContent as React.ComponentType)
							: mainContent}
					</Box>
				)}

				<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
					<Button
						variant="contained"
						onClick={onClick}
						sx={{
							backgroundColor: "rgba(56,152,252,1)",
							textTransform: "none",
							padding: "10px 24px",
							color: "#fff !important",
							":hover": { backgroundColor: "rgba(48,149,250,1)" },
							":disabled": { backgroundColor: "rgba(56,152,252,0.5)" },
						}}
					>
						{buttonLabel}
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
};

export default FeatureCardWithButton;
