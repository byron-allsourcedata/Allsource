"use client";
import React from "react";
import {
	Box,
	Typography,
	Button,
	Tooltip,
	LinearProgress,
} from "@mui/material";

interface UsageItemProps {
	title: string;
	limitValue: number;
	currentValue: number;
}

export const UsageItem: React.FC<UsageItemProps> = ({
	title,
	limitValue,
	currentValue,
}) => {
	const limit = Math.round(((limitValue - currentValue) / limitValue) * 100);

	const printLimit = () => {
		return limitValue === -1 ? "Unlimited" : limit;
	};

	const valueText =
		limitValue === -1
			? "Unlimited"
			: `${Math.max(0, limitValue - currentValue)} out of ${limitValue} Remaining`;

	return (
		<Box sx={{ width: "100%" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					// opacity: !showValue ? 1 : 0.6,
					mb: 2,
				}}
			>
				<Typography
					className="second-sub-title"
					sx={{ lineHeight: "20px !important" }}
				>
					{title}
				</Typography>
				<Box sx={{ flexShrink: 0, opacity: 0.6 }}>
					<Tooltip title="Coming Soon" arrow>
						<Box sx={{ display: "inline-block" }}>
							<Button
								className="hyperlink-red"
								disabled={true}
								sx={{
									background: "rgba(56, 152, 252, 1)",
									borderRadius: "4px",
									border: "1px solid rgba(56, 152, 252, 1)",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									color: "#fff !important",
									textTransform: "none",
									padding: "6px 16.5px",
									"&:hover": {
										color: "rgba(56, 152, 252, 1) !important",
									},
								}}
							>
								Add Funds
							</Button>
						</Box>
					</Tooltip>
				</Box>
			</Box>
			<LinearProgress
				variant="determinate"
				value={limitValue === -1 ? 100 : limit}
				sx={{
					height: "8px",
					borderRadius: "4px",
					backgroundColor: "#dbdbdb",
					"& .MuiLinearProgress-bar": {
						borderRadius: 5,
						backgroundColor: "#6EC125",
					},
					mb: 1,
					// opacity: percentageUsed ? 1 : 0.6,
				}}
			/>
			<Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
				<Typography
					className="paragraph"
					sx={{
						color: "#787878 !important",
						// opacity: !showValue ? 1 : 0.6
					}}
				>
					{valueText}
				</Typography>
				{limitValue !== -1 && (
					<Typography
						className="second-sub-title"
						sx={{ lineHeight: "20px !important" }}
					>
						{100 - limit}% Used
					</Typography>
				)}
			</Box>
		</Box>
	);
};
