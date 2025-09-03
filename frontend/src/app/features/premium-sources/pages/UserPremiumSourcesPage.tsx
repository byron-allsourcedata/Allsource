"use client";

import { Column } from "@/components/Column";
import {
	Drawer,
	LinearProgress,
	styled,
	Tab,
	Tabs,
	ThemeProvider,
	Typography,
} from "@mui/material";
import {
	useEffect,
	useState,
	type FC,
	type ReactNode,
	type SetStateAction,
} from "react";

import { IntegrationListController } from "@/app/features/premium-sources/drawers/IntegrationList";
import { UserPremiumSources } from "@/app/features/premium-sources/pages/UserPremiumSources";
import { sourcesSample } from "@/app/(client)/premium-sources/sources/sample";
import { PremiumSourcesSyncsTable } from "@/app/(client)/premium-sources/syncs/table";
import { premiumSourcesTheme } from "@/app/(client)/premium-sources/theme";
import { sampleSyncs } from "@/app/(client)/premium-sources/syncs/sample";
import {
	openDownloadPremiumSource,
	useGetPremiumSources,
	useGetPremiumSyncs,
	usePremiumSourceDownloadLinkRequest,
} from "../requests";
import { showErrorToast } from "@/components/ToastNotification";
import { useRouter } from "next/navigation";
import GoogleAdsDataSync from "@/app/(client)/data-sync/components/GoogleADSDataSync";
import { GoogleAdsPremiumSyncPopup } from "../drawers/GoogleAdsPremiumSync";
import type {
	FormattedPremiumSync,
	PremiumSync,
} from "@/app/(client)/premium-sources/syncs/schemas";
import { UserPremiumSourceFirstTimeContent } from "../components/UserPremiumSourceFirstTimeContent";
import { MetaPremiumSync } from "../drawers/MetaPremiumSync";

const Title = styled(Typography)`
    color: #202124;
    font-size: 19px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
`;

const PageContainer = styled(Column)`
	width: 100%;
    padding-top: 2.25rem;
	padding-right: 1.5rem;
`;

type TabData<Alias extends string = string> = {
	name: string;
	alias: Alias;
};

type TabMapping<Aliases extends string> = {
	tabs: TabData<Aliases>[];
};

function useTabs<Aliases extends string>(
	tabMapping: TabMapping<Aliases>,
	defaultTab: number = 0,
) {
	const [tab, setTab] = useState(defaultTab);
	const tabAlias = tabMapping.tabs[tab].alias;

	const onChange = (_e: React.SyntheticEvent, newValue: number) => {
		setTab(newValue);
	};

	const changeTab = (alias: Aliases) => {
		const index = tabMapping.tabs.findIndex((tab) => tab.alias === alias);
		if (index !== -1) {
			setTab(index);
		} else {
			throw new Error("Tab not found");
		}
	};

	return {
		tabAlias,
		tab,
		setTab,
		changeTab,
		props: {
			value: tab,
			onChange: onChange,
		},
	};
}

export const UserPremiumSourcesPage: FC = () => {
	const {
		tabAlias,
		props: tabProps,
		changeTab,
	} = useTabs(
		{
			tabs: [
				{
					name: "Sources",
					alias: "sources",
				},
				{
					name: "Syncs",
					alias: "syncs",
				},
			],
		},
		0,
	);
	const [selectedSource, setSelectedSource] = useState<string | null>(null);

	const [syncDrawerOpen, setSyncDrawerOpen] = useState(false);

	const [{ data: premiumSourcesData, loading }, refetchSources, cancelSources] =
		useGetPremiumSources();

	const { data: downloadToken, request: getDownloadLink } =
		usePremiumSourceDownloadLinkRequest();

	const firstTimeLoading = loading && premiumSourcesData == null;

	const [{ data: premiumSyncsData }, refetchSyncs] = useGetPremiumSyncs();

	const router = useRouter();

	useEffect(() => {
		const intervalId = setInterval(() => {
			refetchSources()
				.then((s) => {})
				.catch(() => {});
			refetchSyncs()
				.then(() => {})
				.catch(() => {});
		}, 5000) as unknown as number;

		return () => {
			clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		refetchSources().catch(() => {});
		refetchSyncs().catch(() => {});
	}, [refetchSources, refetchSyncs]);

	const sources = premiumSourcesData ?? [];
	const syncs = premiumSyncsData?.map(formatSync) ?? [];

	const onDeleteSync = (syncId: string) => {};

	const pages = {
		sources: (
			<UserPremiumSources
				sources={sources}
				onSync={(source) => {
					setSelectedSource(source.id);
					setSyncDrawerOpen(true);
				}}
				onDownload={async (source) => {
					try {
						const token = await getDownloadLink(source.id);
						if (token?.data) {
							openDownloadPremiumSource(token.data);
						}
					} catch (error) {
						showErrorToast("Failed to download premium source");
					}
				}}
			/>
		),
		syncs: (
			<PremiumSourcesSyncsTable
				syncs={syncs}
				onBeginSync={() => changeTab("sources")}
				onDelete={onDeleteSync}
			/>
		),
	};

	const onClose = () => {
		setSelectedSource(null);
		setSyncDrawerOpen(false);
	};

	let pageContent: ReactNode = null;

	if (firstTimeLoading || premiumSourcesData == null) {
		pageContent = <LinearProgress variant="indeterminate" />;
	} else if (premiumSourcesData == null || premiumSourcesData?.length === 0) {
		pageContent = <UserPremiumSourceFirstTimeContent />;
	} else {
		pageContent = (
			<Column gap="1rem">
				<Tabs {...tabProps}>
					<Tab label="Sources" />
					<Tab label="Syncs" />
				</Tabs>
				{pages[tabAlias]}
			</Column>
		);
	}

	return (
		<ThemeProvider theme={premiumSourcesTheme}>
			<PageContainer gap={"1rem"}>
				<Title>Premium Sources</Title>
				{pageContent}
			</PageContainer>
			<Drawer open={syncDrawerOpen} onClose={onClose} anchor="right">
				<PremiumSyncDrawerController
					premiumSourceId={selectedSource!}
					onAddIntegration={() => {
						router.push("/integrations");
					}}
					onClose={onClose}
					onAddedSync={() => {
						onClose();
						refetchSources().catch(() => {});
						refetchSyncs().catch(() => {});
						changeTab("syncs");
					}}
				/>
			</Drawer>
		</ThemeProvider>
	);
};

type IntegrationDrawerState =
	| {
			step: "pick_integration";
	  }
	| {
			step: "setup_integration";
			selectedIntegration: string;
			selectedIntegrationId: number;
	  };

type SyncDrawerProps = {
	premiumSourceId: string;
	onAddIntegration: (integration: string) => void;
	onClose: () => void;
	onAddedSync: () => void;
};
export const PremiumSyncDrawerController: FC<SyncDrawerProps> = ({
	premiumSourceId,
	onAddIntegration,
	onClose,
	onAddedSync,
}) => {
	// prem source id
	// integration id
	const router = useRouter();
	const [state, setState] = useState<IntegrationDrawerState>({
		step: "pick_integration",
	});

	const selectIntegration = (
		selectedIntegration: string,
		selectedIntegrationId: number,
	) => {
		setState({
			step: "setup_integration",
			selectedIntegration,
			selectedIntegrationId,
		});
	};

	if (state.step === "pick_integration") {
		return (
			<IntegrationListController
				onSelectIntegration={selectIntegration}
				onAddIntegration={onAddIntegration}
			/>
		);
	} else if (state.step === "setup_integration") {
		if (state.selectedIntegration === "meta") {
			return (
				<MetaPremiumSync
					open={true}
					onClose={onClose}
					data={{}}
					integrationId={state.selectedIntegrationId}
					premiumSourceId={premiumSourceId}
				/>
			);
		}
		return (
			<GoogleAdsPremiumSyncPopup
				integration_id={state.selectedIntegrationId}
				premium_source_id={premiumSourceId}
				onClose={() => {
					onClose();
				}}
				onAddedSync={() => {
					onClose();
					onAddedSync();
				}}
			/>
		);
	}

	return null;
};

function formatSync(sync: PremiumSync): FormattedPremiumSync {
	return {
		...sync,
		created_at: formatDate(sync.created_at),
		last_sync: formatDate(sync.last_sync),
		__formatted: undefined,
	};
}

function formatTime(time: string): string {
	return new Date(time).toLocaleString();
}

function formatDate(datetime: string): string {
	return new Date(datetime).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
