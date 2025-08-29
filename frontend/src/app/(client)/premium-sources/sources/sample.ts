import type { PremiumSourceData } from "@/app/features/premium-sources/schemas";

export const sourcesSample: PremiumSourceData[] = [
	{
		id: "1",
		name: "Very long premium source name that can be displayed at its full glory",
		created_at: "Jun 16, 2025",
		rows: "101,452",
		status: "ready",
	},
	{
		id: "2",
		name: "Audience end of may",
		created_at: "Jun 1, 2025",
		rows: "353,757",
		status: "syncing",
	},
	{
		id: "3",
		name: "Audience 1st half of may",
		created_at: "May 15, 2025",
		rows: "125,563",
		status: "ready",
	},
	{
		id: "4",
		name: "Audience end of april",
		created_at: "May 3, 2025",
		rows: "289,346",
		status: "synced",
	},
	{
		id: "5",
		name: "Audience 1st half of april",
		created_at: "Apr 18, 2025",
		rows: "465,254",
		status: "ready",
	},
	{
		id: "6",
		name: "Audience end of march",
		created_at: "Apr 2, 2025",
		rows: "198,352",
		status: "synced",
	},
];
