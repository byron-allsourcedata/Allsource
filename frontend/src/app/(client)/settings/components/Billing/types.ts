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

type Detail<T> = { detail_type: string; value: T };
type LimitDetail = {
	detail_type: string;
	current_value: number;
	limit_value: number;
};

export interface SubscriptionDetails {
	active: Detail<boolean>;
	billing_cycle: {
		detail_type: string;
		plan_start: string | null;
		plan_end: string | null;
	};
	contacts_downloads: LimitDetail;
	next_billing_date: Detail<string>;
	plan_name: Detail<string>;
	yearly_total?: Detail<string>;
	monthly_total?: Detail<string>;
	domains: LimitDetail;
	validation_funds: LimitDetail;
	premium_sources_funds: string;
	smart_audience: LimitDetail;
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
