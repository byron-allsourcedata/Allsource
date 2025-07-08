"use client";
import React, { useState } from "react";
import {
	Box,
	Typography,
	Radio,
	RadioGroup,
	IconButton,
	Drawer,
	LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { billingStyles } from "./billingStyles";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";
import CustomButton from "@/components/ui/CustomButton";
import CustomToggle from "@/components/ui/CustomToggle";
import { CardDetails, CardBrand } from "./types";
import Image from "next/image";
import { Elements } from "@stripe/react-stripe-js";
import AddCardPopup from "./AddCard";
import { loadStripe } from "@stripe/stripe-js";
import { styled } from "@mui/material/styles";
import { useBillingContext } from "@/context/BillingContext";

interface AddFundsPopup {
	cardDetails: CardDetails[];
	openPopup: boolean;
	handlePopupClose: () => void;
	handleCheckoutSuccess: (item: CardDetails) => void;
}

const BorderLinearProgress = styled(LinearProgress)(({}) => ({
	height: 4,
	borderRadius: 0,
	backgroundColor: "#c6dafc",
	"& .MuiLinearProgress-bar": {
		borderRadius: 5,
		backgroundColor: "#4285f4",
	},
}));

const cardBrandImages: Record<CardBrand, string> = {
	visa: "/visa-icon.svg",
	mastercard: "/mastercard-icon.svg",
	amex: "/american-express.svg",
	discover: "/discover-icon.svg",
	unionpay: "/unionpay-icon.svg",
};

export const AddFundsPopup: React.FC<AddFundsPopup> = ({
	cardDetails,
	openPopup,
	handlePopupClose,
	handleCheckoutSuccess,
}) => {
	const [openAddCard, setOpenAddCard] = useState(false);
	const [amountFunds, setAmountFunds] = useState<number>(0);
	const [selectedCard, setSelectedCard] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const { triggerSync } = useBillingContext();

	const countReplenishFunds = [50, 100, 200, 500, 1000];
	const stripePromise = loadStripe(
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
	);

	const handlePay = async () => {
		try {
			setLoading(true);
			const response = await axiosInterceptorInstance.post(
				"/settings/billing/buy-funds",
				{
					amount: amountFunds,
					type_funds: "validation_funds",
					payment_method_id: cardDetails[Number(selectedCard)].id,
				},
			);
			if (response.data.success) {
				showToast("Credits successfully purchased!");
				triggerSync();
				handlePopupClose();
			} else {
				showErrorToast(response.data.error);
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

	const handleCardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedCard(event.target.value);
	};

	const handleAddCard = () => {
		setOpenAddCard(true);
	};

	const handleCloseAddCard = () => setOpenAddCard(false);

	const handleAmountFundsChange = (value: number) => {
		setAmountFunds(value);
	};

	return (
		<>
			<Drawer
				anchor="right"
				open={openPopup}
				onClose={handlePopupClose}
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
				{loading && (
					<Box
						sx={{
							width: "100%",
							position: "absolute",
							top: "4.2rem",
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
						Add Validation Funds
					</Typography>
					<IconButton onClick={handlePopupClose}>
						<CloseIcon />
					</IconButton>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						height: "100%",
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "space-between",
							alignItems: "center",
							gap: 4,
							p: 4,
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 4,
								width: "100%",
							}}
						>
							<Typography color="textSecondary">
								Add funds to your account instantly and continue enjoying our
								services without interruptions.
							</Typography>
							<Box display="flex" flexDirection="column" gap={1}>
								<Typography className="first-sub-title">
									Select an amount to top up:
								</Typography>
								<Box display="flex" gap={2}>
									{countReplenishFunds.map((option) => (
										<CustomToggle
											key={option}
											sx={{ width: "100px", py: 0.5 }}
											value={String(option)}
											isActive={amountFunds === option}
											onClick={() => handleAmountFundsChange(option)}
											name={`$${option.toLocaleString("en-US")}`}
										/>
									))}
								</Box>
							</Box>
						</Box>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								width: "100%",
								gap: 3,
							}}
						>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
								<Typography className="first-sub-title">Price:</Typography>
								<Typography color="textSecondary">
									${amountFunds?.toLocaleString("en-US")}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
									<Typography className="first-sub-title">
										Payment Method:
									</Typography>
								</Box>
								<Box sx={{ display: "flex", gap: 2 }}>
									<RadioGroup
										value={selectedCard}
										onChange={handleCardChange}
										sx={{ width: "100%", gap: 2 }}
									>
										{cardDetails?.map((card: CardDetails, index: number) => (
											<Box
												key={card.id}
												sx={{
													...billingStyles.cardItemWrapper,
													borderColor:
														selectedCard === String(index) ? "#3898FC" : "#ddd",
												}}
											>
												<Radio value={index} />
												<Box
													sx={{
														display: "flex",
														width: "100%",
														gap: 2,
														alignItems: "center",
													}}
												>
													<Box sx={billingStyles.cardImageContainer}>
														<Image
															src={
																cardBrandImages[card.brand as CardBrand] ||
																"/default-card-icon.svg"
															}
															alt={`${card.brand}-icon`}
															height={54}
															width={54}
														/>
													</Box>
													<Box>
														<Typography sx={{ fontWeight: 600 }}>
															{card.brand.charAt(0).toUpperCase() +
																card.brand.slice(1)}{" "}
															(**** {card.last4})
														</Typography>
														<Typography
															className="table-data"
															sx={{ color: "#5F6368" }}
														>
															Expire date:{" "}
															{`${card.exp_month < 10 ? "0" : ""}${card.exp_month}/${card.exp_year}`}
														</Typography>
													</Box>
												</Box>
												{card.is_default && (
													<Typography
														className="main-text"
														sx={billingStyles.defaultLabel}
													>
														Default
													</Typography>
												)}
											</Box>
										))}
									</RadioGroup>
								</Box>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										cursor: "pointer",
									}}
									onClick={handleAddCard}
								>
									<Box sx={billingStyles.squareImg}>
										<Image
											src="/add-square.svg"
											alt="add-square"
											height={24}
											width={24}
											onClick={handleAddCard}
										/>
									</Box>
									<Typography sx={{ color: "#3898FC" }}>
										Add New Card
									</Typography>
								</Box>
							</Box>
						</Box>
					</Box>

					<Box sx={{ position: "sticky", bottom: 0 }}>
						<Box
							sx={{
								backgroundColor: "#fff",
								borderTop: "1px solid #e4e4e4",
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "flex-end",
									gap: 2,
									p: 2,
								}}
							>
								<CustomButton
									variant="outlined"
									sx={{ padding: "10px 38px" }}
									onClick={handlePopupClose}
								>
									Cancel
								</CustomButton>
								<CustomButton
									variant="contained"
									sx={{ padding: "10px 47px" }}
									disabled={amountFunds === 0 || selectedCard === ""}
									onClick={handlePay}
								>
									Buy
								</CustomButton>
							</Box>
						</Box>
					</Box>
				</Box>
			</Drawer>

			<Elements stripe={stripePromise}>
				<AddCardPopup
					title="Add Card"
					open={openAddCard}
					onClose={handleCloseAddCard}
					onSuccess={handleCheckoutSuccess}
				/>
			</Elements>
		</>
	);
};
