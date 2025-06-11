import { useIsFreeTrial, usePlanAlias } from "@/hooks/subscriptions";
import type { Advantage } from "./PlanCard/Advantages";

export type Plan = {
	title: string;
	alias: string;
	price: {
		value: string;
		y: string;
	};
	isActive: boolean;
	isRecommended: boolean;
	permanentLimits: Advantage[];
	monthlyLimits: Advantage[];
	giftedFunds: Advantage[];
};

export const freeTrialPlan: Plan = {
	title: "Free Trial",
	alias: "free_trial",
	isActive: false,
	price: {
		value: "$0",
		y: "month",
	},
	isRecommended: false,
	permanentLimits: [
		{
			good: true,
			name: "Domains monitored:",
			value: "1",
		},
	],
	monthlyLimits: [
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
	giftedFunds: [
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

export const basicPlan: Plan = {
	title: "Basic",
	alias: "basic",
	isActive: false,
	price: {
		value: "$0,08",
		y: "record",
	},
	isRecommended: false,
	permanentLimits: [
		{
			good: true,
			name: "Domains monitored:",
			value: "1",
		},
	],
	monthlyLimits: [
		{
			good: true,
			name: "Contact Downloads:",
			value: "1,000 - 65,000",
		},
		{
			good: true,
			name: "Smart Audience:",
			value: "0",
		},
	],
	giftedFunds: [
		{
			good: true,
			name: "Validation funds:",
			value: "$500",
		},
		{
			good: true,
			name: "Premium Source funds:",
			value: "$500",
		},
	],
};

export const smartAudienceYearly: Plan = {
	title: "Smart Audience",
	alias: "smart_audience",
	isActive: false,
	price: {
		value: "$5,000",
		y: "month",
	},
	isRecommended: true,
	permanentLimits: [
		{
			good: true,
			name: "Domains monitored:",
			value: "3",
		},
	],
	monthlyLimits: [
		{
			good: true,
			name: "Contact Downloads:",
			value: "Unlimited",
		},
		{
			good: true,
			name: "Smart Audience:",
			value: "200,000",
		},
	],
	giftedFunds: [
		{
			good: true,
			name: "Validation funds:",
			value: "$2,500",
		},
		{
			good: true,
			name: "Premium Source funds:",
			value: "$2,500",
		},
	],
};

const smartAudienceMonthly = {
	...smartAudienceYearly,
	price: {
		value: "$7,500",
		y: "month",
	},
};

const proYearly: Plan = {
	title: "Pro",
	alias: "pro",
	price: {
		value: "$10,000",
		y: "month",
	},
	isActive: false,
	isRecommended: false,
	permanentLimits: [
		{
			good: true,
			name: "Domains monitored:",
			value: "5",
		},
	],
	monthlyLimits: [
		{
			good: true,
			name: "Contact Downloads:",
			value: "Unlimited",
		},
		{
			good: true,
			name: "Smart Audience:",
			value: "Unlimited",
		},
	],
	giftedFunds: [
		{
			good: true,
			name: "Validation funds:",
			value: "$5,000",
		},
		{
			good: true,
			name: "Premium Source funds:",
			value: "$5,000",
		},
	],
};

const proMonthly: Plan = {
	...proYearly,
	price: {
		value: "$15,000",
		y: "month",
	},
};

export const yearlyPlans: Plan[] = [basicPlan, smartAudienceYearly, proYearly];

export const monthlyPlans: Plan[] = [
	basicPlan,
	smartAudienceMonthly,
	proMonthly,
];

export type PlanPeriod = "month" | "year";

export function usePlans(period: PlanPeriod): Plan[] {
	const currentPlanAlias = usePlanAlias();
	const freeTrial = useIsFreeTrial();

	let plans = period === "month" ? monthlyPlans : yearlyPlans;

	if (freeTrial) {
		plans = [{ ...freeTrialPlan, isActive: true }, ...plans];
	}

	const planIndex = plans.findIndex((plan) => plan.alias === currentPlanAlias);

	if (planIndex === -1) {
		return plans;
	}

	return [
		{
			...plans[planIndex],
			isActive: true,
		},
		...plans.slice(planIndex + 1),
	];
}
