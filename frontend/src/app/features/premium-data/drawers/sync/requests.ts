import { useAxios } from "@/axios/axiosInterceptorInstance";
import { useMemo } from "react";

type CreateGoogleAdsSyncRequest = {
	premium_source_id: string;
	user_integration_id: number;
	customer_id: string;
	list_id: string;
	list_name: string;
};

export function useCreateGoogleAdsPremiumSync() {
	const [{ loading, error }, rawRequest] = useAxios<void>(
		{
			url: "/premium-data/syncs/google-ads",
		},
		{ manual: true },
	);

	const request = useMemo(
		() => (req: CreateGoogleAdsSyncRequest) => {
			return rawRequest({
				method: "POST",
				data: req,
			});
		},
		[],
	);

	return {
		loading,
		error,
		request,
	};
}
