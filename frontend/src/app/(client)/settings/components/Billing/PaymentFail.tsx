import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	Typography,
	Box,
	Radio,
	RadioGroup,
} from "@mui/material";
import Image from "next/image";
import CustomButton from "@/components/ui/CustomButton";
import { Elements } from "@stripe/react-stripe-js";
import AddCardPopup from "./AddCard";
import { loadStripe } from "@stripe/stripe-js";

interface CardDetails {
	id: string;
	brand: string;
	last4: string;
	exp_month: number;
	exp_year: number;
	is_default: boolean;
}

interface PaymentPopupProps {
	open: boolean;
	cardDetails: CardDetails[];
	handleCheckoutSuccess: (item: CardDetails) => void;
}

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unionpay";

const cardBrandImages: Record<CardBrand, string> = {
	visa: "/visa-icon.svg",
	mastercard: "/mastercard-icon.svg",
	amex: "/american-express.svg",
	discover: "/discover-icon.svg",
	unionpay: "/unionpay-icon.svg",
};

const PaymentFail: React.FC<PaymentPopupProps> = ({
	open,
	cardDetails,
	handleCheckoutSuccess,
}) => {
	const stripePromise = loadStripe(
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
	);
	const [openAddCard, setOpenAddCard] = useState(false);

	const handlePay = () => {};
	const onClose = () => {};

	const handleAddCard = () => {
		setOpenAddCard(true);
	};

	const handleCloseAddCard = () => setOpenAddCard(false);

	const paymentFailStyles = {
		imageStyle: {
			width: 87,
			height: 78,
			borderRadius: "4px",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			backgroundImage: "url(/danger-fill-icon.svg)",
		},
		cardImageContainer: {
			width: "62px",
			height: "62px",
			borderRadius: "4px",
			border: "1px solid #f0f0f0",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
		},
	};

	const [selectedCard, setSelectedCard] = useState<string>("");

	const handleCardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		console.log("Selected card index:", event.target.value);
		setSelectedCard(event.target.value);
	};

	return (
		<>
			<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ padding: 3 }} className="first-sub-title">
					Complete Your Payment
				</DialogTitle>
				<Divider />
				<DialogContent>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							gap: "20px",
							my: 2,
						}}
					>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Box sx={paymentFailStyles.imageStyle} />
						</Box>
						<Typography className="hyperlink-red" sx={{ textAlign: "center" }}>
							Your access has been paused because your last payment failed. To
							restore full functionality, please complete the payment below.
						</Typography>
					</Box>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
											display: "flex",
											alignItems: "center",
											width: "100%",
											gap: 2,
											border: "1px solid #ddd",
											borderColor: selectedCard === String(index) ? "#3898FC" : "#ddd",
											borderRadius: "4px",
											p: 2,
											boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
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
											<Box sx={paymentFailStyles.cardImageContainer}>
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
												sx={{
													borderRadius: "4px",
													background: "#eaf8dd",
													color: "#2b5b00",
													fontSize: "12px",
													fontWeight: "600",
													padding: "2px 12px",
												}}
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
							<Box
								sx={{
									border: "1px dashed rgba(56, 152, 252, 1)",
									borderRadius: "4px",
									width: "24px",
									height: "24px",
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
								}}
							>
								<Image
									src="/add-square.svg"
									alt="add-square"
									height={24}
									width={24}
									onClick={handleAddCard}
								/>
							</Box>
							<Typography sx={{ color: "#3898FC" }}>Add New Card</Typography>
						</Box>
						<Typography className="third-sub-title" sx={{ color: "#787878" }}>
							*Successful payment will automatically reactivate your account
							within 2 minutes
						</Typography>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}></Box>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 3 }}>
					<CustomButton
						variant="contained"
						onClick={handlePay}
						sx={{ padding: "10px 48px" }}
						disabled={selectedCard === ""}
					>
						Pay
					</CustomButton>
				</DialogActions>
			</Dialog>

			<Elements stripe={stripePromise}>
				<AddCardPopup
					title="Add Card"
					confirmButtonName="Pay"
					open={openAddCard}
					confirmButtonSx={{ p: "10px 48px" }}
					onClose={handleCloseAddCard}
					onSuccess={handleCheckoutSuccess}
				/>
			</Elements>
		</>
	);
};

export default PaymentFail;
