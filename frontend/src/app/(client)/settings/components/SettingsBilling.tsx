"use client";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
	Box,
	Typography,
	Button,
	Grid,
	IconButton,
	Divider,
	Popover,
} from "@mui/material";
import dayjs from "dayjs";
import Image from "next/image";
import { Elements } from "@stripe/react-stripe-js";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CheckoutForm from "@/components/CheckoutForm";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axios from "axios";
import CustomTooltip from "@/components/customToolTip";
import { MoreVert } from "@mui/icons-material";
import { SendInvoicePopup } from "./Billing/SendInvoice";
import { RemoveCardPopup } from "./Billing/RemoveCard";
import { BillingHistory } from "./Billing/BillingHistory";
import { UsageItem } from "./Billing/UsageItem";
import { billingStyles } from "./Billing/billingStyles";
import AddCardPopup from "./Billing/AddCard";
import PaymentFail from "./Billing/PaymentFail";
import { BillingDetails } from "./Billing/BillingDetails";
import { useSearchParams } from "next/navigation";

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unionpay";

interface CardDetails {
	id: string;
	brand: string;
	last4: string;
	exp_month: number;
	exp_year: number;
	is_default: boolean;
}

interface SubscriptionDetails {
	active: { detail_type: string; value: boolean };
	billing_cycle: {
		detail_type: string;
		plan_start: string | null;
		plan_end: string | null;
	};
	contacts_downloads: {
		detail_type: string;
		limit_value: number;
		current_value: number;
	};
	next_billing_date: { detail_type: string; value: string };
	plan_name: { detail_type: string; value: string };
	yearly_total?: { detail_type: string; value: string };
	monthly_total?: { detail_type: string; value: string };
	domains: { detail_type: string; current_value: number; limit_value: number };
	validation_funds: {
		detail_type: string;
		current_value: number;
		limit_value: number;
	};
	premium_sources_funds: string;
	smart_audience: {
		detail_type: string;
		current_value: number;
		limit_value: number;
	};
}

interface BillingDetails {
	subscription_details: SubscriptionDetails;
	downgrade_plan: { downgrade_at: string | null; plan_name: string | null };
	is_leads_auto_charging: boolean;
	canceled_at: string;
	active?: boolean;
}

const cardBrandImages: Record<CardBrand, string> = {
	visa: "/visa-icon.svg",
	mastercard: "/mastercard-icon.svg",
	amex: "/american-express.svg",
	discover: "/discover-icon.svg",
	unionpay: "/unionpay-icon.svg",
};

export const SettingsBilling: React.FC<{}> = ({}) => {
	const [contactsCollected, setContactsCollected] = useState(0);
	const [planContactsCollected, setPlanContactsCollected] = useState(0);
	const [validationFundsCollected, setValidationFundsData] = useState(0);
	const [smartAudienceCollected, setSmartAudienceCollected] = useState(0);
	const [moneyContactsOverage, setMoneyContactsOverage] = useState(0);
	const [planPremiumSourceCollected, setPlanPremiumSourceCollected] =
		useState(0);
	const [premiumSourceCollected, setPremiumSourceCollected] = useState(0);
	const [planSmartAudienceCollected, setPlanSmartAudienceCollected] =
		useState(0);
	const [validationLimitFundsCollected, setValidationFundsLimitedData] =
		useState(0);
	const [cardDetails, setCardDetails] = useState<CardDetails[]>([]);
	const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(
		null,
	);
	const [checked, setChecked] = useState(false);
	const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const [selectedCardId, setSelectedCardId] = useState<string | null>();
	const [selectedInvoiceId, setselectedInvoiceId] = useState<string | null>();
	const [removePopupOpen, setRemovePopupOpen] = useState(false);
	const [canceled_at, setCanceled_at] = useState<string | null>();
	const [sendInvoicePopupOpen, setSendInvoicePopupOpen] = useState(false);
	const [isAvailableSmartAudience, setIsAvailableSmartAudience] =
		useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const stripePromise = loadStripe(
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
	);
	const [open, setOpen] = useState(false);
	const [hide, setHide] = useState(false);

	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);
	const [paymentFailed, setPaymentFailed] = useState(false);
	const searchParams = useSearchParams();
	const paymentFailedSearch = searchParams.get("payment_failed");

	const fetchCardData = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get("/settings/billing");
			if (response.data.status == "hide") {
				setHide(true);
			} else {
				setCardDetails([...response.data.card_details]);
				console.log(response.data);
				setContactsCollected(response.data.usages_credits.leads_credits);
				setMoneyContactsOverage(
					response.data.usages_credits.money_because_of_overage,
				);
				setPlanContactsCollected(
					response.data.usages_credits.plan_leads_credits,
				);
				setValidationFundsData(response.data.usages_credits.validation_funds);
				setPremiumSourceCollected(
					response.data.usages_credits.premium_source_credits,
				);
				setSmartAudienceCollected(
					response.data.usages_credits.smart_audience_quota.value,
				);
				setIsAvailableSmartAudience(
					response.data.usages_credits.smart_audience_quota.available,
				);
				setValidationFundsLimitedData(
					response.data.usages_credits.validation_funds_limit,
				);
				setPlanPremiumSourceCollected(
					response.data.usages_credits.plan_premium_source_collected,
				);
				setPlanSmartAudienceCollected(
					response.data.usages_credits.plan_smart_audience_collected,
				);
			}
			setChecked(response.data.billing_details.is_leads_auto_charging);
			setBillingDetails(response.data.billing_details.subscription_details);
			setCanceled_at(response.data.billing_details.canceled_at);
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (paymentFailedSearch) {
			setPaymentFailed(true);
		}
	}, []);

	useEffect(() => {
		fetchCardData();
	}, []);

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

	const handleRemovePopupClose = () => {
		setRemovePopupOpen(false);
	};

	const handleSendInvoicePopupOpen = (invoice_id: string) => {
		setselectedInvoiceId(invoice_id);
		setSendInvoicePopupOpen(true);
	};

	const handleSendInvoicePopupClose = () => {
		setSendInvoicePopupOpen(false);
		setselectedInvoiceId(null);
	};

	const handleCheckoutSuccess = (data: CardDetails) => {
		setCardDetails((prevDetails) =>
			data.is_default
				? prevDetails
						.map((card) => ({
							...card,
							is_default: false,
						}))
						.concat(data)
				: [...prevDetails, data],
		);
	};

	const deleteOpen = Boolean(deleteAnchorEl);
	const deleteId = deleteOpen ? "delete-popover" : undefined;

	if (isLoading) {
		return <CustomizedProgressBar />;
	}

	return (
		<>
			<Box sx={{ pr: 2, pt: 1 }}>
				<Box
					sx={{
						display: "grid",
						gap: 3,
						gridTemplateColumns: "2fr 1fr",
						gridTemplateAreas: `"cards usage"
				"details usage"
				"details funds"`,
						"@media (max-width: 900px)": {
							gridTemplateColumns: "1fr",
							gridTemplateAreas: `
						"cards"
						"usage"
						"details"
						"funds"
					`,
						},
						mb: 3,
					}}
				>
					<Box sx={{ gridArea: "cards", height: "auto", padding: "0px" }}>
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
									<Box
										sx={{ display: "flex", alignItems: "center", gap: "8px" }}
									>
										<Typography className="first-sub-title">
											Card Details
										</Typography>
										<CustomTooltip
											title={
												"View detailed information about your card, including balance, transactions, and expiration date."
											}
											linkText="Learn more"
											linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/card-details"
										/>
									</Box>
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
															onClick={(event) =>
																handleClickOpen(event, card.id)
															}
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
						</Box>
					</Box>

					<Box sx={{ gridArea: "usage", padding: "0px" }}>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								borderRadius: "4px",
								border: "1px solid #f0f0f0",
								boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
								p: 3,
							}}
						>
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "start",
									mb: 4,
								}}
							>
								<Typography className="first-sub-title">Usages</Typography>
							</Box>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
									gap: 4,
									"@media (max-width: 600px)": {
										gap: 3,
										flexDirection: "column",
										alignItems: "center",
									},
								}}
							>
								{!hide && (
									<>
										<UsageItem
											title="Contacts Downloaded"
											limitValue={
												contactsCollected > planContactsCollected &&
												moneyContactsOverage === 0
													? contactsCollected
													: planContactsCollected
											}
											currentValue={contactsCollected}
											needButton={false}
											moneyContactsOverage={moneyContactsOverage}
										/>
										<UsageItem
											title="Smart Audience"
											limitValue={
												smartAudienceCollected > planSmartAudienceCollected
													? smartAudienceCollected
													: planSmartAudienceCollected
											}
											currentValue={smartAudienceCollected}
											available={isAvailableSmartAudience}
											needButton={false}
										/>
									</>
								)}
							</Box>
						</Box>
					</Box>

					<Box sx={{ gridArea: "details", padding: "0px" }}>
						<BillingDetails
							billingDetails={billingDetails}
							canceledAt={canceled_at || ""}
						/>
					</Box>

					<Box sx={{ gridArea: "funds", padding: "0px" }}>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								borderRadius: "4px",
								border: "1px solid #f0f0f0",
								boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
								p: 3,
							}}
						>
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "start",
									mb: 4,
								}}
							>
								<Typography className="first-sub-title">Funds</Typography>
							</Box>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
									gap: 4,
									"@media (max-width: 600px)": {
										gap: 3,
										flexDirection: "column",
										alignItems: "center",
									},
								}}
							>
								{!hide && (
									<>
										<UsageItem
											title="Validation funds"
											limitValue={
												validationFundsCollected > validationLimitFundsCollected
													? validationFundsCollected
													: validationLimitFundsCollected
											}
											currentValue={validationFundsCollected}
										/>
										<UsageItem
											title="Premium Source funds"
											limitValue={
												premiumSourceCollected > planPremiumSourceCollected
													? premiumSourceCollected
													: planPremiumSourceCollected
											}
											currentValue={premiumSourceCollected}
											commingSoon={true}
										/>
									</>
								)}
							</Box>
						</Box>
					</Box>
				</Box>

				<Divider
					sx={{
						borderColor: "#e4e4e4",
						maxWidth: "100%",
						"@media (max-width: 600px)": {
							marginLeft: "-16px",
							marginRight: "-16px",
						},
					}}
				/>

				<BillingHistory
					setIsLoading={setIsLoading}
					handleSendInvoicePopupOpen={handleSendInvoicePopupOpen}
				/>

				<SendInvoicePopup
					sendInvoicePopupOpen={sendInvoicePopupOpen}
					handleSendInvoicePopupClose={handleSendInvoicePopupClose}
					setIsLoading={setIsLoading}
					selectedInvoiceId={selectedInvoiceId ?? ""}
				/>

				<RemoveCardPopup
					removePopupOpen={removePopupOpen}
					setIsLoading={setIsLoading}
					handleRemovePopupClose={handleRemovePopupClose}
					selectedCardId={selectedCardId ?? ""}
					setCardDetails={setCardDetails}
				/>
			</Box>
			<PaymentFail
				open={paymentFailed}
				cardDetails={cardDetails}
				handleCheckoutSuccess={handleCheckoutSuccess}
			/>
		</>
	);
};
