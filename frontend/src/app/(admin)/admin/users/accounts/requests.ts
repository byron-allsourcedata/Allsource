import { useAxios } from "@/axios/axiosInterceptorInstance";
import { useMemo } from "react";

export function useEnableWhitelabel() {
	const useAxiosResponse = useAxios(
		{
			url: "admin/whitelabel/enable",
			method: "POST",
		},
		{
			manual: true,
		},
	);

	const execute = useMemo(() => {
		return (userId: number) => {
			const execute = useAxiosResponse[1];
			return execute({
				params: {
					user_id: userId,
				},
			});
		};
	}, [useAxiosResponse[1]]);

	const [{ loading }] = useAxiosResponse;

	return [execute, loading] as const;
}

export function useDisableWhitelabel() {
	const useAxiosResponse = useAxios(
		{
			url: "admin/whitelabel/disable",
			method: "POST",
		},
		{
			manual: true,
		},
	);

	const execute = useMemo(() => {
		return (userId: number) => {
			const execute = useAxiosResponse[1];
			return execute({
				params: {
					user_id: userId,
				},
			});
		};
	}, [useAxiosResponse[1]]);

	const [{ loading }] = useAxiosResponse;

	return [execute, loading] as const;
}
