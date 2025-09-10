"use client";

import type { UseAxiosResult } from "axios-hooks";
import type { WhitelabelSettingsSchema } from "./schemas";
import { useAxios } from "@/axios/axiosInterceptorInstance";
export function useGetWhitelabelSettings(
	referral?: string,
	autofetch?: boolean,
): UseAxiosResult<WhitelabelSettingsSchema> {
	const params: Record<string, string> = {};

	if (referral) {
		params.referral = referral;
	}

	return useAxios({
		url: "/whitelabel/settings",
		method: "GET",
		params,
	});
}

export function useGetOwnWhitelabelSettings(
	autofetch?: boolean,
): UseAxiosResult<WhitelabelSettingsSchema> {
	return useAxios(
		{
			url: "/whitelabel/own-settings",
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
