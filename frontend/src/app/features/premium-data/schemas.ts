export type Status =
	| "ready"
	| "syncing"
	| "synced"
	| "disabled"
	| "failed"
	| "locked";

export type PremiumSourceData = {
	id: string;
	name: string;
	created_at: string;
	rows: string;
	price: number;
	status: Status;
	source_type: string;
};

export type UserPremiumSourceDto = {
	user_name: string;
	premium_sources: PremiumSourceData[];
};
