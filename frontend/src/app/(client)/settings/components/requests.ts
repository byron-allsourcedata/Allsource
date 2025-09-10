import { useAxios } from "@/axios/axiosInterceptorInstance";

export type TeamMember = {
	email: string;
	full_name: string | null;
	last_sign_in: string;
	access_level: string;
	invited_by: string | null;
	added_on: string | null;
};

export type TeamsResponse = {
	teams: TeamMember[];
	member_limit: number;
	member_count: number;
};

export function useGetTeamsMembers() {
	const [{ data, loading }, refetch] = useAxios<TeamsResponse>({
		url: "/settings/teams",
		method: "get",
	});

	return {
		teams: data,
		loading,
		refetch,
	};
}
