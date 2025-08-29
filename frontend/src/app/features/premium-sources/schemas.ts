export type Status = "ready" | "syncing" | "synced" | "disabled" | "failed";

export type PremiumSourceData = {
	id: string;
	name: string;
	created_at: string;
	rows: string;
	status: Status;
};

export type UserPremiumSourceDto = {
	user_name: string;
	premium_sources: PremiumSourceData[];
};
