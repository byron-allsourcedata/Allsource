import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Switch,
	Divider,
	Box,
	Typography,
	LinearProgress,
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
import { styled } from "@mui/material/styles";

interface CardDetails {
	id: string;
	last4: string;
	brand: string;
	exp_month: number;
	exp_year: number;
	is_default: boolean;
}

interface PaymentPopupProps {
	title: string;
	open: boolean;
	onClose: () => void;
	onSuccess: (cardDetails: CardDetails) => void;
	confirmButtonSx: { p: string };
}

const addCardStyles = {
	switchStyle: {
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
	},
	imageStyle: {
		width: 290,
		height: 190,
		mb: "40px",
		borderRadius: "4px",
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
		backgroundImage: "url(/bank_card.svg)",
	},
	wrapStripeInput: {
		border: "1px solid #ddd",
		borderRadius: "4px",
		padding: "10px",
	},
};

const stripeStyles = {
	style: {
		base: {
			color: "#707071",
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
};

const BorderLinearProgress = styled(LinearProgress)(({}) => ({
	height: 4,
	borderRadius: 0,
	backgroundColor: "#c6dafc",
	"& .MuiLinearProgress-bar": {
		borderRadius: 5,
		backgroundColor: "#4285f4",
	},
}));

const AddCardPopup: React.FC<PaymentPopupProps> = ({
	title,
	open,
	onClose,
	onSuccess,
	confirmButtonSx,
}) => {
	const [isDefault, setIsDefault] = useState(false);
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
				{ payment_method_id: paymentMethod.id, is_default: isDefault },
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
			<DialogTitle
				sx={{ padding: 3, lineHeight: "22px" }}
				className="first-sub-title"
			>
				{title}
			</DialogTitle>
			<Divider />
			{loading && (
				<Box
					sx={{
						width: "100%",
						position: "absolute",
						top: 70,
						left: 0,
						zIndex: 1200,
					}}
				>
					<BorderLinearProgress
						variant="indeterminate"
						sx={{ borderRadius: "6px" }}
					/>
				</Box>
			)}
			<DialogContent>
				<Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
					<Box sx={addCardStyles.imageStyle} />
				</Box>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						<Typography className="table-heading">Card Number</Typography>
						<Box sx={addCardStyles.wrapStripeInput}>
							<CardNumberElement options={stripeStyles} />
						</Box>
					</Box>
					<Box sx={{ display: "flex", gap: 2 }}>
						<Box
							sx={{
								display: "flex",
								flex: "1",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Typography className="table-heading">Exp. Date</Typography>
							<Box sx={addCardStyles.wrapStripeInput}>
								<CardExpiryElement options={stripeStyles} />
							</Box>
						</Box>
						<Box
							sx={{
								display: "flex",
								flex: "1",
								flexDirection: "column",
								gap: 1,
							}}
						>
							<Typography className="table-heading">CVV/CVC</Typography>
							<Box sx={addCardStyles.wrapStripeInput}>
								<CardCvcElement
									options={{ ...stripeStyles, placeholder: "123" }}
								/>
							</Box>
						</Box>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Switch
							checked={isDefault}
							onChange={() => setIsDefault((prev) => !prev)}
							sx={addCardStyles.switchStyle}
						/>
						<Typography className="second-sub-title">Set as default</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions sx={{ gap: 1 }}>
				<CustomButton
					variant="outlined"
					onClick={onClose}
					sx={{ p: "10px 44px" }}
				>
					Back
				</CustomButton>
				<CustomButton
					variant="contained"
					onClick={handleButtonClick}
					sx={{ p: "10px 27.5px" }}
				>
					Save Card
				</CustomButton>
			</DialogActions>
		</Dialog>
	);
};

export default AddCardPopup;
