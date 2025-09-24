export interface DomainsLeads {
	id: number;
	name: string;
	pixel_installed: boolean;
	converted_sales_count: number;
	viewed_product_count: number;
	visitor_count: number;
	abandoned_cart_count: number;
	total_count: number;
}

export interface EventTypeInterface {
	id: number;
	name: string;
	title: string;
}

export interface NewSource {
	target_schema: string;
	source_type: string;
	source_origin: string;
	source_name: string;
	file_url?: string;
	rows?: { type: string; value: string }[];
	domain_id?: number;
}

export type SourceType =
	| "Customer Conversions"
	| "Failed Leads"
	| "Interest"
	| "Website - Pixel"
	| "";

export interface Row {
	id: number;
	type: string;
	value: string;
	canDelete: boolean;
	isHidden: boolean;
}

export interface InterfaceMappingRowsSourceType {
	"Failed Leads": Row[];
	Interest: Row[];
	"Customer Conversions": Row[];
}
