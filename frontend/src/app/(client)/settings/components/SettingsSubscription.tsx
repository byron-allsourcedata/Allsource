"use client";
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import {
	Box,
	Typography,
	Button,
	Tabs,
	Tab,
	TextField,
	IconButton,
	Drawer,
	Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PlanCard } from "./PlanCard";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import CustomTooltip from "../../../../components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import Image from "next/image";
import axiosInstance from "../../../../axios/axiosInterceptorInstance";
import {
	showErrorToast,
	showToast,
} from "../../../../components/ToastNotification";
import axios from "axios";
import { usePlans, type Plan } from "./plans";
import { fetchUserData } from "@/services/meService";
import { BookACallPopup } from "../../components/BookACallPopup";

import { useBookingUrl } from "@/services/booking";
import { AddRounded } from "@mui/icons-material";
import PricingTable from "./PlanCard/PricingTable";

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

export const SettingsSubscription: React.FC = () => {
	const [tabValue, setTabValue] = useState(0);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [plansMonthly, setPlansMonthly] = useState<Plan[]>([]);
	const [plansYearly, setPlansYearly] = useState<Plan[]>([]);
	const [credits, setCredits] = useState<number>(50000);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [customPlanPopupOpen, setCustomPlanPopupOpen] = useState(false);
	const [cancelSubscriptionPlanPopupOpen, setCancelSubscriptionPlanPopupOpen] =
		useState(false);
	const [excitingOfferPopupOpen, setExcitingOfferPopupOpen] = useState(false);
	const [confirmCancellationPopupOpen, setConfirmCancellationPopupOpen] =
		useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [formValues, setFormValues] = useState({ unsubscribe: "" });
	const [hasActivePlan, setHasActivePlan] = useState<boolean>(false);
	const [showSlider, setShowSlider] = useState(true);
	const [utmParams, setUtmParams] = useState<string | null>(null);
	const [activePlan, setActivePlan] = useState<any>(null);
	const [isTrial, setIsTrial] = useState<boolean | null>(null);
	const [popupOpen, setPopupOpen] = useState(false);

	const plans_data = usePlans();
	console.log("plans_data", plans_data);

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

	const handleFilterPopupClose = () => {
		setShowSlider(false);
	};

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

	const handleCustomPlanPopupClose = () => {
		setCustomPlanPopupOpen(false);
	};

	const handleCancelSubscriptionPlanPopupOpen = () => {
		setCancelSubscriptionPlanPopupOpen(true);
	};

	const handleCancelSubscriptionPlanPopupClose = () => {
		setCancelSubscriptionPlanPopupOpen(false);
	};

	const handleExcitingOfferPopupOpen = () => {
		setExcitingOfferPopupOpen(true);
	};

	const handleExcitingOfferPopupClose = () => {
		setExcitingOfferPopupOpen(false);
	};

	const handleConfirmCancellationPopupOpen = () => {
		setConfirmCancellationPopupOpen(true);
	};

	const handleConfirmCancellationPopupClose = () => {
		setConfirmCancellationPopupOpen(false);
	};

	interface StripePlan {
		id: string;
		interval: string;
		title: string;
		is_active: boolean;
	}

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

	const fetchPrefillData = async () => {
		try {
			const response = await axiosInstance.get("/calendly");
			const user = response.data.user;

			if (user) {
				const { full_name, email, utm_params } = user;
				setUtmParams(utm_params);
			}
		} catch (error) {
			setUtmParams(null);
		}
	};

	const meetingUrl = useBookingUrl(axiosInstance);

	const handleChoosePlan = async (alias: string) => {
		let path = hasActivePlan
			? "/subscriptions/upgrade-and-downgrade-user-subscription"
			: "/subscriptions/session/new";
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get(
				`${path}?alias=${alias}`,
			);
			if (response.status === 200) {
				if (response.data.link !== null && response.data.link !== undefined) {
					if (response.data?.source_platform == "big_commerce") {
						window.open(response.data.link, "_blank");
					} else {
						window.location.href = response.data.link;
					}
				}
				if (response.data.status_subscription) {
					if (response.data.status_subscription === "active") {
						showToast("Subscription was successful!");
						window.location.href = "/settings?section=subscription";
					} else {
						showToast("Subscription purchase error!");
					}
				} else if (response.data.status === "SUCCESS") {
					showToast("Subscription was successful!");
					try {
						setIsLoading(true);
						await new Promise((resolve) => setTimeout(resolve, 3000));
						const response = await axiosInterceptorInstance.get(
							`/subscriptions/stripe-plans`,
						);

						const stripePlans: StripePlan[] = response.data.stripe_plans;
						const activePlan = stripePlans.find((plan) => plan.is_active);
						const active = stripePlans.find(
							(plan) =>
								plan.is_active &&
								plan.title !== "Free Trial" &&
								plan.title !== "Partners Live",
						);
						setActivePlan(active || null);
						setHasActivePlan(!!activePlan);
						let interval = "month";
						if (activePlan) {
							interval = activePlan.interval;
						}
						if (interval === "year") {
							setTabValue(1);
						}
						const period_plans = response.data.stripe_plans.filter(
							(plan: any) => plan.interval === interval,
						);
					} catch (error) {
					} finally {
						setIsLoading(false);
					}
				} else if (response.data.status === "INCOMPLETE") {
					const errorMessage =
						response?.data?.message || "Subscription not found!";
					showErrorToast(errorMessage);
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
		}
	};

	const handleChangeCredits = (event: Event, newValue: number | number[]) => {
		setCredits(newValue as number);
	};

	// Filter plans based on the selected tab
	// .filter(plan =>
	//     (tabValue === 0 && plan.interval === 'month') ||
	//     (tabValue === 1 && plan.interval === 'year')
	// );

	if (isLoading) {
		return <CustomizedProgressBar />;
	}

	const validateField = (name: string, value: string) => {
		const newErrors: { [key: string]: string } = { ...errors };

		switch (name) {
			case "unsubscribe":
				if (!value) {
					newErrors.unsubscribe = "Please enter the reason";
				} else {
					delete newErrors.unsubscribe;
				}
				break;
		}

		setErrors(newErrors);
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setFormValues({
			...formValues,
			[name]: value,
		});
		validateField(name, value);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const newErrors: { [key: string]: string } = {};

		if (!formValues.unsubscribe) {
			newErrors.unsubscribe = "Please enter the reason";
			setErrors(newErrors);
			return;
		}
		if (formValues.unsubscribe) {
			try {
				setIsLoading(true);
				const response = await axiosInterceptorInstance.post(
					"/subscriptions/cancel-plan",
					{
						reason_unsubscribe: formValues.unsubscribe,
					},
				);
				if (response.status === 200) {
					switch (response.data) {
						case "SUCCESS":
							showToast("Unsubscribe Teams Plan processed!");
							break;
						case "SUBSCRIPTION_NOT_FOUND":
							showErrorToast("Subscription not found!");
							break;
						case "SUBSCRIPTION_ALREADY_CANCELED":
							showErrorToast("Subscription already canceled!");
							break;
						case "INCOMPLETE":
							showErrorToast("Subscription cancellation error!");
							break;
						default:
							showErrorToast("Unknown response received.");
					}
				}
			} catch (error) {
				showErrorToast("An error occurred while sending URLs.");
			} finally {
				setIsLoading(false);
				handleConfirmCancellationPopupClose();
				handleExcitingOfferPopupClose();
				handleCancelSubscriptionPlanPopupClose();
			}
		}
	};

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
	// 			<Box key="add-icon">
	// 				<AddRounded
	// 					sx={{ width: "56px", height: "56px", color: "#E4E4E4" }}
	// 				/>
	// 			</Box>,
	// 			...visiblePartnerPlans,
	// 		]
	// 		: []),
	// ];

	return (
		<Box
			sx={{
				marginBottom: "12px",
				pr: "1rem",
				"@media (max-width: 600px)": { pr: "16px" },
			}}
		>
			{/* Plans Section */}
			<Box
				sx={{
					marginBottom: 4,
					display: "flex",
					flexDirection: "column",
					width: "100%",
					justifyContent: "center",
				}}
			>
				{/* <PricingTable
					normalPlans={normalPlans}
					partnerPlans={partnerPlans}
					billing={tabValue === 0 ? "monthly" : "yearly"}
					handleOpenPopup={handleChoosePlan}
				/> */}
			</Box>

			{popupOpen && (
				<BookACallPopup
					open={popupOpen}
					handleClose={() => setPopupOpen(false)}
				/>
			)}
		</Box>
	);
};
