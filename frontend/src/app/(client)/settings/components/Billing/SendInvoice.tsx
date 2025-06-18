"use client";
import React, { useState } from "react";
import {
	Box,
	Typography,
	Button,
	TextField,
	IconButton,
	Drawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { billingStyles } from "./billingStyles";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";

interface ConnectMailChimpPopupProps {
	sendInvoicePopupOpen: boolean;
	setIsLoading: (state: boolean) => void;
	handleSendInvoicePopupClose: () => void;
	selectedInvoiceId: string;
}

export const SendInvoicePopup: React.FC<ConnectMailChimpPopupProps> = ({
	sendInvoicePopupOpen,
	setIsLoading,
	handleSendInvoicePopupClose,
	selectedInvoiceId,
}) => {
	const [email, setEmail] = useState("");

	const isFormValidThird = () => {
		if (!email || email.trim() === "") {
			return false;
		}
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			return false;
		}
		return true;
	};

	const handleSendInvoice = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.post(
				"/settings/billing/send-billing",
				{ email: email, invoice_id: selectedInvoiceId },
			);
			if (response.status === 200) {
				switch (response.data) {
					case "SUCCESS":
						showToast("Send invoice successfully");
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
			handleSendInvoicePopupClose();
		}
	};

	return (
		<Drawer
			anchor="right"
			open={sendInvoicePopupOpen}
			onClose={handleSendInvoicePopupClose}
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
					Send Invoice
				</Typography>
				<IconButton onClick={handleSendInvoicePopupClose} sx={{ p: 0 }}>
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
						p: 4,
					}}
				>
					<Typography
						className="second-sub-title"
						sx={{
							fontWeight: "600 !important",
							color: "#4a4a4a !important",
							marginBottom: "38px",
						}}
					>
						Invoice with {selectedInvoiceId} ID will be shared to the email
						inbox directly. Please kindly check your mail inbox.
					</Typography>
					<TextField
						sx={billingStyles.formField}
						label="Enter Email ID"
						fullWidth
						margin="normal"
						InputLabelProps={{
							className: "form-input-label",
							focused: false,
						}}
						InputProps={{
							className: "form-input",
							sx: billingStyles.formInput,
						}}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</Box>

				<Box sx={{ position: "relative", height: "100%" }}>
					<Box
						sx={{
							px: 2,
							py: 3.5,
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
						<Box display="flex" justifyContent="flex-end" mt={2}>
							<Button
								className="hyperlink-red"
								onClick={handleSendInvoicePopupClose}
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
								disabled={!isFormValidThird()}
								onClick={handleSendInvoice}
								sx={{
									background: "rgba(56, 152, 252, 1)",
									borderRadius: "4px",
									color: "#fff",
									border: "1px solid",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
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
								Send
							</Button>
						</Box>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};
