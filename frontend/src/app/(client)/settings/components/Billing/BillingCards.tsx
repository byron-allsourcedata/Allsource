"use client";
import React, { useState } from "react";
import {
	Box,
	Typography,
	Grid,
	IconButton,
	Popover,
	Button,
} from "@mui/material";
import { MoreVert } from "@/icon";
import { loadStripe } from "@stripe/stripe-js";
import CustomTooltip from "@/components/customToolTip";
import Image from "next/image";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { Elements } from "@stripe/react-stripe-js";
import AddCardPopup from "./AddCard";
import { billingStyles } from "./billingStyles";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import axios from "axios";
import { RemoveCardPopup } from "./RemoveCard";
import { CardDetails, CardBrand } from "./types";

const cardBrandImages: Record<CardBrand, string> = {
	visa: "/visa-icon.svg",
	mastercard: "/mastercard-icon.svg",
	amex: "/american-express.svg",
	discover: "/discover-icon.svg",
	unionpay: "/unionpay-icon.svg",
};

interface BillingCardsProps {
	cardDetails: CardDetails[];
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
	handleCheckoutSuccess: (data: CardDetails) => void;
	setCardDetails: React.Dispatch<React.SetStateAction<CardDetails[]>>;
	hide: boolean;
}

export const BillingCards: React.FC<BillingCardsProps> = ({
	setIsLoading,
	cardDetails,
	handleCheckoutSuccess,
	hide,
	setCardDetails,
}) => {
	const [open, setOpen] = useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);
	const [removePopupOpen, setRemovePopupOpen] = useState(false);
	const [selectedCardId, setSelectedCardId] = useState<string | null>();

	const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const stripePromise = loadStripe(
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
	);
	const deleteOpen = Boolean(deleteAnchorEl);
	const deleteId = deleteOpen ? "delete-popover" : undefined;

	const handleClickOpen = (
		event: React.MouseEvent<HTMLElement>,
		id: string,
	) => {
		setDeleteAnchorEl(event.currentTarget);
		setSelectedCardId(id);
	};

	const handleDeleteClose = () => {
		setDeleteAnchorEl(null);
	};

	const handleRemovePopupOpen = () => {
		const cardToRemove = cardDetails.find((card) => card.id === selectedCardId);

		if (cardToRemove) {
			if (cardToRemove.is_default) {
				showErrorToast("Cannot delete default card");
				return;
			}
		}

		setRemovePopupOpen(true);
		setDeleteAnchorEl(null);
	};

	const handleRemovePopupClose = () => {
		setRemovePopupOpen(false);
	};

	const handleSetDefault = async () => {
		const cardToRemove = cardDetails.find((card) => card.id === selectedCardId);

		if (cardToRemove) {
			if (cardToRemove.is_default) {
				showErrorToast("The bank card is already default");
				return;
			}
		}
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.put(
				"/settings/billing/default-card",
				{ payment_method_id: selectedCardId },
			);

			if (response.status === 200) {
				switch (response.data.status) {
					case "SUCCESS":
						showToast("Set default card successfully");
						setCardDetails((prevCardDetails) =>
							prevCardDetails.map((card) => {
								if (card.id === selectedCardId) {
									return { ...card, is_default: true };
								} else {
									return { ...card, is_default: false };
								}
							}),
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
			handleDeleteClose();
			setSelectedCardId(null);
		}
	};

	return (
		<Box
			sx={{
				border: "1px solid #f0f0f0",
				borderRadius: "4px",
				boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
				p: 3,
				height: "100%",
			}}
		>
			{!hide && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						pb: 2,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<Typography className="first-sub-title">Card Details</Typography>
						<CustomTooltip
							title={
								"View detailed information about your card, including balance, transactions, and expiration date."
							}
							linkText="Learn more"
							linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/card-details"
						/>
					</Box>
					<Box sx={billingStyles.squareImg}>
						<Image
							onClick={handleOpen}
							src="/add-square.svg"
							alt="add-square"
							height={24}
							width={24}
							style={{ cursor: "pointer" }}
						/>
					</Box>
				</Box>
			)}

			<Grid container spacing={2}>
				{cardDetails.length > 0 &&
					cardDetails.map((card) => (
						<Grid item xs={12} md={6} key={card.id}>
							<Box
								key={card.id}
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 2,
									"@media (max-width: 600px)": {
										alignItems: "flex-end",
									},
								}}
							>
								<Box sx={{ display: "flex", gap: 2 }}>
									<Box
										sx={{
											width: "62px",
											height: "62px",
											borderRadius: "4px",
											border: "1px solid #f0f0f0",
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
										}}
									>
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
									<Box
										sx={{
											display: "flex",
											flexDirection: "column",
											gap: "8px",
											justifyContent: "center",
										}}
									>
										<Box sx={{ display: "flex", gap: 1 }}>
											<Typography
												className="first-sub-title"
												sx={{
													"@media (max-width: 600px)": {
														fontSize: "12px !important",
													},
												}}
											>
												{`${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} (**** ${card.last4})`}
											</Typography>
											{card.is_default && (
												<Typography
													className="main-text"
													sx={billingStyles.defaultLabel}
												>
													Default
												</Typography>
											)}
										</Box>
										<Typography
											className="second-text"
											sx={{
												fontSize: "12px",
												fontWeight: "400",
												lineHeight: "normal",
												color: "#787878",
												letterSpacing: "0.06px",
											}}
										>
											Expire date:{" "}
											{`${card.exp_month < 10 ? "0" : ""}${card.exp_month}/${card.exp_year}`}
										</Typography>
									</Box>
								</Box>
								<Box>
									{!card.is_default && (
										<IconButton
											onClick={(event) => handleClickOpen(event, card.id)}
										>
											<MoreVert
												sx={{
													color: "rgba(32, 33, 36, 1)",
												}}
											/>
										</IconButton>
									)}
									<Popover
										id={deleteId}
										open={deleteOpen}
										anchorEl={deleteAnchorEl}
										onClose={handleDeleteClose}
										anchorOrigin={{
											vertical: "bottom",
											horizontal: "center",
										}}
										transformOrigin={{
											vertical: "top",
											horizontal: "right",
										}}
										slotProps={{
											paper: {
												sx: {
													boxShadow: 0,
													borderRadius: "4px",
													border: "0.5px solid rgba(175, 175, 175, 1)",
												},
											},
										}}
									>
										<Box
											sx={{
												minWidth: "140px",
											}}
										>
											<Box sx={{ my: 1.5 }}>
												<Button
													className="hyperlink-red"
													onClick={handleRemovePopupOpen}
													sx={billingStyles.buttonInPopover}
												>
													Remove
												</Button>
												<Button
													className="hyperlink-red"
													onClick={handleSetDefault}
													sx={billingStyles.buttonInPopover}
												>
													Set as default
												</Button>
											</Box>
										</Box>
									</Popover>
								</Box>
							</Box>
						</Grid>
					))}
			</Grid>

			<Elements stripe={stripePromise}>
				<AddCardPopup
					title="Add Card"
					open={open}
					onClose={handleClose}
					onSuccess={handleCheckoutSuccess}
				/>
			</Elements>

			<RemoveCardPopup
				removePopupOpen={removePopupOpen}
				setIsLoading={setIsLoading}
				handleRemovePopupClose={handleRemovePopupClose}
				selectedCardId={selectedCardId ?? ""}
				setCardDetails={setCardDetails}
			/>
		</Box>
	);
};
