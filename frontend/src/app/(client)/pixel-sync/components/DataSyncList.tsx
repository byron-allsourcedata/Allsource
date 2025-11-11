import {
	Box,
	Typography,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Popover,
	Tooltip,
	DialogActions,
	DialogContent,
	DialogContentText,
	SxProps,
	Theme,
} from "@mui/material";
import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import KlaviyoDataSync from "@/components/data-syncs/KlaviyoDataSync";
import SalesForceDataSync from "@/components/data-syncs/SalesForceDataSync";
import MetaDataSync from "@/components/data-syncs/MetaDataSync";
import { leadsStyles } from "@/app/(client)/leads/leadsStyles";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { datasyncStyle } from "@/app/(client)/data-sync/datasyncStyle";
import MailchimpDatasync from "@/components/data-syncs/MailchimpDatasync";
import InstantlyDatasync from "@/components/data-syncs/InstantlyDataSync";
import GreenArrowDataSync from "@/components/data-syncs/GreenArrowDataSync";
import OmnisendDataSync from "@/components/data-syncs/OmnisendDataSync";
import SendlaneDatasync from "@/components/data-syncs/SendlaneDatasync";
import S3Datasync from "@/components/data-syncs/S3Datasync";
import WebhookDatasync from "@/components/data-syncs/WebhookDatasync";
import SlackDatasync from "@/components/data-syncs/SlackDataSync";
import GoogleADSDatasync from "@/components/data-syncs/GoogleADSDataSync";
import KlaviyoIntegrationPopup from "@/components/integrations/KlaviyoIntegration";
import SalesForceIntegrationPopup from "@/components/integrations/SalesForceIntegration";
import MailchimpConnect from "@/components/integrations/MailchimpIntegration";
import OmnisendConnect from "@/components/integrations/OmnisendIntegration";
import SendlaneConnect from "@/components/integrations/SendlaneIntegration";
import S3Connect from "@/components/integrations/S3Integration";
import ZapierConnectPopup from "@/components/integrations/ZapierIntegration";
import SlackConnectPopup from "@/components/integrations/SlackIntegration";
import GoogleADSConnectPopup from "@/components/integrations/GoogleADSIntegration";
import WebhookConnectPopup from "@/components/integrations/WebhookIntegration";
import { useIntegrationContext } from "@/context/IntegrationContext";
import HubspotDataSync from "@/components/data-syncs/HubspotDataSync";
import HintCard from "../../components/HintCard";
import { useDataSyncHints } from "../context/dataSyncHintsContext";
import { useNotification } from "@/context/NotificationContext";
import { SmartCell } from "@/components/table";
import { useScrollShadow } from "@/hooks/useScrollShadow";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { usePagination } from "@/hooks/usePagination";
import { Paginator } from "@/components/PaginationComponent";
import { useClampTableHeight } from "@/hooks/useClampTableHeight";
import GoHighLevelConnectPopup from "@/components/integrations/GoHighLevelIntegration";
import GoHighLevelDataSync from "@/components/data-syncs/GoHighLevelDataSync";
import CustomerIoConnect from "@/components/integrations/CustomerIoIntegration";
import CustomerIoDataSync from "@/components/data-syncs/CustomerIoDataSync";
import HubspotIntegrationPopup from "@/components/integrations/HubspotIntegration";
import { useZohoChatToggle } from "@/hooks/useZohoChatToggle";
import { filterDefaultPaginationOptions } from "@/utils/pagination";
import PlatformIconWithNameInTooltip from "@/components/ui/tooltips/PlatformIconWithNameInTooltip";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";

interface DataSyncProps {
	service_name?: string | null;
	filters?: any;
	isFirstLoad?: boolean;
}

interface IntegrationsCredentials {
	id?: number;
	access_token?: string;
	shop_domain?: string;
	data_center?: string;
	service_name: string;
	is_with_suppression?: boolean;
	is_failed?: boolean;
}

interface PixelSyncRow {
	contacts: number;
	processed_contacts: number;
}

const DataSyncList = memo(({ service_name, filters }: DataSyncProps) => {
	const { needsSync, setNeedsSync } = useIntegrationContext();
	const [order, setOrder] = useState<"asc" | "desc" | undefined>(undefined);
	const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [Loading, setLoading] = useState(false);
	const [data, setData] = useState<any[]>([]);
	const [allData, setAllData] = useState<any[]>([]);
	const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
	const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
	const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
	const [mailchimpIconPopupOpen, setMailchimpIconPopupOpen] = useState(false);
	const [instantlyIconPopupOpen, setInstantlyIconPopupOpen] = useState(false);
	const [greenArrowIconPopupOpen, setGreenArrowIconPopupOpen] = useState(false);
	const [omnisendIconPopupOpen, setOmnisendIconPopupOpen] = useState(false);

	const [totalRows, setTotalRows] = useState(0);
	const [sendlaneIconPopupOpen, setOpenSendlaneIconPopup] = useState(false);
	const [s3IconPopupOpen, setOpenS3IconPopup] = useState(false);
	const [webhookIconPopupOpen, setOpenWebhookIconPopup] = useState(false);
	const [hubspotIconPopupOpen, setOpenHubspotIconPopup] = useState(false);
	const [goHighLevelIconPopupOpen, setOpenGoHighLevelIconPopup] =
		useState(false);
	const [customerIoIconPopupOpen, setCustomerIoIconPopupOpen] = useState(false);
	const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false);
	const [googleADSIconPopupOpen, setOpenGoogleADSIconPopup] = useState(false);
	const [linkedinIconPopupOpen, setOpenLinkedinIconPopup] = useState(false);
	const [isEdit, setIsEdit] = useState(false);
	const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
	const [integrationsCredentials, setIntegrationsCredentials] = useState<
		IntegrationsCredentials[]
	>([]);
	const tableContainerRef = useRef<HTMLDivElement>(null);
	const { isScrolledX, isScrolledY } = useScrollShadow(
		tableContainerRef,
		data.length,
	);

	const [openMetaConnect, setOpenMetaConnect] = useState(false);
	const [openKlaviyoConnect, setOpenKlaviyoConnect] = useState(false);
	const [openHubspotConnect, setOpenHubspotConnect] = useState(false);

	const [openSalesForceConnect, setOpenSalesForceConnect] = useState(false);
	const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false);
	const [openMailchimpConnect, setOpenMailchimpConnect] = useState(false);
	const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false);
	const [openCustomerIoConnect, setOpenCustomerIoConnect] = useState(false);
	const [openS3Connect, setOpenS3Connect] = useState(false);
	const [openGoogleADSConnect, setOpenGoogleADSConnect] = useState(false);
	const [openGoHighLevelConnect, setOpenGoHighLevelConnect] = useState(false);
	const [openLinkedinConnect, setOpenLinkedinConnect] = useState(false);
	const [openZapierConnect, setOPenZapierComnect] = useState(false);
	const [openSlackConnect, setOpenSlackConnect] = useState(false);
	const [openWebhookConnect, setOpenWebhookConnect] = useState(false);

	const paginationProps = usePagination(totalRows ?? 0);

	const { page, rowsPerPage } = paginationProps;

	const handleCloseIntegrate = () => {
		setOpenMetaConnect(false);
		setOpenKlaviyoConnect(false);
		setOpenHubspotConnect(false);
		setOpenSalesForceConnect(false);
		setOpenOmnisendConnect(false);
		setOpenSendlaneConnect(false);
		setOpenS3Connect(false);
		setOPenZapierComnect(false);
		setOpenSlackConnect(false);
	};

	const paginatorRef = useClampTableHeight(tableContainerRef, 8, 120);

	const handleSortRequest = (property: string) => {
		const isAsc = orderBy === property && order === "asc";
		setOrder(isAsc ? "desc" : "asc");
		setOrderBy(property);
	};
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

	const { hints, cards, changeDataSyncHint, resetDataSyncHints } =
		useDataSyncHints();
	const { hasNotification } = useNotification();

	useEffect(() => {
		handleIntegrationsSync();
		resetDataSyncHints();
	}, []);

	const isAllContactsSynced = (data: PixelSyncRow[]): boolean => {
		// if even one row contacts != processed_contancts => not synced => continue polling
		for (const row of data) {
			if (row.contacts != row.processed_contacts) {
				return false;
			}
		}
		return true;
	};

	const needsSyncRef = useRef(needsSync);
	const isEditRef = useRef(isEdit);

	useEffect(() => {
		needsSyncRef.current = needsSync;
		isEditRef.current = isEdit;
	}, [needsSync, isEdit]);

	const handleIntegrationsSync = useCallback(async () => {
		try {
			if (isFirstLoad) {
				setIsLoading(true);
				setIsFirstLoad(false);
			} else {
				setIsLoading(false);
			}

			const params = service_name ? { service_name } : null;

			const { data } = await axiosInstance.get("/data-sync/sync", { params });

			setAllData(data);
			setTotalRows(data.length);

			if (isAllContactsSynced(data)) {
				setNeedsSync(false);
			}
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === 403) {
				const status = error.response.data.status;
				if (status === "NEED_BOOK_CALL") {
					sessionStorage.setItem("is_slider_opened", "true");
				}
			}
		} finally {
			setIsLoading(false);
		}
	}, [service_name, isFirstLoad]);

	useEffect(() => {
		const pollingInterval = 5000;

		const id = setInterval(() => {
			if (!needsSyncRef.current || isEditRef.current) return;

			if (!isLoading) {
				handleIntegrationsSync();
			}
		}, pollingInterval);

		return () => clearInterval(id);
	}, [isLoading, handleIntegrationsSync]);

	const toSnakeCase = (service: string) => {
		return service.split(" ").join("_").toLowerCase();
	};

	useEffect(() => {
		if (allData.length !== 0) {
			if (filters) {
				const filterData = () => {
					return Object.values(allData).filter((item) => {
						const createDate = new Date(item.createdDate).getTime() / 1000;
						const dateMatch =
							filters.from_date === null ||
							filters.to_date === null ||
							(createDate >= filters.from_date &&
								createDate <= filters.to_date);

						const statusMatch =
							filters.selected_status.length === 0 ||
							filters.selected_status
								.map((funnel: string) => funnel.toLowerCase())
								.includes(item.status.toLowerCase());

						const searchMatch =
							filters.searchQuery.length === 0 ||
							item.createdBy
								.toLowerCase()
								.includes(filters.searchQuery.toLowerCase()) ||
							item.name
								?.toLowerCase()
								.includes(filters.searchQuery.toLowerCase());

						const platformMatch =
							filters.selected_destination.length === 0 ||
							filters.selected_destination
								.map((service: string) => toSnakeCase(service))
								.includes(item.platform.toLowerCase());

						return searchMatch && dateMatch && statusMatch && platformMatch;
					});
				};
				setData(filterData());
			} else {
				setData(allData);
			}
		}
	}, [filters, allData]);

	const platformIcon = (platform: string) => {
		switch (platform) {
			case "klaviyo":
				return (
					<Image src={"/klaviyo.svg"} alt="klaviyo" width={18} height={18} />
				);
			case "meta":
				return (
					<Image src={"/meta-icon.svg"} alt="klaviyo" width={18} height={18} />
				);
			case "omnisend":
				return (
					<Image
						src={"/omnisend_icon_black.svg"}
						alt="omnisend"
						width={18}
						height={18}
					/>
				);
			case "mailchimp":
				return (
					<Image
						src={"/mailchimp-icon.svg"}
						alt="mailchimp"
						width={18}
						height={18}
					/>
				);
			case "sendlane":
				return (
					<Image
						src={"/sendlane-icon.svg"}
						alt="mailchimp"
						width={18}
						height={18}
					/>
				);
			case "zapier":
				return (
					<Image src={"/zapier-icon.svg"} alt="zapier" width={18} height={18} />
				);
			case "s3":
				return <Image src={"/s3.svg"} alt="s3" width={18} height={18} />;
			case "webhook":
				return (
					<Image
						src={"/webhook-icon.svg"}
						alt="webhook"
						width={18}
						height={18}
					/>
				);
			case "slack":
				return (
					<Image src={"/slack-icon.svg"} alt="Slack" width={18} height={18} />
				);
			case "hubspot":
				return (
					<Image src={"/hubspot.svg"} alt="hubspot" width={18} height={18} />
				);
			case "go_high_level":
				return (
					<Image
						src="./go-high-level-icon.svg"
						alt="goHighLevel icon"
						width={20}
						height={20}
					/>
				);
			case "customer_io":
				return (
					<Image
						src="./customer-io-icon.svg"
						alt="customer_io icon"
						width={20}
						height={20}
					/>
				);
			case "google_ads":
				return (
					<Image
						src={"/google-ads.svg"}
						alt="googleAds"
						width={18}
						height={18}
					/>
				);
			case "sales_force":
				return (
					<Image
						src={"/salesforce-icon.svg"}
						alt="salesForce"
						width={18}
						height={18}
					/>
				);
			case "bing_ads":
				return (
					<Image src={"/bing-ads.svg"} alt="bingAds" width={18} height={18} />
				);
			case "instantly":
				return (
					<Image
						src={"/instantly-icon.svg"}
						alt="bingAds"
						width={18}
						height={18}
					/>
				);
			case "green_arrow":
				return (
					<Image
						src={"/green_arrow-icon.svg"}
						alt="greenArrow"
						width={18}
						height={18}
					/>
				);
			default:
				return <MailOutlinedIcon />;
		}
	};

	// Action
	const [anchorEl, setAnchorEl] = useState(null);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [confirmAnchorEl, setConfirmAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const handleClick = (event: any, id: number) => {
		setAnchorEl(event.currentTarget);
		setSelectedId(id);
	};

	const handleClose = () => {
		setAnchorEl(null);
		setSelectedId(null);
	};

	const open = Boolean(anchorEl);
	const id = open ? "simple-popover" : undefined;

	const handleToggleSync = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.post(
				"/data-sync/sync/switch-toggle-smart-audience-sync",
				{
					list_id: String(selectedId),
				},
			);
			if (response.status === 200) {
				switch (response.data.status) {
					case "SUCCESS":
						if (response.data.data_sync) {
							showToast("Pixel Sync enabled successfully");
						} else {
							showToast("Pixel Sync is disabled");
						}
						setData((prevData) =>
							prevData.map((item) =>
								item.id === selectedId
									? {
											...item,
											dataSync: response.data.data_sync,
										}
									: item,
							),
						);
						break;
					case "FAILED":
						showErrorToast("Integrations sync delete failed");
						break;
					default:
						showErrorToast("Unknown response received.");
				}
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response && error.response.status === 403) {
					showErrorToast(
						"Access denied: You do not have permission to remove this member.",
					);
				}
			}
		} finally {
			setIsLoading(false);
			setSelectedId(null);
			handleClose();
		}
	};

	const handleKlaviyoIconPopupClose = async () => {
		setKlaviyoIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleSalesForceIconPopupClose = async () => {
		setSalesForceIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleMetaIconPopupClose = async () => {
		setMetaIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleMailchimpIconPopupClose = async () => {
		setMailchimpIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleInstantlyIconPopupClose = async () => {
		setInstantlyIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleGreenArrowIconPopupClose = async () => {
		setGreenArrowIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleOmnisendIconPopupClose = async () => {
		setOmnisendIconPopupOpen(false);
		setSelectedId(null);
		setIsEdit(false);
		try {
			const response = await axiosInstance.get(
				`/data-sync/sync?integrations_users_sync_id=${selectedId}`,
			);
			if (response) {
				setData((prevData) =>
					prevData.map((item) =>
						item.id === selectedId ? { ...item, ...response.data } : item,
					),
				);
			}
		} catch (error) {}
	};

	const handleEdit = async () => {
		const foundItem = data.find((item) => item.id === selectedId);
		const dataSyncPlatform = foundItem ? foundItem.platform : null;
		if (dataSyncPlatform) {
			setIsEdit(true);
			if (dataSyncPlatform === "klaviyo") {
				setKlaviyoIconPopupOpen(true);
			} else if (dataSyncPlatform === "meta") {
				setMetaIconPopupOpen(true);
			} else if (dataSyncPlatform === "mailchimp") {
				setMailchimpIconPopupOpen(true);
			} else if (dataSyncPlatform === "omnisend") {
				setOmnisendIconPopupOpen(true);
			} else if (dataSyncPlatform === "sendlane") {
				setOpenSendlaneIconPopup(true);
			} else if (dataSyncPlatform === "s3") {
				setOpenS3IconPopup(true);
			} else if (dataSyncPlatform === "slack") {
				setOpenSlackIconPopup(true);
			} else if (dataSyncPlatform === "google_ads") {
				setOpenGoogleADSIconPopup(true);
			} else if (dataSyncPlatform === "linkedin") {
				setOpenLinkedinIconPopup(true);
			} else if (dataSyncPlatform === "webhook") {
				setOpenWebhookIconPopup(true);
			} else if (dataSyncPlatform === "hubspot") {
				setOpenHubspotIconPopup(true);
			} else if (dataSyncPlatform === "sales_force") {
				setSalesForceIconPopupOpen(true);
			} else if (dataSyncPlatform === "go_high_level") {
				setOpenGoHighLevelIconPopup(true);
			} else if (dataSyncPlatform === "instantly") {
				setInstantlyIconPopupOpen(true);
			} else if (dataSyncPlatform === "green_arrow") {
				setGreenArrowIconPopupOpen(true);
			}

			setIsLoading(false);
			setAnchorEl(null);
		}
	};

	useZohoChatToggle(
		klaviyoIconPopupOpen ||
			metaIconPopupOpen ||
			mailchimpIconPopupOpen ||
			instantlyIconPopupOpen ||
			greenArrowIconPopupOpen ||
			omnisendIconPopupOpen ||
			openSendlaneConnect ||
			openS3Connect ||
			openSlackConnect ||
			openGoogleADSConnect ||
			openLinkedinConnect ||
			openWebhookConnect ||
			openHubspotConnect ||
			openSalesForceConnect ||
			openGoHighLevelConnect ||
			salesForceIconPopupOpen ||
			hubspotIconPopupOpen ||
			googleADSIconPopupOpen ||
			goHighLevelIconPopupOpen ||
			customerIoIconPopupOpen ||
			openCustomerIoConnect ||
			openMetaConnect ||
			openKlaviyoConnect ||
			openMailchimpConnect ||
			openOmnisendConnect,
	);

	const handleSendlaneIconPopupClose = () => {
		setIsEdit(false);
		setOpenSendlaneIconPopup(false);
	};

	const handleS3IconPopupClose = () => {
		setIsEdit(false);
		setOpenS3IconPopup(false);
	};

	const handleWebhookIconPopupClose = () => {
		setIsEdit(false);
		setOpenWebhookIconPopup(false);
	};

	const handleHubspotIconPopupClose = () => {
		setIsEdit(false);
		setOpenHubspotIconPopup(false);
	};

	const handleGoHighLevelIconPopupClose = () => {
		setIsEdit(false);
		setOpenGoHighLevelIconPopup(false);
	};

	const handleCustomerIoIconPopupClose = async () => {
		setIsEdit(false);
		setCustomerIoIconPopupOpen(false);
	};

	const handleSlackIconPopupClose = () => {
		setIsEdit(false);
		setOpenSlackIconPopup(false);
	};

	const handleGoogleADSIconPopupClose = () => {
		setIsEdit(false);
		setOpenGoogleADSIconPopup(false);
	};

	const handleLinkedinIconPopupClose = () => {
		setIsEdit(false);
		setOpenLinkedinIconPopup(false);
	};

	const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setConfirmAnchorEl(event.currentTarget);
		setIsConfirmOpen(true);
	};

	const handleOpenConfirmDialog = () => {
		setOpenConfirmDialog(true);
	};

	const handleCloseConfirmDialog = () => {
		setOpenConfirmDialog(false);
	};

	const handleDelete = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.delete(
				`/data-sync/sync`,
				{
					params: {
						list_id: selectedId,
					},
				},
			);

			if (response.status === 200) {
				switch (response.data.status) {
					case "SUCCESS":
						showToast("Integrations sync delete successfully");
						setData((prevData) =>
							prevData.filter((item) => item.id !== selectedId),
						);
						handleIntegrationsSync();
						break;
					case "FAILED":
						showErrorToast("Integrations sync delete failed");
						break;
					default:
						showErrorToast("Unknown response received.");
				}
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response && error.response.status === 403) {
					showErrorToast(
						"Access denied: You do not have permission to remove this member.",
					);
				}
			}
		} finally {
			setIsLoading(false);
			setSelectedId(null);
			handleClose();
			handleCloseConfirmDialog();
		}
	};

	const handleRepairSync = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get("/integrations/credentials/");
			if (response.status === 200) {
				setIntegrationsCredentials(response.data);
			}
			const foundItem = data.find((item) => item.id === selectedId);
			const dataSyncPlatform = foundItem ? foundItem.platform : null;
			if (
				foundItem.type_error === "Invalid API Key" ||
				foundItem.integration_is_failed
			) {
				setIsInvalidApiKey(true);
				if (dataSyncPlatform) {
					if (dataSyncPlatform === "klaviyo") {
						setOpenKlaviyoConnect(true);
					} else if (dataSyncPlatform === "meta") {
						setOpenMetaConnect(true);
					} else if (dataSyncPlatform === "mailchimp") {
						setOpenMailchimpConnect(true);
					} else if (dataSyncPlatform === "omnisend") {
						setOpenOmnisendConnect(true);
					} else if (dataSyncPlatform === "sendlane") {
						setOpenSendlaneConnect(true);
					} else if (dataSyncPlatform === "s3") {
						setOpenS3Connect(true);
					} else if (dataSyncPlatform === "google_ads") {
						setOpenGoogleADSConnect(true);
					} else if (dataSyncPlatform === "go_high_level") {
						setOpenGoHighLevelIconPopup(true);
					} else if (dataSyncPlatform === "linkedin") {
						setOpenLinkedinConnect(true);
					} else if (dataSyncPlatform === "webhook") {
						setOpenWebhookConnect(true);
					} else if (dataSyncPlatform === "hubspot") {
						setOpenHubspotConnect(true);
					} else if (dataSyncPlatform === "sales_force") {
						setOpenSalesForceConnect(true);
					}
					setIsLoading(false);
					setAnchorEl(null);
				}
			} else {
				if (dataSyncPlatform) {
					setIsEdit(true);
					if (dataSyncPlatform === "klaviyo") {
						setKlaviyoIconPopupOpen(true);
					} else if (dataSyncPlatform === "meta") {
						setMetaIconPopupOpen(true);
					} else if (dataSyncPlatform === "mailchimp") {
						setMailchimpIconPopupOpen(true);
					} else if (dataSyncPlatform === "omnisend") {
						setOmnisendIconPopupOpen(true);
					} else if (dataSyncPlatform === "sendlane") {
						setOpenSendlaneIconPopup(true);
					} else if (dataSyncPlatform === "google_ads") {
						setOpenGoogleADSIconPopup(true);
					} else if (dataSyncPlatform === "webhook") {
						setOpenWebhookIconPopup(true);
					} else if (dataSyncPlatform === "hubspot") {
						setOpenHubspotIconPopup(true);
					} else if (dataSyncPlatform === "sales_force") {
						setSalesForceIconPopupOpen(true);
					} else if (dataSyncPlatform === "go_high_level") {
						setOpenGoHighLevelIconPopup(true);
					}

					setIsLoading(false);
					setAnchorEl(null);
				}
			}
		} catch (error) {}
	};

	if (Loading) {
		return <CustomizedProgressBar />;
	}

	const formatStatusText = (row: any) => {
		if (row.dataSync === false) {
			return "Disabled";
		}
		if (row.syncStatus === false) {
			return "Failed";
		}
		if (
			row.contacts === row.processed_contacts &&
			row.processed_contacts !== 0
		) {
			return "Synced";
		}

		if (row.dataSync === true) {
			return "Syncing";
		}

		return "--";
	};

	const getStatusStyle = (row: any) => {
		if (row.dataSync === false) {
			return {
				background: "rgba(219, 219, 219, 1)",
				color: "rgba(74, 74, 74, 1) !important",
				toolTipText: "Pixel sync is disabled",
			};
		}
		if (row.syncStatus === false) {
			return {
				background: "rgba(252, 205, 200, 1)",
				color: "rgba(200, 62, 46, 1) !important",
				toolTipText: "You have an error, ",
			};
		}
		if (row.contacts === row.processed_contacts) {
			return {
				background: "rgba(234, 248, 221, 1)",
				color: "rgba(43, 91, 0, 1)",
				toolTipText: "All your contacts have been synced",
			};
		}
		if (row.dataSync) {
			return {
				background: "#CCE6FE",
				color: "#0081FB",
				toolTipText: "Your contacts are being synced every 1 minutes",
			};
		}

		return { background: "transparent", color: "rgba(74, 74, 74, 1)" };
	};

	if (service_name && data.length < 1) {
		return null;
	}

	const listType = (listType: string) => {
		switch (listType) {
			case "allContacts":
				return "All Contacts";
			case "viewed_product":
				return "View Product";
			case "converted_sales":
				return "Converted sales";
			case "visitor":
				return "Visitors";
			case "abandoned_cart":
				return "Abandoned cart";
			default:
				return null;
		}
	};

	const handleDownloadPersons = async () => {
		setIsLoading(true);
		try {
			const response = await axiosInstance.post(
				`/data-sync/download-persons?id=${selectedId}`,
				{
					responseType: "blob",
				},
			);

			if (response.status === 200) {
				const url = window.URL.createObjectURL(new Blob([response.data]));
				const link = document.createElement("a");
				link.href = url;
				link.setAttribute("download", "data.csv");
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			} else {
				showErrorToast(`Error downloading file`);
			}
		} catch {
		} finally {
			setIsLoading(false);
		}
	};

	const columns = [
		{
			key: "list_type",
			label: "List Type",
			widths: { width: "100px", minWidth: "100px", maxWidth: "20vw" },
		},
		{
			key: "list_name",
			label: "List Name",
			widths: { width: "100px", minWidth: "100px", maxWidth: "14vw" },
		},
		{
			key: "platform",
			label: "Destination",
			widths: { width: "115px", minWidth: "115px", maxWidth: "20vw" },
		},
		{
			key: "created",
			label: "Created",
			sortable: false,
			widths: { width: "115px", minWidth: "115px", maxWidth: "115px" },
		},
		{
			key: "last_sync",
			label: "Last Sync",
			widths: { width: "115px", minWidth: "115px", maxWidth: "20vw" },
		},
		{
			key: "data_sync",
			label: "No of Contacts",
			widths: { width: "120px", minWidth: "120px", maxWidth: "12vw" },
		},
		{
			key: "validation_contacts",
			label: "Valid emails",
			widths: {
				width: "100px",
				minWidth: "100px",
				maxWidth: "8vw",
			},
		},
		{
			key: "synced_contacts",
			label: "Synced",
			widths: {
				width: "80px",
				minWidth: "80px",
				maxWidth: "8vw",
			},
		},
		{
			key: "sync_status",
			label: "Status",
			widths: { width: "120px", minWidth: "120px", maxWidth: "8vw" },
		},
		{
			key: "action",
			label: "Actions",
			widths: { width: "80px", minWidth: "80px", maxWidth: "80px" },
		},
	];
	return (
		<>
			{isLoading && <CustomizedProgressBar />}
			{service_name && (
				<>
					<Box
						display={"flex"}
						sx={{
							alignItems: "center",
							mt: 2,
							mb: "16px",
							height: "100%",
						}}
					>
						<Box
							sx={{
								backgroundColor: "#E4E4E4",
								padding: "3px",
								borderRadius: "50%",
							}}
						/>
						<Box
							sx={{
								backgroundColor: "#E4E4E4",
								border: "1px dashed #fff",
								width: "100%",
							}}
						/>
						<Box
							sx={{
								backgroundColor: "#E4E4E4",
								padding: "3px",
								borderRadius: "50%",
							}}
						/>
					</Box>
					<Typography
						fontSize={"16px"}
						fontWeight={600}
						fontFamily="var(--font-nunito)"
						textTransform={"capitalize"}
					>
						{service_name} Sync Detail
					</Typography>
				</>
			)}
			<Box sx={datasyncStyle.mainContent}>
				<Box
					sx={{
						width: "100%",
						pl: 0.5,
						pt: 3,
						pr: 1,
						"@media(max-width: 440px)": {
							marginTop: "16px",
							pr: 0,
							pl: 0,
						},
					}}
				>
					<TableContainer
						ref={tableContainerRef}
						sx={{
							overflowX: "auto",
						}}
					>
						<Table
							stickyHeader
							aria-label="datasync table"
							component={Paper}
							sx={{
								tableLayout: "fixed",
							}}
						>
							<TableHead sx={{ position: "relative" }}>
								<TableRow>
									{columns.map((col) => {
										const { key, label, sortable = false, widths } = col;

										const isNameColumn = key === "list_type";
										const isActionsColumn = key === "action";
										const hideDivider =
											(isNameColumn && isScrolledX) || isActionsColumn;
										const baseCellSX: SxProps<Theme> = {
											...widths,
											position: "sticky",
											top: 0,
											zIndex: 97,
											borderTop: "1px solid rgba(235,235,235,1)",
											borderBottom: "1px solid rgba(235,235,235,1)",
											cursor: sortable ? "pointer" : "default",
											borderRight: isActionsColumn
												? "1px solid rgba(235,235,235,1)"
												: "none",
											whiteSpace:
												isActionsColumn || isNameColumn ? "normal" : "wrap",
											overflow:
												isActionsColumn || isNameColumn ? "visible" : "hidden",
										};
										if (isNameColumn) {
											baseCellSX.left = 0;
											baseCellSX.zIndex = 99;
											baseCellSX.boxShadow = isScrolledX
												? "3px 0px 3px rgba(0,0,0,0.2)"
												: "none";
										}
										const className = isNameColumn ? "sticky-cell" : undefined;
										const onClickHandler = sortable
											? () => handleSortRequest(key)
											: undefined;
										return (
											<SmartCell
												key={key}
												cellOptions={{
													sx: baseCellSX,
													hideDivider,
													onClick: onClickHandler,
													className,
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														position: "relative",
														justifyContent: "space-between",
													}}
												>
													<Typography
														variant="body2"
														sx={{
															...leadsStyles.table_column,
															borderRight: "0",
														}}
													>
														{label}
													</Typography>
													{key === "action" && (
														<HintCard
															card={cards.action}
															positionLeft={-395}
															positionTop={78}
															rightSide={true}
															isOpenBody={hints.action.showBody}
															toggleClick={() => {
																changeDataSyncHint(
																	"action",
																	"showBody",
																	"toggle",
																);
															}}
															closeClick={() =>
																changeDataSyncHint(
																	"action",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
													{sortable && (
														<IconButton size="small">
															{orderBy === key ? (
																order === "asc" ? (
																	<ArrowUpwardRoundedIcon fontSize="inherit" />
																) : (
																	<ArrowDownwardRoundedIcon fontSize="inherit" />
																)
															) : (
																<SwapVertIcon fontSize="inherit" />
															)}
														</IconButton>
													)}
												</Box>
											</SmartCell>
										);
									})}
								</TableRow>
							</TableHead>
							<TableBody>
								{data.length === 0 ? (
									<TableRow sx={datasyncStyle.tableBodyRow}>
										<TableCell
											colSpan={10}
											sx={{
												...datasyncStyle.tableBodyColumn,
												textAlign: "center",
												paddingTop: "18px",
												paddingBottom: "18px",
											}}
										>
											No pixel synchronization available
										</TableCell>
									</TableRow>
								) : (
									data.map((row) => (
										<TableRow
											key={row.id}
											sx={{
												backgroundColor: "#fff",
												"&:hover": {
													backgroundColor: "rgba(247, 247, 247, 1)",
													"& .sticky-cell": {
														backgroundColor: "rgba(247, 247, 247, 1)",
													},
												},
												"&:last-of-type .MuiTableCell-root": {
													borderBottom: "none",
												},
											}}
										>
											<SmartCell
												cellOptions={{
													className: "sticky-cell",
													sx: {
														zIndex: 9,
														position: "sticky",
														left: 0,
														backgroundColor: "#fff",
														boxShadow: isScrolledX
															? "3px 0px 3px #00000033"
															: "none",
													},
													hideDivider: isScrolledX,
												}}
												tooltipOptions={{
													content: listType(row.type) || "--",
												}}
											>
												{listType(row.type) || "--"}
											</SmartCell>

											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
													},
												}}
												tooltipOptions={{
													content: row.list_name ?? "--",
												}}
											>
												{row.list_name ?? "--"}
											</SmartCell>

											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
													},
												}}
												tooltipOptions={{
													content: row.platform || "--",
												}}
											>
												<Box
													sx={{
														display: "flex",
														justifyContent: "center",
													}}
												>
													<PlatformIconWithNameInTooltip
														getPlatformIcon={platformIcon}
														platformName={row.platform}
													/>
												</Box>
											</SmartCell>

											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
														pr: 0,
													},
												}}
												tooltipOptions={{
													content: (
														<Box
															sx={{
																display: "flex",
																flexDirection: "column",
															}}
														>
															<span>{row.createdBy || "--"}</span>
															<span>{row.createdDate || "--"}</span>
														</Box>
													),
												}}
											>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														lineHeight: 1.4,
													}}
												>
													<Typography
														sx={{
															...datasyncStyle.table_array,
														}}
													>
														{row.createdBy || "--"}
													</Typography>
													<Typography
														sx={{
															...datasyncStyle.table_array,
														}}
													>
														{row.createdDate || "--"}
													</Typography>
												</Box>
											</SmartCell>

											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
													},
												}}
												tooltipOptions={{
													content: row.lastSync || "--",
												}}
											>
												{row.lastSync || "--"}
											</SmartCell>
											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
													},
												}}
												tooltipOptions={{
													content:
														row.active_segments === -1
															? "unlimit"
															: new Intl.NumberFormat("en-US").format(
																	row.active_segments,
																) || "--",
												}}
											>
												{row.contacts?.toLocaleString("en-US")}
											</SmartCell>
											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
													},
												}}
												tooltipOptions={{
													content:
														row.active_segments === -1
															? "unlimit"
															: new Intl.NumberFormat("en-US").format(
																	row.active_segments,
																) || "--",
												}}
											>
												{!row.is_user_validations &&
												row.validation_contacts === 0 ? (
													<Tooltip
														title={
															<Box
																sx={{
																	backgroundColor: "#fff",
																	margin: 0,
																	padding: 0,
																	display: "flex",
																	flexDirection: "row",
																	alignItems: "center",
																}}
															>
																<Typography
																	className="table-data"
																	component="div"
																	sx={{ fontSize: "12px !important" }}
																>
																	Email validation was disabled for your domain,
																	contact support
																</Typography>
															</Box>
														}
														componentsProps={{
															tooltip: {
																sx: {
																	backgroundColor: "#fff",
																	color: "#000",
																	boxShadow:
																		"0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
																	border: "0.2px solid rgba(255, 255, 255, 1)",
																	borderRadius: "4px",
																	maxHeight: "100%",
																	maxWidth: "500px",
																	padding: "11px 10px",
																},
															},
														}}
													>
														<Typography className="table-data">
															Not validating
														</Typography>
													</Tooltip>
												) : (
													row.validation_contacts?.toLocaleString("en-US")
												)}
											</SmartCell>
											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
													},
												}}
												tooltipOptions={{
													content:
														row.active_segments === -1
															? "unlimit"
															: new Intl.NumberFormat("en-US").format(
																	row.active_segments,
																) || "--",
												}}
											>
												{row.synced_contacts?.toLocaleString("en-US")}
											</SmartCell>
											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
														padding: 0,
														textAlign: "center",
													},
												}}
											>
												<Box
													sx={{
														display: "flex",
														justifyContent: "center",
													}}
												>
													<Box
														sx={{
															display: "inline-flex",
															borderRadius: "2px",
															textTransform: "capitalize",
															minWidth: "80px",
															justifyContent: "center",
														}}
													>
														{(() => {
															const { color, background, toolTipText } =
																getStatusStyle(row);
															return (
																<Tooltip
																	title={
																		<Box
																			sx={{
																				backgroundColor: "#fff",
																				margin: 0,
																				padding: 0,
																				display: "flex",
																				flexDirection: "row",
																				alignItems: "center",
																			}}
																		>
																			<Typography
																				className="table-data"
																				component="div"
																				sx={{
																					fontSize: "12px !important",
																				}}
																			>
																				{toolTipText}
																				{!row.syncStatus && (
																					<Box
																						component="span"
																						onClick={handleRepairSync}
																						style={{
																							textTransform: "none",
																							background: "none",
																							border: "none",
																							color: "rgba(56, 152, 252, 1)",
																							textDecoration: "underline",
																							cursor: "pointer",
																							padding: 0,
																							fontSize: "inherit",
																						}}
																					>
																						repair
																					</Box>
																				)}
																			</Typography>
																		</Box>
																	}
																	componentsProps={{
																		tooltip: {
																			sx: {
																				backgroundColor: "#fff",
																				color: "#000",
																				boxShadow:
																					"0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
																				border:
																					"0.5px solid rgba(225, 225, 225, 1)",
																				borderRadius: "4px",
																				maxHeight: "100%",
																				maxWidth: "500px",
																				padding: "11px 10px",
																				marginLeft: "0.5rem !important",
																			},
																		},
																	}}
																	enterDelay={100}
																>
																	<Typography
																		className="paragraph"
																		sx={{
																			fontFamily: "var(--font-roboto)",
																			fontSize: "12px",
																			color: color,
																			backgroundColor: background,
																			padding: "3px 12px",
																			height: "24px",
																			display: "flex",
																			alignItems: "center",
																			justifyContent: "center",
																			width: "100%",
																			boxSizing: "border-box",
																			borderRadius: "2px",
																		}}
																	>
																		{formatStatusText(row)}
																	</Typography>
																</Tooltip>
															);
														})()}
													</Box>
												</Box>
											</SmartCell>
											<SmartCell
												cellOptions={{
													sx: {
														position: "relative",
														p: 0,
														textAlign: "center",
														borderRight: "1px solid rgba(235,235,235,1)",
													},
													hideDivider: true,
												}}
											>
												<IconButton
													sx={{
														fontSize: "16px",
														":hover": {
															backgroundColor: "transparent",
															px: 0,
														},
													}}
													onClick={(event) => {
														handleClick(event, row.id);
													}}
												>
													<MoreVertIcon
														sx={{
															color: "rgba(32, 33, 36, 1)",
														}}
													/>
												</IconButton>
											</SmartCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
					<Box
						ref={paginatorRef}
						sx={{ borderTop: "1px solid rgba(235,235,235,1)" }}
					>
						<Paginator tableMode {...paginationProps} />
					</Box>
					<Popover
						id={id}
						open={open}
						anchorEl={anchorEl}
						onClose={handleClose}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "left",
						}}
					>
						<Box
							sx={{
								p: 1,
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								width: "100%",
								maxWidth: "160px",
							}}
						>
							<Button
								sx={{
									justifyContent: "flex-start",
									width: "100%",
									textTransform: "none",
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									color: "rgba(32, 33, 36, 1)",
									fontWeight: 600,
									":hover": {
										color: "rgba(56, 152, 252, 1)",
										backgroundColor: "background: rgba(80, 82, 178, 0.1)",
									},
								}}
								onClick={handleToggleSync}
							>
								{data.find((row) => row.id === selectedId)?.dataSync === true
									? "Disable Sync"
									: "Enable Sync"}
							</Button>
							<Button
								sx={{
									justifyContent: "flex-start",
									width: "100%",
									textTransform: "none",
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									color: "rgba(32, 33, 36, 1)",
									fontWeight: 600,
									":hover": {
										color: "rgba(56, 152, 252, 1)",
										backgroundColor: "background: rgba(80, 82, 178, 0.1)",
									},
								}}
								onClick={handleEdit}
							>
								Edit
							</Button>
							<Button
								sx={{
									justifyContent: "flex-start",
									width: "100%",
									textTransform: "none",
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									color: "rgba(32, 33, 36, 1)",
									fontWeight: 600,
									":hover": {
										color: "rgba(56, 152, 252, 1)",
										backgroundColor: "background: rgba(80, 82, 178, 0.1)",
									},
								}}
								onClick={() => {
									handleOpenConfirmDialog();
								}}
							>
								Delete
							</Button>
							{data.find((row) => row.id === selectedId)?.syncStatus ===
								false && (
								<Button
									sx={{
										justifyContent: "flex-start",
										width: "100%",
										color: "rgba(32, 33, 36, 1)",
										textTransform: "none",
										fontFamily: "var(--font-nunito)",
										fontSize: "14px",
										fontWeight: 600,
										":hover": {
											color: "rgba(56, 152, 252, 1)",
											backgroundColor: "background: rgba(80, 82, 178, 0.1)",
										},
									}}
									onClick={handleRepairSync}
								>
									Repair Sync
								</Button>
							)}
						</Box>
						<Popover
							open={openConfirmDialog}
							onClose={handleCloseConfirmDialog}
							anchorEl={anchorEl}
							anchorOrigin={{
								vertical: "bottom",
								horizontal: "right",
							}}
							transformOrigin={{
								vertical: "top",
								horizontal: "center",
							}}
							slotProps={{
								paper: {
									sx: {
										padding: "0.125rem",
										width: "15.875rem",
										boxShadow: 0,
										borderRadius: "8px",
										border: "0.5px solid rgba(175, 175, 175, 1)",
									},
								},
							}}
						>
							<Typography
								className="first-sub-title"
								sx={{
									paddingLeft: 2,
									pt: 1,
									pb: 0,
								}}
							>
								Confirm Deletion
							</Typography>
							<DialogContent sx={{ padding: 2 }}>
								<DialogContentText className="table-data">
									Are you sure you want to delete this pixel sync?
								</DialogContentText>
							</DialogContent>
							<DialogActions>
								<Button
									className="second-sub-title"
									onClick={handleCloseConfirmDialog}
									sx={{
										backgroundColor: "#fff",
										color: "rgba(56, 152, 252, 1) !important",
										fontSize: "14px",
										textTransform: "none",
										padding: "0.75em 1em",
										border: "1px solid rgba(56, 152, 252, 1)",
										maxWidth: "50px",
										maxHeight: "30px",
										"&:hover": {
											backgroundColor: "#fff",
											boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
										},
									}}
								>
									Cancel
								</Button>
								<Button
									className="second-sub-title"
									onClick={handleDelete}
									sx={{
										backgroundColor: "rgba(56, 152, 252, 1)",
										color: "#fff !important",
										fontSize: "14px",
										textTransform: "none",
										padding: "0.75em 1em",
										border: "1px solid rgba(56, 152, 252, 1)",
										maxWidth: "60px",
										maxHeight: "30px",
										"&:hover": {
											backgroundColor: "rgba(56, 152, 252, 1)",
											boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
										},
									}}
								>
									Delete
								</Button>
							</DialogActions>
						</Popover>
					</Popover>
				</Box>
				{klaviyoIconPopupOpen && isEdit === true && (
					<KlaviyoDataSync
						open={klaviyoIconPopupOpen}
						onClose={handleKlaviyoIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						isEdit={isEdit}
					/>
				)}
				{salesForceIconPopupOpen && isEdit === true && (
					<SalesForceDataSync
						open={salesForceIconPopupOpen}
						onClose={handleSalesForceIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						isEdit={isEdit}
					/>
				)}
				{metaIconPopupOpen && isEdit === true && (
					<MetaDataSync
						open={metaIconPopupOpen}
						onClose={handleMetaIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						isEdit={isEdit}
					/>
				)}

				{mailchimpIconPopupOpen && isEdit === true && (
					<MailchimpDatasync
						open={mailchimpIconPopupOpen}
						onClose={handleMailchimpIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						isEdit={isEdit}
					/>
				)}
				{instantlyIconPopupOpen && isEdit === true && (
					<InstantlyDatasync
						open={instantlyIconPopupOpen}
						onClose={handleInstantlyIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						isEdit={isEdit}
					/>
				)}
				{greenArrowIconPopupOpen && isEdit === true && (
					<GreenArrowDataSync
						open={greenArrowIconPopupOpen}
						onClose={handleGreenArrowIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						isEdit={isEdit}
					/>
				)}
				{omnisendIconPopupOpen && isEdit === true && (
					<OmnisendDataSync
						open={omnisendIconPopupOpen}
						isEdit={isEdit}
						onClose={handleOmnisendIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
						boxShadow="rgba(0, 0, 0, 0.01)"
					/>
				)}
				{sendlaneIconPopupOpen && isEdit && (
					<SendlaneDatasync
						open={sendlaneIconPopupOpen}
						isEdit={isEdit}
						onClose={handleSendlaneIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{s3IconPopupOpen && isEdit && (
					<S3Datasync
						open={s3IconPopupOpen}
						isEdit={isEdit}
						onClose={handleS3IconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{webhookIconPopupOpen && isEdit && (
					<WebhookDatasync
						open={webhookIconPopupOpen}
						isEdit={isEdit}
						onClose={handleWebhookIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{hubspotIconPopupOpen && isEdit && (
					<HubspotDataSync
						open={hubspotIconPopupOpen}
						isEdit={isEdit}
						onClose={handleHubspotIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{goHighLevelIconPopupOpen && isEdit && (
					<GoHighLevelDataSync
						open={goHighLevelIconPopupOpen}
						isEdit={isEdit}
						onClose={handleGoHighLevelIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{customerIoIconPopupOpen && isEdit === true && (
					<CustomerIoDataSync
						open={customerIoIconPopupOpen}
						isEdit={isEdit}
						onClose={handleCustomerIoIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{slackIconPopupOpen && isEdit && (
					<SlackDatasync
						open={slackIconPopupOpen}
						isEdit={isEdit}
						onClose={handleSlackIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				{googleADSIconPopupOpen && isEdit && (
					<GoogleADSDatasync
						open={googleADSIconPopupOpen}
						isEdit={isEdit}
						onClose={handleGoogleADSIconPopupClose}
						data={data.find((item) => item.id === selectedId)}
					/>
				)}
				<MailchimpConnect
					open={openMailchimpConnect}
					handleClose={() => {
						setOpenMailchimpConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "mailchimp",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<KlaviyoIntegrationPopup
					open={openKlaviyoConnect}
					handleClose={() => {
						setOpenKlaviyoConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "klaviyo",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<SalesForceIntegrationPopup
					open={openSalesForceConnect}
					handleClose={() => {
						setOpenSalesForceConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "sales_force",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<OmnisendConnect
					open={openOmnisendConnect}
					handleClose={() => {
						setOpenOmnisendConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "omnisend",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				{/* {linkedinIconPopupOpen && isEdit && (
					<>
						<LinkedinDataSync
							open={linkedinIconPopupOpen}
							isEdit={isEdit}
							onClose={handleLinkedinIconPopupClose}
							data={data.find((item) => item.id === selectedId)}
						/>
					</>
				)} */}
				<MailchimpConnect
					open={openMailchimpConnect}
					handleClose={() => {
						setOpenMailchimpConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "mailchimp",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<HubspotIntegrationPopup
					open={openHubspotConnect}
					handleClose={() => {
						setOpenHubspotConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "hubspot",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<SalesForceIntegrationPopup
					open={openSalesForceConnect}
					handleClose={() => {
						setOpenSalesForceConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "sales_force",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<OmnisendConnect
					open={openOmnisendConnect}
					handleClose={() => {
						setOpenOmnisendConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "omnisend",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<SendlaneConnect
					open={openSendlaneConnect}
					handleClose={() => {
						setOpenSendlaneConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "sendlane",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<CustomerIoConnect
					open={openCustomerIoConnect}
					handleClose={() => {
						setOpenCustomerIoConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "customer_io",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
				<S3Connect
					open={openS3Connect}
					handleClose={() => {
						setOpenS3Connect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "s3",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<SlackConnectPopup
					open={openSlackConnect}
					handlePopupClose={() => {
						setOpenSlackConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "slack",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<GoogleADSConnectPopup
					open={openGoogleADSConnect}
					handlePopupClose={() => {
						setOpenGoogleADSConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "google_ads",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<GoHighLevelConnectPopup
					open={openGoHighLevelConnect}
					handlePopupClose={() => {
						setOpenGoHighLevelConnect(false), setIsInvalidApiKey(false);
					}}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<WebhookConnectPopup
					open={openWebhookConnect}
					handleClose={() => {
						setOpenWebhookConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "webhook",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				{/* <LinkedinConnectPopup
					open={openLinkedinConnect}
					handlePopupClose={() => {
						setOpenLinkedinConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "linkedin",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/> */}
				<WebhookConnectPopup
					open={openWebhookConnect}
					handleClose={() => {
						setOpenWebhookConnect(false), setIsInvalidApiKey(false);
					}}
					initApiKey={
						integrationsCredentials.find(
							(integartion) => integartion.service_name === "webhook",
						)?.access_token
					}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
				<ZapierConnectPopup
					open={openZapierConnect}
					handlePopupClose={handleCloseIntegrate}
					invalid_api_key={isInvalidApiKey}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
			</Box>
		</>
	);
});

DataSyncList.displayName = "DataSyncList";

export default DataSyncList;
