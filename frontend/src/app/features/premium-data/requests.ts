import { useAxios } from "@/axios/axiosInterceptorInstance";
import type { PremiumSourceData, UserPremiumSourceDto } from "./schemas";
import type {
	PremiumSync,
	PremiumSourceIntegration,
} from "@/app/(client)/premium-data/syncs/schemas";
import type { AxiosInstance } from "axios";
import { showErrorToast } from "@/components/ToastNotification";
import type { CardDetails } from "./dialogs/payment-dialog/PaymentMethod";

export function useGetPremiumData() {
	return useAxios<PremiumSourceData[]>(
		{
			url: "/premium-data",
			method: "GET",
		},
		{
			manual: true,
		},
	);
}

export function useAdminGetPremiumData(userId: number) {
	return useAxios<UserPremiumSourceDto>({
		url: "/admin/premium-data",
		method: "GET",
		params: {
			user_id: userId,
		},
	});
}

export function useAdminDeletePremiumData() {
	const [_, rawRequest] = useAxios(
		{
			method: "DELETE",
		},
		{
			manual: true,
		},
	);

	return {
		delete: (sourceId: string) =>
			rawRequest({
				url: "/admin/premium-data",
				method: "DELETE",
				params: {
					premium_source_id: sourceId,
				},
			}),
	};
}

export function useAdminPostPremiumData() {
	return useAxios(
		{
			url: "/admin/premium-data",
			method: "POST",
		},
		{
			manual: true,
		},
	);
}

export function useAdminRenamePremiumData() {
	const [{ loading }, rawRename] = useAxios(
		{
			url: "/admin/premium-data",
			method: "PUT",
		},
		{
			manual: true,
		},
	);

	const rename = async (premiumSourceId: string, newName: string) =>
		await rawRename({
			method: "PUT",
			params: {
				premium_source_id: premiumSourceId,
				new_name: newName,
			},
		});

	return {
		loading,
		rename,
	};
}
export function usePremiumSyncIntegrations() {
	return useAxios<PremiumSourceIntegration[]>({
		url: "/premium-data/integrations",
		method: "GET",
	});
}

export function useGetPremiumSyncs() {
	return useAxios<PremiumSync[]>(
		{
			url: "/premium-data/syncs",
			method: "GET",
		},
		{ manual: true },
	);
}

export function useDeletePremiumSync() {
	return useAxios(
		{
			url: "/premium-data/syncs",
			method: "DELETE",
		},
		{ manual: true },
	);
}

type CreateCampaignParams = {
	setLoading: (loading: boolean) => void;
	adAccountId: string | undefined;
	campaignName: string | undefined;
	bidAmount: number | undefined;
	dailyBudget: number | undefined;
};

export function openDownloadPremiumSource(downloadToken: string) {
	const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}premium-data/download?token=${downloadToken}`;
	window.open(url, "_blank");
}

export function usePremiumSourceDownloadLinkRequest() {
	const [{ loading, data }, refetch] = useAxios<string>(
		{
			url: "/premium-data/download-link",
			method: "GET",
		},
		{
			manual: true,
		},
	);

	const request = (premium_source_id: string) => {
		return refetch({
			params: {
				premium_source_id: premium_source_id,
			},
		});
	};

	return {
		loading,
		data,
		request,
	};
}

export const metaCreateCampaign = async (
	axios: AxiosInstance,
	{
		setLoading,
		adAccountId,
		campaignName,
		bidAmount,
		dailyBudget,
	}: CreateCampaignParams,
) => {
	try {
		setLoading(false);
		const newListResponse = await axios.post(
			"/integrations/sync/campaign/",
			{
				ad_account_id: String(adAccountId),
				campaign_name: String(campaignName),
				bid_amount: String(bidAmount),
				daily_budget: String(dailyBudget),
			},
			{
				params: {
					service_name: "meta",
				},
			},
		);

		if (
			newListResponse.status === 201 &&
			newListResponse.data.terms_link &&
			!newListResponse.data.terms_accepted
		) {
			showErrorToast("User has not accepted the Custom Audience Terms.");
			window.open(newListResponse.data.terms_link, "_blank");
			return;
		}
		if (newListResponse.status !== 201) {
			showErrorToast("Failed to create a new tags");
			return;
		}

		const data = newListResponse.data;

		return data;
	} catch {
	} finally {
		setLoading(false);
	}
};

export const useGetPremiumFunds = () => {
	const [{ loading, data }, refetch] = useAxios<number | null>(
		{
			url: "/premium-data/funds",
			method: "GET",
		},
		{
			manual: true,
		},
	);

	return {
		loading,
		data,
		refetch,
	};
};

export const useBuyPremiumSource = () => {
	const [{ loading, data }, refetch, cancel] = useAxios<number | null>(
		{
			url: "/premium-data/unlock",
			method: "GET",
		},
		{
			manual: true,
		},
	);

	const request = (
		sourceId: string,
		amount: number,
		paymentMethodId?: string,
	) => {
		return refetch({
			params: {
				premium_source_id: sourceId,
				amount: amount,
				payment_method_id: paymentMethodId,
			},
		});
	};

	return {
		loading,
		data,
		request,
		cancel,
	};
};

type BillingResponse = {
	card_details: CardDetails[];
};

export const useGetAddedCards = () => {
	const [{ loading, data, error }, refetch] = useAxios<BillingResponse>(
		{
			url: "/settings/billing",
			method: "GET",
		},
		{
			manual: true,
		},
	);

	return {
		loading,
		data,
		error,
		refetch,
	};
};
