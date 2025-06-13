"use client";
import { Box, Skeleton } from "@mui/material";
import React, { useEffect, useState } from "react";
import DomainButton from "./DomainsButton";
import DomainStatusLabels from "./DomainStatusLabels";
import { useHasSubheader } from "@/hooks/useHasSubheader";
import { Domain } from "../analytics/components/DomainSelector";

export type DomainWithStat = {
	activate_percent: number;
	contacts_resolving: boolean;
	data_sync_failed: boolean;
	data_synced: boolean;
} & Domain;

const subheaderStyles = {
	headers: {
		display: "flex",
		padding: "1.125rem 1.5rem",
		pl: "6px",
		justifyContent: "space-between",
		alignItems: "center",
		minHeight: "4rem",
		maxHeight: "4rem",
		borderBottom: `1px solid rgba(228, 228, 228, 1)`,
		position: "sticky",
		overflowY: "hidden",
		top: 0,
		left: 0,
		right: 0,
		background: "#fff",
		zIndex: 10,
	},
};

const PixelSubheader: React.FC = () => {
	const hasSubheader = useHasSubheader();
	const [domain, setDomain] = useState<DomainWithStat | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!hasSubheader) return;

		const meItem = sessionStorage.getItem("me");
		const currentDomain = sessionStorage.getItem("current_domain");

		if (!meItem || !currentDomain) {
			setDomain(null);
			setLoading(false);
			return;
		}

		const meData = JSON.parse(meItem);
		const domains = meData?.domains || [];

		const foundDomain =
			domains.find((d: any) => d.domain === currentDomain) || null;
		setDomain(foundDomain);
		setLoading(false);
	}, [hasSubheader]);

	if (!hasSubheader) return null;

	return (
		<Box sx={{ display: "flex", width: "100%", flexDirection: "column" }}>
			<Box sx={{ display: "block" }}>
				<Box
					sx={{
						...subheaderStyles.headers,
						display: { xs: "none", md: "flex" },
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: "24px" }}>
						<DomainButton />
						{loading ? (
							<>
								<Skeleton
									variant="rectangular"
									width={100}
									height={24}
									sx={{ borderRadius: "200px" }}
								/>
								<Skeleton
									variant="rectangular"
									width={100}
									height={24}
									sx={{ borderRadius: "200px" }}
								/>
								<Skeleton
									variant="rectangular"
									width={100}
									height={24}
									sx={{ borderRadius: "200px" }}
								/>
							</>
						) : domain ? (
							<DomainStatusLabels
								isPixelInstalled={domain.is_pixel_installed}
								contactsResolving={domain.contacts_resolving}
								dataSynced={domain.data_synced}
								dataSyncFailed={domain.data_sync_failed}
							/>
						) : null}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default PixelSubheader;
