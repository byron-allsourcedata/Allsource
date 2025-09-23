import type { Status } from "@/app/features/premium-data/schemas";
import type { IntegrationStatus } from "../components/PlatformCard";

export type PremiumSync = {
	id: string;
	name: string;
	created_by: string;
	created_at: string;
	last_sync: string;
	sync_platform: string;
	rows: number;
	records_synced: number;
	progress: number;
	status: Status;
};

export type FormattedPremiumSync = PremiumSync & { __formatted: undefined }; // just something to disallow assigning this to a non-formatted object

export type PremiumSourceIntegration = {
	integration_id: number;
	service_name: string;
	image?: string;
	status: IntegrationStatus;
};
