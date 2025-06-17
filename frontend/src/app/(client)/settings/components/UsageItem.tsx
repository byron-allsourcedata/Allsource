"use client";
import React from "react";
import {
	Box,
	Typography,
	Button,
	Tooltip,
	LinearProgress,
} from "@mui/material";
import { billingStyles } from "./billingStyles";

interface UsageItemProps {
	title: string;
	limitValue: number;
	currentValue: number;
	needButton?: boolean;
	commingSoon?: boolean;
}

export const UsageItem: React.FC<UsageItemProps> = ({
	title,
	limitValue,
	currentValue,
	needButton = true,
	commingSoon = false,
}) => {
	console.log(title, currentValue, limitValue);
	const limit = Math.round(((limitValue - currentValue) / limitValue) * 100);

	const valueText =
		limitValue === -1
			? "Unlimited"
			: `${Math.max(0, currentValue)} out of ${limitValue} Remaining`;

	return (
		<Box sx={{ width: "100%" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					opacity: commingSoon ? 0.6 : 1,
					mb: 2,
				}}
			>
				<Typography
					className="second-sub-title"
					sx={{ lineHeight: "20px !important" }}
				>
					{title}
				</Typography>
				{needButton && (
					<Box sx={{ flexShrink: 0, opacity: 0.6 }}>
						<Tooltip title="Coming Soon" arrow>
							<Box sx={{ display: "inline-block" }}>
								<Button
									className="hyperlink-red"
									disabled={true}
									sx={billingStyles.addFundsButton}
								>
									Add Funds
								</Button>
							</Box>
						</Tooltip>
					</Box>
				)}
			</Box>
			<LinearProgress
				variant="determinate"
				value={limitValue === -1 ? 100 : 100 - limit}
				sx={{
					height: "8px",
					borderRadius: "4px",
					backgroundColor: "#dbdbdb",
					"& .MuiLinearProgress-bar": {
						borderRadius: 5,
						backgroundColor: "#6EC125",
					},
					mb: 1,
					opacity: commingSoon ? 0.6 : 1,
				}}
			/>
			<Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
				<Typography
					className="paragraph"
					sx={{
						color: "#787878 !important",
						opacity: commingSoon ? 0.6 : 1,
					}}
				>
					{commingSoon ? "Comming Soon" : valueText}
				</Typography>
				{limitValue !== -1 && !commingSoon && (
					<Typography
						className="second-sub-title"
						sx={{ lineHeight: "20px !important" }}
					>
						{limit}% Used
					</Typography>
				)}
			</Box>
		</Box>
	);
};
