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

export type FrontendPlan = {
	key: string;
	title: string;
	monthly: string;
	yearly: string;
	note?: string;
	cta: string;
	href: string;
	highlight?: boolean;
	features: string[];
	is_active: boolean;
};

export type PlanPeriod = "month" | "year";

type FrontendPlansResponse = {
	plans: FrontendPlan[];
};

export function usePlans(): [FrontendPlan[], FrontendPlan[], string | null] {
	const [normalPlans, setNormalPlans] = useState<FrontendPlan[]>([]);
	const [partnerPlans, setPartnerPlans] = useState<FrontendPlan[]>([]);
	const currentPlanAlias = usePlanAlias();

	const getPlans = async () => {
		try {
			const response =
				await axiosInstance.get<FrontendPlansResponse>("/settings/plans");
			if (response.status === 200) {
				const { plans } = response.data;

				// Для партнерских планов - если у вас их нет, можно оставить пустой массив
				// или адаптировать под вашу логику
				setPartnerPlans([]);

				// Обрабатываем normal планы
				let processedPlans = [...plans];

				// Если нужна дополнительная обработка по периоду, можно добавить здесь
				// Например, фильтрация или сортировка

				setNormalPlans(processedPlans);
			}
		} catch (error) {
			console.error("Error fetching plans:", error);
			setNormalPlans([]);
			setPartnerPlans([]);
		}
	};

	useEffect(() => {
		getPlans();
	}, []);

	return [normalPlans, partnerPlans, currentPlanAlias];
}
