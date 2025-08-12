import type { UseAxiosResult } from "axios-hooks";
import type { WhitelabelSettingsSchema } from "./schemas";
import { useAxios } from "@/axios/axiosInterceptorInstance";

export function useGetWhitelabelSettings(
	autofetch?: boolean,
): UseAxiosResult<WhitelabelSettingsSchema> {
	return useAxios(
		{
			url: "/whitelabel/settings",
			method: "GET",
		},
		{
			manual: !autofetch,
		},
	);
}

export function usePostWhitelabelSettings(): UseAxiosResult<unknown> {
	return useAxios(
		{
			url: "/whitelabel/settings",
			method: "POST",
		},
		{ manual: true },
	);
}
