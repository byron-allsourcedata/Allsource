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

import { IntegrationListController } from "@/app/features/premium-data/drawers/IntegrationList";
import { UserPremiumData } from "@/app/features/premium-data/pages/UserPremiumData";
import { sourcesSample } from "@/app/(client)/premium-data/sources/sample";
import { PremiumDataSyncsTable } from "@/app/(client)/premium-data/syncs/table";
import { premiumDataTheme } from "@/app/(client)/premium-data/theme";
import { sampleSyncs } from "@/app/(client)/premium-data/syncs/sample";
import {
	openDownloadPremiumSource,
	useBuyPremiumSource,
	useGetPremiumData,
	useGetPremiumSyncs,
	usePremiumSourceDownloadLinkRequest,
} from "../requests";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useRouter } from "next/navigation";
import GoogleAdsDataSync from "@/components/data-syncs/GoogleADSDataSync";
import { GoogleAdsPremiumSyncPopup } from "../drawers/GoogleAdsPremiumSync";
import type {
	FormattedPremiumSync,
	PremiumSync,
} from "@/app/(client)/premium-data/syncs/schemas";
import { UserPremiumSourceFirstTimeContent } from "../components/UserPremiumDataFirstTimeContent";
import { MetaPremiumSync } from "../drawers/MetaPremiumSync";
import { useDialog } from "@/hooks/useDialog";
import { PaymentDialog } from "../dialogs/payment-dialog/PaymentDialog";
import { useZohoChatToggle } from "@/hooks/useZohoChatToggle";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

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

export const UserPremiumDataPage: FC = () => {
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
	const {
		isOpen: paymentOpen,
		open: openPayment,
		close: closePayment,
	} = useDialog();

	useZohoChatToggle(paymentOpen || syncDrawerOpen);

	const [{ data: premiumDataData, loading }, refetchSources, cancelSources] =
		useGetPremiumData();

	const { data: downloadToken, request: getDownloadLink } =
		usePremiumSourceDownloadLinkRequest();

	const firstTimeLoading = loading && premiumDataData == null;

	const [{ data: premiumSyncsData }, refetchSyncs] = useGetPremiumSyncs();
	const {
		loading: buyLoading,
		request: buySource,
		cancel: cancelBuy,
	} = useBuyPremiumSource();

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

	const sources = premiumDataData ?? [];
	const syncs = premiumSyncsData?.map(formatSync) ?? [];

	const onDeleteSync = (syncId: string) => {};

	const pages = {
		sources: (
			<UserPremiumData
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
						showErrorToast("Failed to download premium data");
					}
				}}
				onUnlock={(source) => {
					setSelectedSource(source.id);
					openPayment();
				}}
			/>
		),
		syncs: (
			<PremiumDataSyncsTable
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

	if (firstTimeLoading || premiumDataData == null) {
		pageContent = <CustomizedProgressBar />;
	} else if (premiumDataData == null || premiumDataData?.length === 0) {
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
		<ThemeProvider theme={premiumDataTheme}>
			<PageContainer gap={"1rem"}>
				<Title>Premium Data</Title>
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
			<PaymentDialog
				sourceId={selectedSource!}
				price={sources?.find((s) => s.id === selectedSource)?.price ?? 0}
				open={paymentOpen}
				buyLoading={buyLoading}
				onClose={() => {
					cancelBuy();
					closePayment();
				}}
				onPay={(sourceId, amountCents, paymentMethod) => {
					buySource(sourceId, amountCents, paymentMethod)
						.then(() => {
							showToast("Premium data unlocked successfully");
							closePayment();
							refetchSources().catch(() => {});
						})
						.catch(() => {
							showErrorToast("Failed to buy premium data");
						});
				}}
			/>
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
				onClose={onClose}
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
