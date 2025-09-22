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
	permanent_limits?: Advantage[];
	monthly_limits?: Advantage[];
	referrals?: Advantage[];
	gifted_funds?: Advantage[];
	gifts?: Advantage[];
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
			name: "Premium Data funds:",
			value: "$250",
		},
	],
};

export type PlanPeriod = "month" | "year";

type SubscriptionPlans = {
	monthly: Plan[];
	yearly: Plan[];
};

type PlanResponse = {
	normal_plans: SubscriptionPlans;
	partner_plans: SubscriptionPlans;
};

export function usePlans(period: PlanPeriod): [Plan[], Plan[], string | null] {
	const [normalPlans, setNormalPlans] = useState<Plan[]>([]);
	const [partnerPlans, setPartnerPlans] = useState<Plan[]>([]);

	const currentPlanAlias = usePlanAlias();
	const freeTrial = useIsFreeTrial();

	const getPlans = async () => {
		const response = await axiosInstance.get<PlanResponse>("/settings/plans");
		if (response.status === 200) {
			const { normal_plans, partner_plans } = response.data;

			setPartnerPlans(
				period === "month" ? partner_plans.monthly : partner_plans.yearly,
			);

			let plans =
				period === "month" ? normal_plans.monthly : normal_plans.yearly;

			if (freeTrial) {
				plans = [...plans];
			}

			const planIndex = plans.findIndex(
				(plan: Plan) => plan.alias === currentPlanAlias,
			);

			if (planIndex === -1) {
				return setNormalPlans(plans);
			}

			const newPlans = [
				{
					...plans[planIndex],
					is_active: true,
				},
				...plans.slice(planIndex + 1),
			];

			setNormalPlans(newPlans);
		}
	};

	useEffect(() => {
		getPlans();
	}, [currentPlanAlias, freeTrial, period]);

	return [normalPlans, partnerPlans, currentPlanAlias];
}
