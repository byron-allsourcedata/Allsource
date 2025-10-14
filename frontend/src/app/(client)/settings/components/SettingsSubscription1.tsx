"use client";
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Button, Tabs, Tab } from "@mui/material";
import { PlanCard } from "./PlanCard";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "../../../../axios/axiosInterceptorInstance";
import { usePlans, type Plan } from "./plans";
import { fetchUserData } from "@/services/meService";
import { BookACallPopup } from "../../components/BookACallPopup";

import { AddRounded } from "@mui/icons-material";
import { ExcitingOfferOnlyForYou } from "./Subscription/ExcitingOfferOnlyForYou";
import { UnsubscribeTeamsPlan } from "./Subscription/UnsubscribeTeamsPlan";
import { CustomPlan } from "./Subscription/CustomPlan";
import { PricingTable, type PlanNew } from "./Subscription/PricingTable";

const subscriptionStyles = {
	title: {
		whiteSpace: "nowrap",
		textAlign: "start",
		lineHeight: "22px",
		margin: 0,
	},
	formContainer: {
		display: "flex",
		gap: 3,
		justifyContent: "space-between",
		width: "100%",
		height: "610px",
		alignItems: "center",
		"@media (max-width: 900px)": {
			flexDirection: "column",
			marginTop: "24px",
		},
	},
	formWrapper: {
		display: "flex",
		pt: 1,
		height: "100%",
		justifyContent: "center",
		"@media (min-width: 901px)": {
			width: "100%",
		},
	},
	plantabHeading: {
		padding: "10px 32px",
		color: "rgba(32, 33, 36, 1)",
		textTransform: "none",
		fontWeight: "400 !important",
		"&.Mui-selected": {
			background: "rgba(56, 152, 252, 1)",
			color: "#fff",
			border: "none",
			"& .active-text-color": {
				color: "#fff",
			},
			"& .active-save-color": {
				background: "#fff",
			},
		},
		"@media (max-width: 600px)": {
			paddingLeft: "22px",
			paddingRight: "22px",
			fontSize: "18px !important",
			width: "50%",
		},
	},
	saveHeading: {
		background: "rgba(235, 245, 255, 1)",
		padding: "5px 12px",
		borderRadius: "4px",
		fontSize: "14px !important",
		color: "#202124 !important",
	},
	inputLabel: {
		top: "-3px",
		"&.Mui-focused": {
			top: 0,
			color: "rgba(17, 17, 19, 0.6)",
			fontFamily: "var(--font-nunito)",
			fontWeight: 400,
			fontSize: "12px",
			lineHeight: "16px",
		},
	},
};

export const SettingsSubscription1: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [plansMonthly, setPlansMonthly] = useState<Plan[]>([]);
	const [plansYearly, setPlansYearly] = useState<Plan[]>([]);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [customPlanPopupOpen, setCustomPlanPopupOpen] = useState(false);
	const [cancelSubscriptionPlanPopupOpen, setCancelSubscriptionPlanPopupOpen] =
		useState(false);
	const [excitingOfferPopupOpen, setExcitingOfferPopupOpen] = useState(false);
	const [confirmCancellationPopupOpen, setConfirmCancellationPopupOpen] =
		useState(false);
	const [isTrial, setIsTrial] = useState<boolean | null>(null);
	const [popupOpen, setPopupOpen] = useState(false);

	const [normalPlans, partnerPlans] = usePlans(
		tabValue === 0 ? "month" : "year",
	);

	const handleOpenPopup = () => {
		setPopupOpen(true);
	};
	const sourcePlatform = useMemo(() => {
		if (typeof window !== "undefined") {
			const savedMe = sessionStorage.getItem("me");
			if (savedMe) {
				try {
					const parsed = JSON.parse(savedMe);
					return parsed.source_platform || "";
				} catch (error) {}
			}
		}
		return "";
	}, [typeof window !== "undefined" ? sessionStorage.getItem("me") : null]);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);

		const period = newValue === 0 ? "month" : "year";
		if (period === "month") {
			setPlans(plansMonthly);
		} else {
			setPlans(plansYearly);
		}
	};

	const handleCustomPlanPopupOpen = () => {
		setCustomPlanPopupOpen(true);
	};

	const handleCancelSubscriptionPlanPopupClose = () => {
		setCancelSubscriptionPlanPopupOpen(false);
	};

	const handleExcitingOfferPopupClose = () => {
		setExcitingOfferPopupOpen(false);
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const response = await axiosInterceptorInstance.get("/settings/plans");
				setPlansMonthly(response.data.monthly);
				setPlansYearly(response.data.yearly);
				if (tabValue === 0) {
					setPlans(response.data.monthly);
				} else {
					setPlans(response.data.yearly);
				}
			} catch (error) {
			} finally {
				setIsLoading(false);
			}
		};

		const loadUser = async () => {
			const userData = await fetchUserData();
			if (userData) {
				setIsTrial(!!userData.is_trial_pending);
			}
		};

		loadUser();
		fetchData();
	}, []);

	const handleInstantUpgrade = async () => {
		try {
			setIsLoading(true);

			const response = await axiosInstance.get(
				"/subscriptions/basic-plan-upgrade",
			);

			if (response.status === 200) {
				if (response.data != null) {
					window.location.href = response.data;
				}
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleStandardUpgrade = async () => {
		try {
			setIsLoading(true);

			const response = await axiosInstance.get(
				"/subscriptions/standard-plan-upgrade",
			);

			if (response.status === 200) {
				if (response.data != null) {
					window.location.href = response.data;
				}
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return <CustomizedProgressBar />;
	}

	const getVisiblePlans = (plans: Plan[], isPartner = false) => {
		if (plans?.length > 0) {
			return plans.map((plan, index) => {
				let buttonText = "Speak to Us";
				let disabled = false;

				let handle = handleOpenPopup;
				if (isTrial === true) {
					if (plan.title === "Free Trial") {
						buttonText = "Current Plan";
						disabled = true;
					} else if (plan.title === "Basic") {
						buttonText = "Instant Upgrade";
						disabled = false;
						handle = handleInstantUpgrade;
					} else if (plan.title === "Standard") {
						buttonText = "Instant Upgrade";
						disabled = false;
						handle = handleStandardUpgrade;
					} else {
						buttonText = "Speak to Us";
						disabled = false;
					}
				}

				if (isPartner) {
					buttonText = "Become partner";
				}

				if (plan.is_active) {
					buttonText = "Current Plan";
					disabled = true;
				}

				return (
					<Box
						key={plan.title}
						sx={{
							...subscriptionStyles.formWrapper,
						}}
					>
						<PlanCard
							plan={plan}
							isRecommended={plan.is_recommended}
							isActive={plan.is_active}
							buttonProps={{
								onChoose: handle,
								text: buttonText,
								disabled: disabled,
							}}
							isPartner={isPartner}
						/>
					</Box>
				);
			});
		}

		return null;
	};

	// const visibleNormalPlans = getVisiblePlans(normalPlans);
	// const visiblePartnerPlans = getVisiblePlans(partnerPlans, true);

	// const visiblePlans = [
	// 	...(visibleNormalPlans ?? []),
	// 	...(visiblePartnerPlans
	// 		? [
	// 				<Box key="add-icon">
	// 					<AddRounded
	// 						sx={{ width: "56px", height: "56px", color: "#E4E4E4" }}
	// 					/>
	// 				</Box>,
	// 				...visiblePartnerPlans,
	// 			]
	// 		: []),
	// ];

	const viisiblePlans: PlanNew[] = [
		// {
		//   key: "basic",
		//   title: "Basic",
		//   monthly: "$1",
		//   yearly: "",
		//   note: "Once",
		//   cta: "Speak to Us",
		//   href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
		//   features: [
		//     "15+",
		//     "Included",
		//     "Unlimited",
		//     "Included",
		//     "$0.08 Each (Up To 65k)",
		//     "✖",
		//     "✖",
		//     "$500",
		//     "$500",
		//   ],
		// },
		{
			key: "standard",
			title: "Standard",
			monthly: "$499",
			yearly: "$300",
			note: "Per Month",
			cta: "Speak to Us",
			href: "https://app.allsourcedata.io/signup",
			// второй / центральный
			features: [
				"15+",
				"Included",
				"Unlimited",
				"Included",
				"Unlimited",
				"Included",
				"✖",
				"$1,000",
				"$1,000",
			],
		},
		{
			key: "smart",
			title: "Smart Audience",
			monthly: "$999",
			yearly: "$700",
			note: "Per Month",
			cta: "Speak to Us",
			href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
			highlight: true,
			features: [
				"15+",
				"Included",
				"Unlimited",
				"Included",
				"Unlimited",
				"Included",
				"200,000",
				"$1,500",
				"$1,500",
			],
		},
		{
			key: "pro",
			title: "Pro",
			monthly: "$4,999",
			yearly: "$2,999",
			note: "Per Month",
			cta: "Speak to Us",
			href: "https://meetings-na2.hubspot.com/mark-lombardi/mark-byron-call-link-",
			features: [
				"15+",
				"Included",
				"Unlimited",
				"Included",
				"Unlimited",
				"Included",
				"Unlimited",
				"$2,500",
				"$2,500",
			],
		},
	];

	return (
		<Box
			sx={{
				marginBottom: "12px",
				pr: "1rem",
				"@media (max-width: 600px)": { pr: "16px" },
			}}
		>
			<PricingTable plans={viisiblePlans} handleOpenPopup={handleOpenPopup} />

			{sourcePlatform !== "shopify" && (
				<Button
					variant="outlined"
					className="hyperlink-red"
					sx={{
						color: "rgba(56, 152, 252, 1) !important",
						borderRadius: "4px",
						border: "1px solid rgba(56, 152, 252, 1)",
						boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
						textTransform: "none",
						padding: "9px 16px",
						marginBottom: "16px",
						width: "100%",
						"&:hover": {
							background: "transparent",
						},
						"@media (min-width: 1px)": {
							display: "none",
						},
					}}
					onClick={handleCustomPlanPopupOpen}
				>
					Custom Plans
				</Button>
			)}

			<CustomPlan
				customPlanPopupOpen={customPlanPopupOpen}
				setCustomPlanPopupOpen={setCustomPlanPopupOpen}
			/>

			<UnsubscribeTeamsPlan
				cancelSubscriptionPlanPopupOpen={cancelSubscriptionPlanPopupOpen}
				handleCancelSubscriptionPlanPopupClose={
					handleCancelSubscriptionPlanPopupClose
				}
				setExcitingOfferPopupOpen={setExcitingOfferPopupOpen}
			/>

			<ExcitingOfferOnlyForYou
				handleExcitingOfferPopupClose={handleExcitingOfferPopupClose}
				setConfirmCancellationPopupOpen={setConfirmCancellationPopupOpen}
				excitingOfferPopupOpen={excitingOfferPopupOpen}
			/>

			{popupOpen && (
				<BookACallPopup
					open={popupOpen}
					handleClose={() => setPopupOpen(false)}
				/>
			)}
		</Box>
	);
};
