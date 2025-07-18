import { useIsFreeTrial, usePlanAlias } from "@/hooks/subscriptions";
import type { Advantage } from "./PlanCard/Advantages";
import { useEffect, useState } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";

export type Plan = {
	title: string;
	alias: string;
	price: {
		value: string;
		y: string;
	};
	is_active: boolean;
	is_recommended: boolean;
	permanent_limits: Advantage[];
	monthly_limits: Advantage[];
	gifted_funds: Advantage[];
};

export const freeTrialPlan: Plan = {
	title: "Free Trial",
	alias: "free_trial",
	is_active: false,
	price: {
		value: "$0",
		y: "month",
	},
	is_recommended: false,
	permanent_limits: [
		{
			good: true,
			name: "Domains monitored:",
			value: "1",
		},
	],
	monthly_limits: [
		{
			good: true,
			name: "Contact Downloads:",
			value: "Up to 1,000",
		},
		{
			good: false,
			name: "Smart Audience:",
			value: "0",
		},
	],
	gifted_funds: [
		{
			good: true,
			name: "Validation funds:",
			value: "$250",
		},
		{
			good: true,
			name: "Premium Source funds:",
			value: "$250",
		},
	],
};

export type PlanPeriod = "month" | "year";

type PlanResponse = {
	monthly: Plan[];
	yearly: Plan[];
};

export function usePlans(period: PlanPeriod): [Plan[], string | null] {
	const [visiblePlans, setVisiblePlans] = useState<Plan[]>([]);

	const currentPlanAlias = usePlanAlias();
	const freeTrial = useIsFreeTrial();

	const getPlans = async () => {
		const response = await axiosInstance.get<PlanResponse>("/settings/plans");
		if (response.status === 200) {
			const { monthly, yearly } = response.data;
			let plans = period === "month" ? monthly : yearly;

			if (freeTrial) {
				plans = [...plans];
			}

			const planIndex = plans.findIndex(
				(plan: Plan) => plan.alias === currentPlanAlias,
			);

			if (planIndex === -1) {
				return setVisiblePlans(plans);
			}

			const newPlans = [
				{
					...plans[planIndex],
					is_active: true,
				},
				...plans.slice(planIndex + 1),
			];

			setVisiblePlans(newPlans);
		}
	};

	useEffect(() => {
		getPlans();
	}, [currentPlanAlias, freeTrial, period]);

	return [visiblePlans, currentPlanAlias];
}
