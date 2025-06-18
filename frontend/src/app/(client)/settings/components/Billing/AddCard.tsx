import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControlLabel,
	Switch,
	Checkbox,
	Button,
	Box,
	Typography,
} from "@mui/material";
import CustomButton from "@/components/ui/CustomButton";
import {
	CardNumberElement,
	CardExpiryElement,
	CardCvcElement,
	useStripe,
	useElements,
} from "@stripe/react-stripe-js";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";

type PaymentPopupProps = {
	open: boolean;
	onClose: () => void;
	onSuccess: (cardDetails: any) => void;
};

const AddCardPopup: React.FC<PaymentPopupProps> = ({ open, onClose, onSuccess }) => {
	const [checked, setChecked] = useState(false);
	const elements = useElements();
	const stripe = useStripe();
	const [loading, setLoading] = useState(false);

	const handleButtonClick = async () => {
		if (!stripe || !elements) {
			showErrorToast("Stripe.js has not loaded yet.");
			return;
		}
		const cardNumberElement = elements.getElement(CardNumberElement);
		const cardExpiryElement = elements.getElement(CardExpiryElement);
		const cardCvcElement = elements.getElement(CardCvcElement);

		if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
			showErrorToast("Card elements not initialized.");
			return;
		}

		setLoading(true);
		const { paymentMethod, error } = await stripe.createPaymentMethod({
			type: "card",
			card: cardNumberElement,
		});

		if (error) {
			showErrorToast(error.message || "An unexpected error occurred.");
			setLoading(false);
			return;
		}

		try {
			const response = await axiosInterceptorInstance.post(
				"/settings/billing/add-card",
				{ payment_method_id: paymentMethod.id },
			);
			if (response.status === 200) {
				const { status } = response.data;
				if (status === "SUCCESS") {
					showToast("Card added successfully!");
					onClose();
					onSuccess(response.data.card_details);
				} else {
					showErrorToast("Unknown response received.");
				}
			} else {
				showErrorToast("Unexpected response status: " + response.status);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response) {
					showErrorToast(
						`Error: ${error.response.status} - ${error.response.data.message || "An error occurred."}`,
					);
				} else {
					showErrorToast("Network error or no response received.");
				}
			} else {
				showErrorToast("An unexpected error occurred.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Complete Your Payment</DialogTitle>
			<DialogContent>
				<Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
					<Box
						sx={{
							width: 290,
							height: 190,
							mb: "40px",
							borderRadius: "4px",
							backgroundPosition: "center",
							backgroundRepeat: "no-repeat",
							backgroundImage: "url(/bank_card.svg)",
						}}
					/>
				</Box>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
						<CardNumberElement
							options={{
								style: {
									base: {
										color: "#32325d",
										fontFamily: "Nunito Sans, sans-serif",
										fontSize: "16px",
										fontWeight: "400",
										lineHeight: "24px",
										padding: "10px",
										backgroundColor: "#fff",
										"::placeholder": {
											color: "#aab7c4",
										},
									},
									invalid: {
										color: "#fa755a",
									},
									complete: {
										color: "#4CAF50",
									},
								},
							}}
						/>
					<Box sx={{ display: "flex", gap: 2 }}>
					<Box sx={{ flex: "1", mr: 1 }}>
						<CardExpiryElement
							options={{
								style: {
									base: {
										color: "#32325d",
										fontFamily: "Nunito Sans, sans-serif",
										fontSize: "16px",
										fontWeight: "400",
										lineHeight: "24px",
										padding: "10px",
										backgroundColor: "#fff",
										"::placeholder": {
											color: "#aab7c4",
										},
									},
									invalid: {
										color: "#fa755a",
									},
									complete: {
										color: "#4CAF50",
									},
								},
							}}
						/>
					</Box>
					<Box sx={{ flex: "1", mr: 1 }}>
						<CardCvcElement
							options={{
								style: {
									base: {
										color: "#32325d",
										fontFamily: "Nunito Sans, sans-serif",
										fontSize: "16px",
										fontWeight: "400",
										lineHeight: "24px",
										padding: "10px",
										backgroundColor: "#fff",
										"::placeholder": {
											color: "#aab7c4",
										},
									},
									invalid: {
										color: "#fa755a",
									},
									complete: {
										color: "#4CAF50",
									},
								},
							}}
						/>
					</Box>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Switch
							checked={checked}
							onChange={() => setChecked((prev) => !prev)}
							sx={{
								"& .MuiSwitch-switchBase": {
									"&+.MuiSwitch-track": {
										backgroundColor: "rgba(163, 176, 194, 1)",
										opacity: 1,
									},
									"&.Mui-checked": {
										color: "#fff",
										"&+.MuiSwitch-track": {
											backgroundColor: "rgba(56, 152, 252, 1)",
											opacity: 1,
										},
									},
								},
							}}
						/>
						<Typography>Set as default</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<CustomButton variant="outlined" onClick={onClose}>Back</CustomButton>
				<CustomButton variant="contained" onClick={handleButtonClick}>Pay</CustomButton>
			</DialogActions>
		</Dialog>
	);
};

export default AddCardPopup;
