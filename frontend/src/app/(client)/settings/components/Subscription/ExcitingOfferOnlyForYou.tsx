"use client";
import React, { Dispatch, SetStateAction } from "react";
import { Box, Typography, IconButton, Drawer, Button } from "@mui/material";
import { CloseIcon } from "@/icon";
import Image from "next/image";

interface AddFundsPopup {
	handleExcitingOfferPopupClose: () => void;
	setConfirmCancellationPopupOpen: Dispatch<SetStateAction<boolean>>;
	excitingOfferPopupOpen: boolean;
}

export const ExcitingOfferOnlyForYou: React.FC<AddFundsPopup> = ({
	handleExcitingOfferPopupClose,
	setConfirmCancellationPopupOpen,
	excitingOfferPopupOpen,
}) => {
	const handleConfirmCancellationPopupOpen = () => {
		setConfirmCancellationPopupOpen(true);
	};

	return (
		<Drawer
			anchor="right"
			open={excitingOfferPopupOpen}
			onClose={handleExcitingOfferPopupClose}
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
					Exciting offer only for you!
				</Typography>
				<IconButton onClick={handleExcitingOfferPopupClose} sx={{ p: 0 }}>
					<CloseIcon sx={{ width: "20px", height: "20px" }} />
				</IconButton>
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 5,
					height: "100%",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "24px 32px",
					}}
				>
					<Image
						src="/exciting-offer.svg"
						alt="exciting-offer-icon"
						width={316}
						height={338}
					/>
					<Typography
						className="first-sub-title"
						sx={{
							marginTop: "40px",
							textAlign: "center",
						}}
					>
						We have an exciting offer to you, we give 30% discount on next 3
						months subscriptions only for you.
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
								onClick={handleConfirmCancellationPopupOpen}
							>
								Confirm cancellation
							</Button>
							<Button
								className="hyperlink-red"
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
								Claim offer
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};
