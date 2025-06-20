"use client";
import React from "react";
import { Box, Typography, Grid, Divider } from "@mui/material";
import DateRangeIcon from "@mui/icons-material/DateRange";
import PaymentIcon from "@mui/icons-material/Payment";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

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

interface BillingDetailsProps {
	billingDetails: BillingDetails | null;
	canceledAt: string;
}

export const BillingDetails: React.FC<BillingDetailsProps> = ({
	canceledAt,
	billingDetails,
}) => {
	const router = useRouter();

	const printBillingCycle = (
		planStart: string | null,
		planEnd: string | null,
	) => {
		if (planStart && planEnd) {
			return (
				`${dayjs(planStart).format("MMM D, YYYY")}` +
				` to ${dayjs(planEnd).format("MMM D, YYYY")}`
			);
		} else if (planEnd) {
			return `N/A` + ` to ${dayjs(planEnd).format("MMM D, YYYY")}`;
		} else {
			return "Unlimited";
		}
	};

	const printNextBillingDate = (billinDate: string | null) => {
		if (billinDate) {
			return `On ${billinDate}`;
		}
		return "Unlimited";
	};

	const renderValue = (value: any) => {
		if (
			value?.current_value === -1 ||
			value?.limit_value === -1 ||
			value?.limit_value === null ||
			value?.current_value === null
		) {
			return "Unlimited";
		}

		const { limit_value, current_value } = value;
		const limit = current_value > limit_value ? current_value : limit_value;

		switch (value?.detail_type) {
			case "funds":
				return `$${value.current_value?.toLocaleString("en-US")}/$${limit?.toLocaleString("en-US")}`;
			case "as_is":
				return value.value;
			case "limited":
				return `${value.current_value?.toLocaleString("en-US")}/${limit?.toLocaleString("en-US")}`;
			case "billing_cycle":
				return printBillingCycle(value.plan_start, value.plan_end);
			case "next_billing_date":
				return printNextBillingDate(value.value);
			default:
				return "Coming soon";
		}
	};

	const formatKey = (key: string) => {
		return key
			.replace(/_/g, " ")
			.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const handleRedirectSubscription = () => {
		router.push("/settings?section=subscription");
	};

	return (
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
				<Typography className="first-sub-title">Billing Details</Typography>
				{billingDetails?.active && (
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
				)}

				{canceledAt && (
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
								onMouseEnter={(e) => (e.currentTarget.style.color = "darkblue")}
								onMouseLeave={(e) => (e.currentTarget.style.color = "#146EF6")}
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
														{canceledAt
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
														{renderValue(value)}
													</Typography>
												</Box>
											</Box>
										</Grid>

										<Grid item xs={0.01} md={0.01}>
											<Divider
												orientation="vertical"
												flexItem
												sx={{ height: "32px", alignSelf: "center" }}
											/>
										</Grid>

										<Grid item xs={5.95} md={5.95}>
											{billingDetails &&
												Object.entries(billingDetails).map(
													([nextKey, nextValue], nextIndex) => {
														if (
															(nextValue && nextKey === "monthly_total") ||
															(nextValue && nextKey === "yearly_total")
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

							if (
								key === "monthly_total" ||
								key === "active" ||
								key === "yearly_total"
							) {
								return null;
							}

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
	);
};
