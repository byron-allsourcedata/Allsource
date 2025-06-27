"use client";
import React from "react";
import { Box, Typography, Button, IconButton, Drawer } from "@mui/material";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";

interface RemoveCardPopupProps {
	removePopupOpen: boolean;
	setIsLoading: (state: boolean) => void;
	setCardDetails: (state: any) => void;
	handleRemovePopupClose: () => void;
	selectedCardId: string;
}

export const RemoveCardPopup: React.FC<RemoveCardPopupProps> = ({
	removePopupOpen,
	setIsLoading,
	handleRemovePopupClose,
	selectedCardId,
	setCardDetails,
}) => {
	const handleDeleteCard = async () => {
		try {
			setIsLoading(true);
			const payment_method_id = {
				payment_method_id: selectedCardId,
			};
			const response = await axiosInterceptorInstance.delete(
				"/settings/billing/delete-card",
				{
					data: payment_method_id,
				},
			);

			if (response.status === 200) {
				switch (response.data.status) {
					case "SUCCESS":
						showToast("Delete user card successfully");
						setCardDetails((prevCardDetails: any) =>
							prevCardDetails.filter((card: any) => card.id !== selectedCardId),
						);
						break;
					default:
						showErrorToast("Unknown response received.");
				}
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response && error.response.status === 403) {
					showErrorToast(
						"Access denied: You do not have permission to remove this member.",
					);
				}
			}
		} finally {
			setIsLoading(false);
			handleRemovePopupClose();
		}
	};

	return (
		<Drawer
			anchor="right"
			open={removePopupOpen}
			onClose={handleRemovePopupClose}
			PaperProps={{
				sx: {
					width: "40%",
					position: "fixed",
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
					padding: "0.75em 1em 0.925em 1em",
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
					Confirm Deletion
				</Typography>
				<IconButton onClick={handleRemovePopupClose}>
					<CloseIcon />
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
					}}
				>
					<Image
						src="/delete-card-icon.svg"
						alt="delete-card-icon"
						width={403}
						height={403}
					/>
					<Typography
						className="second-sub-title"
						sx={{
							fontWeight: "600 !important",
							lineHeight: "20px !important",
							color: "#4a4a4a !important",
							marginBottom: "20px",
						}}
					>
						Delete card detail
					</Typography>
					<Typography
						className="paragraph"
						sx={{
							lineHeight: "16px !important",
							color: "#5f6368 !important",
						}}
					>
						To remove your default payment method, you need to set another
						payment <br />
						method as the default first!
					</Typography>
				</Box>

				<Box sx={{ position: "relative" }}>
					<Box
						sx={{
							p: "1em",
							border: "1px solid #e4e4e4",
							position: "fixed",
							bottom: 0,
							right: 0,
							background: "#fff",
							width: "40%",
							"@media (max-width: 600px)": {
								width: "100%",
							},
						}}
					>
						<Box display="flex" justifyContent="flex-end">
							<Button
								className="hyperlink-red"
								onClick={handleRemovePopupClose}
								sx={{
									borderRadius: "4px",
									border: "1px solid rgba(56, 152, 252, 1)",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									color: "rgba(56, 152, 252, 1) !important",
									marginRight: "16px",
									textTransform: "none",
									padding: "10px 24px",
								}}
							>
								Cancel
							</Button>
							<Button
								className="hyperlink-red"
								onClick={handleDeleteCard}
								sx={{
									background: "rgba(56, 152, 252, 1)",
									borderRadius: "4px",
									border: "1px solid rgba(56, 152, 252, 1)",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									color: "#fff !important",
									textTransform: "none",
									padding: "10px 24px",
									":hover": {
										backgroundColor: "rgba(30, 136, 229, 1)",
									},
									":active": {
										backgroundColor: "rgba(56, 152, 252, 1)",
									},
									":disabled": {
										backgroundColor: "rgba(56, 152, 252, 1)",
										color: "#fff",
										opacity: 0.6,
									},
								}}
							>
								Delete
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};
