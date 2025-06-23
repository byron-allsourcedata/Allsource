export type CardBrand =
	| "visa"
	| "mastercard"
	| "amex"
	| "discover"
	| "unionpay";

export interface CardDetails {
	id: string;
	brand: string;
	last4: string;
	exp_month: number;
	exp_year: number;
	is_default: boolean;
}

export interface SubscriptionDetails {
	active: { detail_type: string; value: boolean };
	billing_cycle: {
		detail_type: string;
		plan_start: string | null;
		plan_end: string | null;
	};
	contacts_downloads: {
		detail_type: string;
		limit_value: number;
		current_value: number;
	};
	next_billing_date: { detail_type: string; value: string };
	plan_name: { detail_type: string; value: string };
	yearly_total?: { detail_type: string; value: string };
	monthly_total?: { detail_type: string; value: string };
	domains: { detail_type: string; current_value: number; limit_value: number };
	validation_funds: {
		detail_type: string;
		current_value: number;
		limit_value: number;
	};
	premium_sources_funds: string;
	smart_audience: {
		detail_type: string;
		current_value: number;
		limit_value: number;
	};
}

export interface BillingDetailsInterface {
	subscription_details: SubscriptionDetails;
	downgrade_plan: { downgrade_at: string | null; plan_name: string | null };
	is_leads_auto_charging: boolean;
	canceled_at: string;
	active?: boolean;
}

export interface BillingHistoryItem {
	invoice_id: string;
	pricing_plan: string;
	date: string;
	status: string;
	total: number;
}
