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
	is_active_year: boolean;
	is_active_month: boolean;
	require_contact_for_upgrade: boolean;
};
