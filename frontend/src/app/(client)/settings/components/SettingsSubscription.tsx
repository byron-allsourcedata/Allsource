"use client";
import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Box, Button } from "@mui/material";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "../../../../axios/axiosInterceptorInstance";
import { type FrontendPlan } from "./plans";
import { fetchUserData } from "@/services/meService";
import { BookACallPopup } from "../../components/BookACallPopup";

import { ExcitingOfferOnlyForYou } from "./Subscription/ExcitingOfferOnlyForYou";
import { UnsubscribeTeamsPlan } from "./Subscription/UnsubscribeTeamsPlan";
import { CustomPlan } from "./Subscription/CustomPlan";
import { PricingTable } from "./Subscription/PricingTable";

export const SettingsSubscription: React.FC = () => {
	const [plans, setPlans] = useState<FrontendPlan[]>([]);

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [customPlanPopupOpen, setCustomPlanPopupOpen] = useState(false);
	const [cancelSubscriptionPlanPopupOpen, setCancelSubscriptionPlanPopupOpen] =
		useState(false);
	const [excitingOfferPopupOpen, setExcitingOfferPopupOpen] = useState(false);
	const [confirmCancellationPopupOpen, setConfirmCancellationPopupOpen] =
		useState(false);
	const [isTrial, setIsTrial] = useState<boolean | null>(null);
	const [popupOpen, setPopupOpen] = useState(false);

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
				if (response.data.plans.length > 0) {
					setPlans(response.data?.plans);
				}
			} catch {
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

	const handleInstantUpgrade = async (interval: string) => {
		try {
			setIsLoading(true);

			const response = await axiosInstance.get(
				`/subscriptions/standard-plan-upgrade?interval=${interval}`,
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

	return (
		<Box
			sx={{
				marginBottom: "12px",
				pr: "1rem",
				"@media (max-width: 600px)": { pr: "16px" },
			}}
		>
			<PricingTable
				plans={plans}
				handleOpenPopup={handleOpenPopup}
				handleInstantUpgrade={handleInstantUpgrade}
			/>

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
