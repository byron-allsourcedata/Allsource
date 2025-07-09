"use client";
import React, { useState } from "react";
import { Box, Typography, Tooltip, Link, LinearProgress } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { AddFundsPopup } from "./AddFunds";
import { CardDetails } from "./types";
import CustomButton from "@/components/ui/CustomButton";

interface UsageItemProps {
	cardDetails: CardDetails[];
	handleCheckoutSuccess: (item: CardDetails) => void;
	title: string;
	limitValue: number;
	currentValue: number;
	available?: boolean;
	needButton?: boolean;
	commingSoon?: boolean;
	moneyContactsOverage?: string;
}

export const UsageItem: React.FC<UsageItemProps> = ({
	cardDetails,
	handleCheckoutSuccess,
	title,
	limitValue,
	currentValue,
	available = true,
	needButton = true,
	commingSoon = false,
	moneyContactsOverage = "0",
}) => {
	const limit = Math.round(((limitValue - currentValue) / limitValue) * 100);
	const [addFundsPopupOpen, setAddFundsPopupOpen] = useState(false);

	const valueLinearProgress = () => {
		if (limitValue === -1) {
			return 100;
		} else if (!available || moneyContactsOverage !== "0") {
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
		<>
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
					{moneyContactsOverage !== "0" && (
						<Typography
							className="second-sub-title"
							sx={{ lineHeight: "20px !important" }}
						>
							${Number(moneyContactsOverage).toLocaleString("en-US")}
						</Typography>
					)}
					{needButton && (
						<Box sx={{ flexShrink: 0 }}>
							{true && (
								<Tooltip title="Coming Soon" arrow>
									<Box sx={{ display: "inline-block" }}>
										<CustomButton disabled={true}>Add Funds</CustomButton>
									</Box>
								</Tooltip>
							)}
							{/* {!commingSoon && (
								<Box sx={{ display: "inline-block" }}>
									<CustomButton onClick={() => setAddFundsPopupOpen(true)}>
										Add Funds
									</CustomButton>
								</Box>
							)} */}
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
								fontFamily: "var(--font-nunito)",
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
						moneyContactsOverage === "0" &&
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
			<AddFundsPopup
				cardDetails={cardDetails}
				handleCheckoutSuccess={handleCheckoutSuccess}
				openPopup={addFundsPopupOpen}
				handlePopupClose={() => setAddFundsPopupOpen(false)}
			/>
		</>
	);
};
