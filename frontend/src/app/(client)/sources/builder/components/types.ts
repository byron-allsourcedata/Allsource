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
	isRequiredForAsidMatching: boolean;
}

export interface InterfaceMappingRowsSourceType {
	"Failed Leads": Row[];
	Interest: Row[];
	"Customer Conversions": Row[];
}

export interface InterfaceMappingHeadingSubstitution {
	[key: string]: Record<string, boolean>;
}

export type SourceTypeSchema = {
	title: string;
	src: string;
	description: string;
};

export const sourceTypes: SourceTypeSchema[] = [
	{
		title: "Website - Pixel",
		src: "/website_pixel-icon.svg",
		description: "Use your resolved Pixel contacts",
	},
	{
		title: "Customer Conversions",
		src: "/customer_conversions-icon.svg",
		description: "Use information about completed deals",
	},
	{
		title: "Failed Leads",
		src: "/failed_leads-icon.svg",
		description: "Use CSV file with engaged but non-converting users",
	},
	{
		title: "Interest",
		src: "/interests-icon.svg",
		description: "Use information about users interested in specific topic",
	},
];
