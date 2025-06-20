"use client";
import React from "react";
import {
	Box,
	Typography,
	Button,
	Tooltip,
	Link,
	LinearProgress,
} from "@mui/material";
import { billingStyles } from "./billingStyles";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface UsageItemProps {
	title: string;
	limitValue: number;
	currentValue: number;
	available?: boolean;
	needButton?: boolean;
	commingSoon?: boolean;
	moneyContactsOverage?: number;
}

export const UsageItem: React.FC<UsageItemProps> = ({
	title,
	limitValue,
	currentValue,
	available = true,
	needButton = true,
	commingSoon = false,
	moneyContactsOverage = 0,
}) => {
	const limit = Math.round(((limitValue - currentValue) / limitValue) * 100);

	const valueLinearProgress = () => {
		if (limitValue === -1) {
			return 100;
		} else if (!available || moneyContactsOverage !== 0) {
			return 0;
		} else {
			return 100 - limit;
		}
	};

	const valueText =
		limitValue === -1
			? "Unlimited"
			: `${needButton ? "$" : ""}${Math.max(0, currentValue).toLocaleString("en-US")} out of ${needButton ? "$" : ""}${limitValue?.toLocaleString("en-US")} Remaining`;

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
				{moneyContactsOverage !== 0 && (
					<Typography
						className="second-sub-title"
						sx={{ lineHeight: "20px !important" }}
					>
						${moneyContactsOverage}
					</Typography>	
				)}
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
				{!available && (
					<Link
						href={"/settings?section=subscription"}
						underline="hover"
						sx={{
							display: "inline-flex",
							alignItems: "center",
							color: "#3898FC",
							fontSize: 14,
							fontFamily: "Nunito Sans",
							ml: 1,
							fontWeight: 500,
						}}
					>
						Upgrade Plan
					</Link>
				)}
			</Box>
			<LinearProgress
				variant="determinate"
				value={valueLinearProgress()}
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
				{available && (
					<Typography
						className="paragraph"
						sx={{
							color: "#787878 !important",
							opacity: commingSoon ? 0.6 : 1,
						}}
					>
						{commingSoon ? "Coming Soon" : valueText}
					</Typography>
				)}
				{!available && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<WarningAmberIcon
							sx={{ color: "#E65A59", width: "16px", height: "16px" }}
						/>
						<Typography
							className="paragraph"
							sx={{
								color: "#E65A59 !important",
							}}
						>
							Not included in your plan
						</Typography>
					</Box>
				)}
				{limitValue !== -1 &&
					available &&
					moneyContactsOverage === 0 &&
					!commingSoon && (
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
