export interface ActiveIntegration {
	service_name: string;
	image_url: string;
}

export interface IntegrationCredentials {
	access_token: string;
	service_name: string;
	shop_domain: string;
	ad_account_id: string;
	is_with_suppresions: boolean;
	error_message?: string;
	is_failed: boolean;
}
