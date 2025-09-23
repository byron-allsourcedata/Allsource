"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Divider } from "@mui/material";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { SendInvoicePopup } from "./Billing/SendInvoice";
import { BillingHistory } from "./Billing/BillingHistory";
import { UsageItem } from "./Billing/UsageItem";
import PaymentFail from "./Billing/PaymentFail";
import { BillingDetails } from "./Billing/BillingDetails";
import { BillingCards } from "./Billing/BillingCards";
import { useSearchParams } from "next/navigation";
import { billingStyles } from "./Billing/billingStyles";
import { CardDetails, BillingDetailsInterface } from "./Billing/types";
import { useBillingContext } from "@/context/BillingContext";

export const SettingsBilling: React.FC<{}> = ({}) => {
	const [contactsCollected, setContactsCollected] = useState(0);
	const [planContactsCollected, setPlanContactsCollected] = useState(0);
	const [validationFundsCollected, setValidationFundsData] = useState(0);
	const [smartAudienceCollected, setSmartAudienceCollected] = useState(0);
	const [moneyContactsOverage, setMoneyContactsOverage] = useState("");
	const [planPremiumSourceCollected, setPlanPremiumSourceCollected] =
		useState(0);
	const [premiumSourceCollected, setPremiumSourceCollected] = useState(0);
	const [planSmartAudienceCollected, setPlanSmartAudienceCollected] =
		useState(0);
	const [validationLimitFundsCollected, setValidationFundsLimitedData] =
		useState(0);
	const [cardDetails, setCardDetails] = useState<CardDetails[]>([]);
	const [billingDetails, setBillingDetails] =
		useState<BillingDetailsInterface | null>(null);
	const [checked, setChecked] = useState(false);
	const [selectedInvoiceId, setselectedInvoiceId] = useState<string | null>();
	const [canceled_at, setCanceled_at] = useState<string | null>();
	const [sendInvoicePopupOpen, setSendInvoicePopupOpen] = useState(false);
	const [isAvailableSmartAudience, setIsAvailableSmartAudience] =
		useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [hide, setHide] = useState(false);

	const [paymentFailed, setPaymentFailed] = useState(false);
	const searchParams = useSearchParams();
	const paymentFailedSearch = searchParams.get("payment_failed");
	const { needsSync } = useBillingContext();

	const fetchCardData = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get("/settings/billing");
			if (response.data.status == "hide") {
				setHide(true);
			} else {
				setCardDetails([...response.data.card_details]);
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
	}, [needsSync]);

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

	return (
		<>
			<Box sx={{ pr: 2, pt: 1, pb: 5 }}>
				{isLoading && <CustomizedProgressBar />}
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
						<BillingCards
							cardDetails={cardDetails}
							setIsLoading={setIsLoading}
							handleCheckoutSuccess={handleCheckoutSuccess}
							setCardDetails={setCardDetails}
							hide={hide}
						/>
					</Box>

					<Box sx={{ gridArea: "usage", padding: "0px" }}>
						<Box sx={billingStyles.usageWrapper}>
							<Box sx={billingStyles.usageTitle}>
								<Typography className="first-sub-title">Usages</Typography>
							</Box>
							<Box sx={billingStyles.usageBody}>
								{!hide && (
									<>
										<UsageItem
											loading={isLoading}
											handleCheckoutSuccess={handleCheckoutSuccess}
											cardDetails={cardDetails}
											title="Contacts Downloaded"
											limitValue={
												contactsCollected > planContactsCollected &&
												moneyContactsOverage === "0"
													? contactsCollected
													: planContactsCollected
											}
											currentValue={contactsCollected}
											needButton={false}
											moneyContactsOverage={moneyContactsOverage}
										/>

										<UsageItem
											loading={isLoading}
											handleCheckoutSuccess={handleCheckoutSuccess}
											cardDetails={cardDetails}
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
						<Box sx={billingStyles.usageWrapper}>
							<Box sx={billingStyles.usageTitle}>
								<Typography className="first-sub-title">Funds</Typography>
							</Box>
							<Box sx={billingStyles.usageBody}>
								{!hide && (
									<>
										<UsageItem
											loading={isLoading}
											handleCheckoutSuccess={handleCheckoutSuccess}
											cardDetails={cardDetails}
											title="Validation funds"
											limitValue={
												validationFundsCollected > validationLimitFundsCollected
													? validationFundsCollected
													: validationLimitFundsCollected
											}
											currentValue={validationFundsCollected}
										/>
										<UsageItem
											loading={isLoading}
											handleCheckoutSuccess={handleCheckoutSuccess}
											cardDetails={cardDetails}
											title="Premium Data funds"
											limitValue={
												premiumSourceCollected > planPremiumSourceCollected
													? premiumSourceCollected
													: planPremiumSourceCollected
											}
											currentValue={premiumSourceCollected}
										/>
									</>
								)}
							</Box>
						</Box>
					</Box>
				</Box>

				<Divider sx={billingStyles.divider} />

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
			</Box>
			<PaymentFail
				open={paymentFailed}
				onClose={() => setPaymentFailed(false)}
				cardDetails={cardDetails}
				moneyContactsOverage={moneyContactsOverage}
				handleCheckoutSuccess={handleCheckoutSuccess}
			/>
		</>
	);
};
