"use client";
import React, { Dispatch, SetStateAction } from "react";
import { Box, Typography, IconButton, Drawer, Button } from "@mui/material";
import { CloseIcon } from "@/icon";

interface AddFundsPopup {
	handleCancelSubscriptionPlanPopupClose: () => void;
	setExcitingOfferPopupOpen: Dispatch<SetStateAction<boolean>>;
	cancelSubscriptionPlanPopupOpen: boolean;
}

export const UnsubscribeTeamsPlan: React.FC<AddFundsPopup> = ({
	handleCancelSubscriptionPlanPopupClose,
	setExcitingOfferPopupOpen,
	cancelSubscriptionPlanPopupOpen,
}) => {
	const handleExcitingOfferPopupOpen = () => {
		setExcitingOfferPopupOpen(true);
	};

	return (
		<Drawer
			anchor="right"
			open={cancelSubscriptionPlanPopupOpen}
			onClose={handleCancelSubscriptionPlanPopupClose}
			PaperProps={{
				sx: {
					width: "620px",
					position: "fixed",
					zIndex: 1301,
					top: 0,
					bottom: 0,
					"@media (max-width: 600px)": {
						width: "100%",
					},
				},
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					py: 3.5,
					px: 2,
					borderBottom: "1px solid #e4e4e4",
					position: "sticky",
					top: 0,
					zIndex: "9",
					backgroundColor: "#fff",
				}}
			>
				<Typography
					variant="h6"
					className="first-sub-title"
					sx={{ textAlign: "center" }}
				>
					Unsubscribe Teams Plan
				</Typography>
				<IconButton
					onClick={handleCancelSubscriptionPlanPopupClose}
					sx={{ p: 0 }}
				>
					<CloseIcon sx={{ width: "20px", height: "20px" }} />
				</IconButton>
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: 5,
					height: "100%",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
					}}
				>
					<Typography
						className="first-sub-title"
						sx={{
							paddingTop: "24px",
							paddingLeft: "32px",
						}}
					>
						Are you sure you want to unsubscribe teams plan?
					</Typography>
				</Box>

				<Box sx={{ position: "relative" }}>
					<Box
						sx={{
							px: 2,
							py: 3.5,
							border: "1px solid #e4e4e4",
							position: "fixed",
							bottom: 0,
							right: 0,
							background: "#fff",
							width: "620px",
							"@media (max-width: 600px)": {
								width: "100%",
							},
						}}
					>
						<Box display="flex" justifyContent="flex-end" mt={2}>
							<Button
								className="hyperlink-red"
								sx={{
									borderRadius: "4px",
									border: "1px solid rgba(56, 152, 252, 1)",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									color: "rgba(56, 152, 252, 1) !important",
									marginRight: "16px",
									textTransform: "none",
									padding: "10px 24px",
								}}
								onClick={handleExcitingOfferPopupOpen}
							>
								Yes
							</Button>
							<Button
								className="hyperlink-red"
								onClick={handleCancelSubscriptionPlanPopupClose}
								sx={{
									background: "rgba(56, 152, 252, 1)",
									borderRadius: "4px",
									border: "1px solid rgba(56, 152, 252, 1)",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									color: "#fff !important",
									textTransform: "none",
									padding: "10px 24px",
									"&:hover": {
										color: "rgba(56, 152, 252, 1) !important",
									},
								}}
							>
								No
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};
