"use client";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
	Box,
	Typography,
	Button,
	Modal,
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
import DateRangeIcon from "@mui/icons-material/DateRange";
import PaymentIcon from "@mui/icons-material/Payment";
import { SendInvoicePopup } from "./Billing/SendInvoice";
import { RemoveCardPopup } from "./Billing/RemoveCard";
import { BillingHistory } from "./Billing/BillingHistory";
import { UsageItem } from "./Billing/UsageItem";
import { billingStyles } from "./Billing/billingStyles";
import AddCardPopup from "./Billing/AddCard"

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
	billing_cycle: { detail_type: string; plan_start: string; plan_end: string };
	contacts_downloads: { detail_type: string; value: string };
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
	smart_audience: string;
}

interface BillingDetails {
	subscription_details: SubscriptionDetails;
	downgrade_plan: { downgrade_at: string | null; plan_name: string | null };
	is_leads_auto_charging: boolean;
	canceled_at: any;
	active?: boolean;
}

const cardBrandImages: Record<CardBrand, string> = {
	visa: "/visa-icon.svg",
	mastercard: "/mastercard-icon.svg",
	amex: "/american-express.svg",
	discover: "/discover-icon.svg",
	unionpay: "/unionpay-icon.svg",
};

export const SettingsBilling: React.FC = () => {
	const [contactsCollected, setContactsCollected] = useState(0);
	const [planContactsCollected, setPlanContactsCollected] = useState(0);
	const [validationFundsCollected, setValidationFundsData] = useState(0);
	const [smartAudienceCollected, setSmartAudienceCollected] = useState(0);
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
	const [downgrade_plan, setDowngrade_plan] = useState<any | null>();
	const [canceled_at, setCanceled_at] = useState<string | null>();
	const [sendInvoicePopupOpen, setSendInvoicePopupOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const stripePromise = loadStripe(
		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
	);
	const [open, setOpen] = useState(false);
	const [hide, setHide] = useState(false);

	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const fetchCardData = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get("/settings/billing");
			console.log(response.data);
			if (response.data.status == "hide") {
				setHide(true);
			} else {
				setCardDetails([...response.data.card_details]);
				setContactsCollected(response.data.usages_credits.leads_credits);
				setPlanContactsCollected(
					response.data.usages_credits.plan_leads_credits,
				);
				setValidationFundsData(response.data.usages_credits.validation_funds);
				setPremiumSourceCollected(
					response.data.usages_credits.premium_source_credits,
				);
				setSmartAudienceCollected(
					response.data.usages_credits.smart_audience_quota,
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
			setDowngrade_plan(response.data.billing_details.downgrade_plan);
			setCanceled_at(response.data.billing_details.canceled_at);
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCardData();
	}, []);

	const formatKey = (key: string) => {
		return key
			.replace(/_/g, " ")
			.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const renderValue = (value: any) => {
		if (value?.current_value === -1 || value?.limit_value === -1) {
			return "Unlimited";
		}

		switch (value?.detail_type) {
			case "funds":
				return `$${value.current_value?.toLocaleString("en-US")}/$${value.limit_value?.toLocaleString("en-US")}`;
			case "as_is":
				return value.value;
			case "limited":
				return `${value.current_value?.toLocaleString("en-US")}/${value.limit_value?.toLocaleString("en-US")}`;
			case "time":
				return (
					`${dayjs(value.plan_start).format("MMM D, YYYY")}` +
					(value.plan_end
						? ` to ${dayjs(value.plan_end).format("MMM D, YYYY")}`
						: "")
				);

			default:
				return "Coming soon";
		}
	};

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

	const handleBuyCredits = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get(
				`/subscriptions/buy-credits?credits_used=${10}`,
			);
			if (response && response.data.status) {
				showToast(response.data.status);
				if (response.data.status == "Payment success") {
					// setProspectData(prospectData + 10);
				}
			} else if (response.data.link) {
				window.location.href = response.data.link;
			} else {
				showErrorToast("Payment link not found.");
			}
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				showErrorToast(error.message);
			} else if (error instanceof Error) {
				showErrorToast(error.message);
			} else {
				showErrorToast("An unexpected error occurred.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleCheckoutSuccess = (data: any) => {
		setCardDetails((prevDetails) => [...prevDetails, data]);
	};

	const handleRedirectSubscription = () => {
		window.location.href = "/settings?section=subscription";
	};

	const handleCancel = async () => {
		try {
			setIsLoading(false);
			const response = await axiosInterceptorInstance.get(
				`/subscriptions/cancel-downgrade`,
			);
			if (response && response.data) {
				showToast(response.data);
			}
		} catch (error: unknown) {
			if (axios.isAxiosError(error)) {
				showErrorToast(error.message);
			} else if (error instanceof Error) {
				showErrorToast(error.message);
			} else {
				showErrorToast("An unexpected error occurred.");
			}
		} finally {
			setIsLoading(false);
		}
		window.location.reload();
	};

	const deleteOpen = Boolean(deleteAnchorEl);
	const deleteId = deleteOpen ? "delete-popover" : undefined;

	if (isLoading) {
		return <CustomizedProgressBar />;
	}

	return (
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
								<Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
									<Button onClick={handleOpen} sx={{ padding: 2 }}>
										<Image
											src="/add-square.svg"
											alt="add-square"
											height={24}
											width={24}
										/>
									</Button>
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

						<AddCardPopup open={open} onClose={handleClose}/>

						{/* <Modal open={open} onClose={handleClose}>
							<Box
								sx={{
									bgcolor: "white",
									borderRadius: "4px",
									padding: "16px",
									maxWidth: "400px",
									margin: "100px auto",
								}}
							>
								<Elements stripe={stripePromise}>
									<CheckoutForm
										handleClose={handleClose}
										onSuccess={handleCheckoutSuccess}
									/>
								</Elements>
							</Box>
						</Modal> */}
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
										limitValue={planContactsCollected}
										currentValue={contactsCollected}
										needButton={false}
									/>
									<UsageItem
										title="Smart Audience"
										limitValue={planSmartAudienceCollected}
										currentValue={smartAudienceCollected}
										needButton={false}
										commingSoon={true}
									/>
								</>
							)}
						</Box>
					</Box>
				</Box>

				<Box sx={{ gridArea: "details", padding: "0px" }}>
					<Box
						sx={{
							border: "1px solid #f0f0f0",
							borderRadius: "4px",
							boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
							p: 3,
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								pb: 2,
							}}
						>
							<Typography className="first-sub-title">
								Billing Details
							</Typography>
							{billingDetails?.active ? (
								canceled_at ? (
									<Box
										sx={{
											display: "flex",
											borderRadius: "4px",
											background: "#FCDBDC",
											padding: "2px 12px",
											gap: "3px",
											alignItems: "center",
										}}
									>
										<Typography
											className="main-text"
											sx={{
												borderRadius: "4px",
												color: "#4E0110",
												fontSize: "12px",
												fontWeight: "600",
												lineHeight: "16px",
											}}
										>
											Subscription Cancelled
										</Typography>
										<Image
											src={"danger.svg"}
											alt="danger"
											width={14}
											height={13.5}
										/>
									</Box>
								) : downgrade_plan?.plan_name ? (
									<Box
										sx={{
											display: "flex",
											borderRadius: "4px",
											background: "#FDF2CA",
											padding: "2px 12px",
											gap: "3px",
											alignItems: "center",
										}}
									>
										<Typography
											className="main-text"
											sx={{
												borderRadius: "4px",
												color: "#795E00",
												fontSize: "12px",
												fontWeight: "600",
												lineHeight: "16px",
											}}
										>
											Downgrade pending - {downgrade_plan.plan_name}{" "}
											{downgrade_plan.downgrade_at}.{" "}
											<span
												onClick={handleCancel}
												style={{
													color: "blue",
													cursor: "pointer",
												}}
											>
												Cancel
											</span>
										</Typography>
									</Box>
								) : (
									<Box
										sx={{
											display: "flex",
											borderRadius: "4px",
											background: "#eaf8dd",
											padding: "2px 12px",
											gap: "3px",
										}}
									>
										<Typography
											className="main-text"
											sx={{
												borderRadius: "4px",
												color: "#2b5b00",
												fontSize: "12px",
												fontWeight: "600",
												lineHeight: "16px",
											}}
										>
											Active
										</Typography>
									</Box>
								)
							) : (
								<Box
									sx={{
										display: "flex",
										borderRadius: "4px",
										background: "#f8dede",
										padding: "2px 12px",
										gap: "3px",
									}}
								>
									<Typography
										className="main-text"
										sx={{
											borderRadius: "4px",
											color: "#b00000",
											fontSize: "12px",
											fontWeight: "600",
											lineHeight: "16px",
											cursor: "pointer",
										}}
									>
										Subscription Cancelled.{" "}
										<span
											onClick={handleRedirectSubscription}
											style={{
												color: "#146EF6",
												cursor: "pointer",
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.color = "darkblue")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.color = "#146EF6")
											}
										>
											Choose Plan
										</span>
									</Typography>
								</Box>
							)}
						</Box>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<Grid container spacing={2}>
								{billingDetails &&
									Object.entries(billingDetails).map(([key, value], index) => {
										if (key === "next_billing_date" && value) {
											return (
												<Grid
													item
													xs={12}
													key={index}
													sx={{
														display: "flex",
														alignItems: "center",
														gap: "16px",
														"@media (max-width: 600px)": {
															gap: "12px",
														},
													}}
												>
													{/* Next Billing Date */}
													<Grid item xs={5.95} md={5.95}>
														<Box
															sx={{
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																background: "#fafaf6",
																borderRadius: "4px",
																margin: "0 5%",
																border: "1px solid #F0F0F0",
																padding: "8px 16px",
																gap: "16px",
																"@media (max-width: 600px)": {
																	padding: "8px 10px",
																	gap: "8px",
																},
															}}
														>
															<DateRangeIcon />
															<Box>
																<Typography
																	className="main-text"
																	sx={{
																		fontSize: "12px",
																		fontWeight: "600",
																		lineHeight: "16px",
																		color: "#4a4a4a",
																	}}
																>
																	{canceled_at
																		? `Cancellation Date`
																		: "Next Billing Date"}
																</Typography>
																<Typography
																	className="first-sub-title"
																	sx={{
																		"@media (max-width: 600px)": {
																			fontSize: "12px !important",
																		},
																	}}
																>
																	On {renderValue(value)}
																</Typography>
															</Box>
														</Box>
													</Grid>

													{/* Divider */}
													<Grid item xs={0.01} md={0.01}>
														<Divider
															orientation="vertical"
															flexItem
															sx={{ height: "32px", alignSelf: "center" }}
														/>
													</Grid>

													{/* Monthly Total - find it in the next iteration */}
													<Grid item xs={5.95} md={5.95}>
														{billingDetails &&
															typeof billingDetails === "object" &&
															Object.entries(billingDetails).map(
																([nextKey, nextValue], nextIndex) => {
																	if (
																		(nextValue &&
																			nextKey === "monthly_total") ||
																		nextKey === "yearly_total"
																	) {
																		return (
																			<Box
																				key={nextIndex}
																				sx={{
																					display: "flex",
																					justifyContent: "center",
																					gap: "16px",
																					alignItems: "center",
																					margin: "0 5%",
																					border: "1px solid #F0F0F0",
																					padding: "8px 16px",
																				}}
																			>
																				<PaymentIcon />
																				<Box>
																					<Typography
																						className="main-text"
																						sx={{
																							fontSize: "12px",
																							fontWeight: "600",
																							lineHeight: "16px",
																							color: "#4a4a4a",
																						}}
																					>
																						{nextKey === "monthly_total" &&
																							"Monthly Total"}
																						{nextKey === "yearly_total" &&
																							"Yearly Total"}
																					</Typography>
																					<Typography className="first-sub-title">
																						{renderValue(nextValue)}
																					</Typography>
																				</Box>
																			</Box>
																		);
																	}
																	return null;
																},
															)}
													</Grid>
												</Grid>
											);
										}

										// Skip rendering 'Monthly Total' in its own row, since it's already handled
										if (
											key === "monthly_total" ||
											key === "active" ||
											key === "yearly_total"
										) {
											return null;
										}

										// Default layout for other billing details
										return (
											<Grid
												item
												xs={12}
												md={key === "billing_cycle" ? 12 : 6}
												key={index}
												sx={{
													display: "flex",
													flexDirection: "row",
													gap: "26px",
													"@media (max-width: 600px)": {
														gap: "12px",
													},
												}}
											>
												<Typography
													className="first-sub-title"
													sx={{
														width: "140px",
														fontSize: "12px !important",
														lineHeight: "16px !important",
														"@media (max-width: 600px)": {
															width: "110px",
														},
													}}
												>
													{formatKey(key)}
												</Typography>
												<Typography
													className="paragraph"
													sx={{
														lineHeight: "16px !important",
														color: "#5f6368 !important",
													}}
												>
													{renderValue(value)}
												</Typography>
											</Grid>
										);
									})}
							</Grid>
						</Box>
					</Box>
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
										limitValue={validationLimitFundsCollected}
										currentValue={validationFundsCollected}
									/>
									<UsageItem
										title="Premium Source funds"
										limitValue={planPremiumSourceCollected}
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
	);
};
