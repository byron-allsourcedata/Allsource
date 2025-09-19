import React, { useState, useEffect } from "react";
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	List,
	Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import ConnectKlaviyo from "@/components/data-syncs/KlaviyoDataSync";
import ConnectSalesForce from "@/components/data-syncs/SalesForceDataSync";
import ConnectMeta from "@/components/data-syncs/MetaDataSync";
import KlaviyoIntegrationPopup from "@/components/integrations/KlaviyoIntegration";
import ZapierConnectPopup from "@/components/integrations/ZapierIntegration";
import SalesForceIntegrationPopup from "@/components/integrations/SalesForceIntegration";
import BingAdsIntegrationPopup from "./integrations/BingAdsIntegration";
import SlackConnectPopup from "./integrations/SlackIntegration";
import GoogleADSConnectPopup from "./integrations/GoogleADSIntegration";
import WebhookConnectPopup from "@/components/integrations/WebhookIntegration";
import MetaConnectButton from "@/components/integrations/MetaIntegration";
import OmnisendConnect from "@/components/integrations/OmnisendIntegration";
import OnmisendDataSync from "@/components/data-syncs/OmnisendDataSync";
import BingAdsDataSync from "@/components/data-syncs/BingAdsDataSync";
import MailchimpConnect from "@/components/integrations/MailchimpIntegration";
import MailchimpDatasync from "@/components/data-syncs/MailchimpDatasync";
import InstantlyDatasync from "@/components/data-syncs/InstantlyDataSync";
import SlackDatasync from "@/components/data-syncs/SlackDataSync";
import GoogleADSDatasync from "@/components/data-syncs/GoogleADSDataSync";
import LinkedinDataSync from "@/components/data-syncs/LinkedinDataSync";
import SendlaneConnect from "@/components/integrations/SendlaneIntegration";
import ConnectInstantly from "@/components/integrations/InstantlyIntegration";
import S3Connect from "@/components/integrations/S3Integration";
import LinkedinConnectPopup from "@/components/integrations/LinkedinIntegration";
import SendlaneDatasync from "@/components/data-syncs/SendlaneDatasync";
import S3Datasync from "@/components/data-syncs/S3Datasync";
import WebhookDatasync from "@/components/data-syncs/WebhookDatasync";
import ZapierDataSync from "@/components/data-syncs/ZapierDataSync";
import HubspotDataSync from "@/components/data-syncs/HubspotDataSync";
import HubspotIntegrationPopup from "@/components/integrations/HubspotIntegration";
import IntegrationBox from "../app/(client)/smart-audiences/components/IntegrationBox";
import { UpgradePlanPopup } from "@/app/(client)/components/UpgradePlanPopup";
import GoHighLevelConnectPopup from "@/components/integrations/GoHighLevelIntegration";
import GoHighLevelDataSync from "@/components/data-syncs/GoHighLevelDataSync";
import CustomerIoConnect from "@/components/integrations/CustomerIoIntegration";
import CustomerIoDataSync from "@/components/data-syncs/CustomerIoDataSync";

interface AudiencePopupProps {
	open: boolean;
	reloadPixelSync?: () => void;
	onClose: () => void;
	selectedLeads?: number[];
}

interface ListItem {
	audience_id: number;
	audience_name: string;
	leads_count: number;
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

interface Integrations {
	id: number;
	service_name: string;
	data_sync: boolean;
}

type ServiceHandlers = {
	hubspot: () => void;
	mailchimp: () => void;
	sales_force: () => void;
	google_ads: () => void;
	s3: () => void;
	klaviyo: () => void;
	omnisend: () => void;
	sendlane: () => void;
	zapier: () => void;
	slack: () => void;
	webhook: () => void;
	linkedin: () => void;
	meta: () => void;
	bing_ads: () => void;
	go_high_level: () => void;
	customer_io: () => void;
	instantly: () => void;
};

const AudiencePopup: React.FC<AudiencePopupProps> = ({
	open,
	onClose,
	selectedLeads,
}) => {
	const [plusIconPopupOpen, setPlusIconPopupOpen] = useState(false);
	const [klaviyoIconPopupOpen, setKlaviyoIconPopupOpen] = useState(false);
	const [bingAdsIconPopupOpen, setBingAdsIconPopupOpen] = useState(false);
	const [goHightLevelIconPopupOpen, setgoHightLevelPopupOpen] = useState(false);
	const [customerIoIconPopupOpen, setCustomerIoPopupOpen] = useState(false);
	const [salesForceIconPopupOpen, setSalesForceIconPopupOpen] = useState(false);
	const [metaIconPopupOpen, setMetaIconPopupOpen] = useState(false);
	const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
		null,
	);
	const [isExportDisabled, setIsExportDisabled] = useState(true);
	const [integrationsCredentials, setIntegrationsCredentials] = useState<
		IntegrationsCredentials[]
	>([]);
	const [createKlaviyo, setCreateKlaviyo] = useState<boolean>(false);
	const [createBingAds, setCreateBingAds] = useState<boolean>(false);
	const [createHubspot, setCreateHubspot] = useState<boolean>(false);
	const [createSalesForce, setCreateSalesForce] = useState<boolean>(false);
	const [createWebhook, setCreateWebhook] = useState<boolean>(false);
	const [createSlack, setCreateSlack] = useState<boolean>(false);
	const [createGoogleAds, setCreateGoogleAds] = useState<boolean>(false);
	const [createGoHighLevel, setCreateGoHighLevel] = useState<boolean>(false);
	const [createLinkedin, setCreateLinkedin] = useState<boolean>(false);
	const [integrations, setIntegrations] = useState<Integrations[]>([]);
	const [metaConnectApp, setMetaConnectApp] = useState(false);
	const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);
	const [mailchimpIconPopupOpen, setOpenMailchimpIconPopup] = useState(false);
	const [slackIconPopupOpen, setOpenSlackIconPopup] = useState(false);
	const [googleAdsIconPopupOpen, setOpenGoogleAdsIconPopup] = useState(false);
	const [linkedinIconPopupOpen, setOpenLinkedinIconPopup] = useState(false);
	const [openMailchimpConnect, setOpenmailchimpConnect] = useState(false);
	const [openInstantlyConnect, setOpeninstantlyConnect] = useState(false);
	const [openSendlaneIconPopupOpen, setOpenSendlaneIconPopupOpen] =
		useState(false);
	const [openS3IconPopupOpen, setOpenS3IconPopupOpen] = useState(false);
	const [openWebhookIconPopupOpen, setOpenWebhookIconPopupOpen] =
		useState(false);
	const [instantlyIconPopupOpen, setOpenInstantlyIconPopup] = useState(false);
	const [openSendlaneConnect, setOpenSendlaneConnect] = useState(false);
	const [openCustomerIoConnect, setOpenCustomerIoConnect] = useState(false);
	const [openS3Connect, setOpenS3Connect] = useState(false);
	const [openZapierDataSync, setOpenZapierDataSync] = useState(false);
	const [openZapierConnect, setOpenZapierConnect] = useState(false);
	const [openOmnisendConnect, setOpenOmnisendConnect] = useState(false);
	const [openBingAdsConnect, setOpenBingAdsConnect] = useState(false);
	const [omnisendIconPopupOpen, setOpenOmnisendIconPopupOpen] = useState(false);
	const [hubspotIconPopupOpen, setOpenHubspotIconPopupOpen] = useState(false);
	const [integratedServices, setIntegratedServices] = useState<string[]>([]);
	const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			const response = await axiosInstance.get("/integrations/");
			if (response.status === 200) {
				setIntegrations(response.data);
			}
		};
		if (open) {
			fetchData();
		}
	}, [open]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axiosInstance.get("/integrations/credentials/");
				if (response.status === 200) {
					setIntegrationsCredentials(response.data);
					setIntegratedServices(
						response.data.map((cred: any) => cred.service_name),
					);
				}
			} catch (error) {}
		};
		if (open) {
			fetchData();
		}
	}, [open]);

	const handleOmnisendIconPopupOpenClose = () => {
		setOpenOmnisendIconPopupOpen(false);
	};

	const handleHubspotIconPopupOpenClose = () => {
		setOpenHubspotIconPopupOpen(false);
	};

	const handlePlusIconPopupOpen = () => {
		setPlusIconPopupOpen(true);
		setSelectedIntegration(null); // Reset the selection
		setIsExportDisabled(true); // Disable export button when the plus icon is clicked
	};

	const handlePlusIconPopupClose = () => {
		setPlusIconPopupOpen(false);
	};

	const handleKlaviyoIconPopupOpen = () => {
		setKlaviyoIconPopupOpen(true);
	};

	const handleKlaviyoIconPopupClose = () => {
		setKlaviyoIconPopupOpen(false);
		setPlusIconPopupOpen(false);
	};

	const handleOpenInstantlyConnect = () => {
		setOpeninstantlyConnect(true);
	};

	const handleInstantlyIconPopupIconOpen = () => {
		setOpenInstantlyIconPopup(true);
	};

	const handleInstantlyIconPopupClose = () => {
		setOpenInstantlyIconPopup(false);
		setPlusIconPopupOpen(false);
	};

	const handleBingAdsIconPopupOpen = () => {
		setBingAdsIconPopupOpen(true);
	};

	const handleBingAdsIconPopupClose = () => {
		setBingAdsIconPopupOpen(false);
	};

	const handleGoHightLevelIconPopupOpen = () => {
		setgoHightLevelPopupOpen(true);
	};

	const handleGoHightLevelIconPopupClose = () => {
		setgoHightLevelPopupOpen(false);
	};

	const handleCustomerIoIconPopupOpen = () => {
		setCustomerIoPopupOpen(true);
	};

	const handleCustomerIoIconPopupClose = () => {
		setCustomerIoPopupOpen(false);
	};

	const handleSalesForceIconPopupOpen = () => {
		setSalesForceIconPopupOpen(true);
	};

	const handleOmnisendConnectOpen = () => {
		setOpenOmnisendConnect(true);
	};

	const handleOmnisendConnectClose = () => {
		setOpenOmnisendConnect(false);
	};

	const handleOmnisendIconPopupOpen = () => {
		setOpenOmnisendIconPopupOpen(true);
	};

	const handleHubspotIconPopupOpen = () => {
		setOpenHubspotIconPopupOpen(true);
	};

	const handleSalesForceIconPopupClose = () => {
		setSalesForceIconPopupOpen(false);
		setPlusIconPopupOpen(false);
	};

	const handleOpenMailchimpConnect = () => {
		setOpenmailchimpConnect(true);
	};

	const handleSlackIconPopupIconOpen = () => {
		setOpenSlackIconPopup(true);
	};

	const handleGoogleAdsIconPopupIconOpen = () => {
		setOpenGoogleAdsIconPopup(true);
	};

	const handleLinkedinIconPopupIconOpen = () => {
		setOpenLinkedinIconPopup(true);
	};

	const handleMailchimpIconPopupIconOpen = () => {
		setOpenMailchimpIconPopup(true);
	};

	const handleCreateSlackOpen = () => {
		setCreateSlack(true);
	};

	const handleCreateGoogleAdsOpen = () => {
		setCreateGoogleAds(true);
	};

	const handleGoHightLevelOpen = () => {
		setCreateGoHighLevel(true);
	};

	const handleCreateLinkedinOpen = () => {
		setCreateLinkedin(true);
	};

	const handleMailchimpIconPopupIconClose = () => {
		setOpenMailchimpIconPopup(false);
		setPlusIconPopupOpen(false);
	};

	const handleSlackIconPopupIconClose = () => {
		setOpenSlackIconPopup(false);
		setPlusIconPopupOpen(false);
	};
	const handleGoogleAdsIconPopupIconClose = () => {
		setOpenGoogleAdsIconPopup(false);
		setPlusIconPopupOpen(false);
	};

	const handleLinkedinIconPopupIconClose = () => {
		setOpenLinkedinIconPopup(false);
		setPlusIconPopupOpen(false);
	};

	const handleMetaIconPopupOpen = () => {
		setMetaIconPopupOpen(true);
	};

	const handleMetaIconPopupClose = () => {
		setMetaIconPopupOpen(false);
		setPlusIconPopupOpen(false);
	};

	const handleOpenMailchimpConnectClose = () => {
		setOpenmailchimpConnect(false);
	};

	const handleOpenInstantlyConnectClose = () => {
		setOpeninstantlyConnect(false);
	};

	const handleIntegrationSelect = (integration: string) => {
		setSelectedIntegration(integration);
		setIsExportDisabled(false); // Enable export button when an integration is selected
	};

	const handleSaveSettings = (newIntegration: any) => {
		setIntegrationsCredentials((prevIntegrations) => {
			if (
				prevIntegrations.some(
					(integration) =>
						integration.service_name === newIntegration.service_name,
				)
			) {
				return prevIntegrations.map((integration) =>
					integration.service_name === newIntegration.service_name
						? newIntegration
						: integration,
				);
			} else {
				return [...prevIntegrations, newIntegration];
			}
		});
		// const service = newIntegration.service_name;
		// switch (service) {
		// 	case "meta":
		// 		handleMetaIconPopupOpen();
		// 		break;
		// 	// case 'klaviyo':
		// 	//     handleKlaviyoIconPopupOpen()
		// 	//     break
		// 	case "bing_ads":
		// 		handleBingAdsIconPopupOpen();
		// 		break;
		// 	case "mailchimp":
		// 		handleMailchimpIconPopupIconOpen();
		// 		break;
		// 	// case 'omnisend':
		// 	//     handleOmnisendIconPopupOpen()
		// 	//     break
		// 	// case 'sendlane':
		// 	//     handleSendlaneIconPopupOpen()
		// 	//     break
		// 	case "s3":
		// 		handleS3IconPopupOpen();
		// 		break;
		// 	// case 'slack':
		// 	//     handleSlackIconPopupIconOpen()
		// 	//     break
		// 	case "google_ads":
		// 		handleGoogleAdsIconPopupIconOpen();
		// 	// case 'webhook':
		// 	//     handleWebhookIconPopupOpen()
		// 	//     break
		// 	case "hubspot":
		// 		handleHubspotIconPopupOpen();
		// 		break;
		// }
	};

	const handleSendlaneIconPopupOpen = () => {
		setOpenSendlaneIconPopupOpen(true);
	};

	const handleS3IconPopupOpen = () => {
		setOpenS3IconPopupOpen(true);
	};

	const handleWebhookIconPopupOpen = () => {
		setOpenWebhookIconPopupOpen(true);
	};

	const handleSendlaneIconPopupClose = () => {
		setOpenSendlaneIconPopupOpen(false);
	};

	const handleS3IconPopupClose = () => {
		setOpenS3IconPopupOpen(false);
	};

	const handleWebhookIconPopupClose = () => {
		setOpenWebhookIconPopupOpen(false);
	};

	const handleSendlaneConnectOpen = () => {
		setOpenSendlaneConnect(true);
	};

	const handleSendlaneConnectClose = () => {
		setOpenSendlaneConnect(false);
	};

	const handleCustomerIoConnectOpen = () => {
		setOpenCustomerIoConnect(true);
	};

	const handleCustomerIoConnectClose = () => {
		setOpenCustomerIoConnect(false);
	};

	const handleS3ConnectOpen = () => {
		setOpenS3Connect(true);
	};

	const handleS3ConnectClose = () => {
		setOpenS3Connect(false);
	};

	const handleCreateKlaviyoOpen = () => {
		setCreateKlaviyo(true);
	};

	const handleCreateBingAdsOpen = () => {
		setCreateBingAds(true);
	};

	const handleCreateBingAdsClose = () => {
		setCreateBingAds(false);
	};

	const handleCreateHubspotOpen = () => {
		setCreateHubspot(true);
	};

	const handleCreateMetaOpen = () => {
		setMetaConnectApp(true);
	};

	const handleCreateSalesForceOpen = () => {
		setCreateSalesForce(true);
	};

	const handleCreateKlaviyoClose = () => {
		setCreateKlaviyo(false);
	};

	const handleCreateSalesForceClose = () => {
		setCreateSalesForce(false);
	};

	const handleCreateWebhookOpen = () => {
		setCreateWebhook(true);
	};

	const handleCreateWebhookClose = () => {
		setCreateWebhook(false);
	};

	const handleCreateSlackClose = () => {
		setCreateSlack(false);
	};

	const handleCreateGoogleAdsClose = () => {
		setCreateGoogleAds(false);
	};

	const handleCreateGoHighLevelClose = () => {
		setCreateGoHighLevel(false);
	};

	const handleCreateLinkedinClose = () => {
		setCreateLinkedin(false);
	};

	const handleOpenZapierDataSync = () => {
		setOpenZapierDataSync(true);
	};

	const handleOpenZapierConnect = () => {
		setOpenZapierConnect(true);
	};

	const handleCloseZapierConnect = () => {
		setOpenZapierConnect(false);
	};

	const handleCloseZapierDataSync = () => {
		setOpenZapierDataSync(false);
	};

	const handleCloseMetaConnectApp = () => {
		// setIntegrationsCredentials((prevIntegratiosn) => [
		// 	...prevIntegratiosn,
		// 	{
		// 		service_name: "meta",
		// 	},
		// ]);
		setMetaConnectApp(false);
	};

	const toCamelCase = (name: string) => {
		const updatedName = name
			?.split("_")
			.map((word, index) =>
				index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
			)
			.join("");
		return updatedName;
	};

	const integrationsImage = [
		{ image: "csv-icon.svg", service_name: "CSV" },
		{ image: "meta-icon.svg", service_name: "meta" },
		{ image: "mailchimp-icon.svg", service_name: "mailchimp" },
		{ image: "hubspot.svg", service_name: "hubspot" },
		{ image: "google-ads.svg", service_name: "google_ads" },
		{ image: "go-high-level-icon.svg", service_name: "go_high_level" },
		{ image: "customer-io-icon.svg", service_name: "customer_io" },
		{ image: "bing.svg", service_name: "bing_ads" },
		{ image: "salesforce-icon.svg", service_name: "sales_force" },
		{ image: "webhook-icon.svg", service_name: "webhook" },
		{ image: "slack-icon.svg", service_name: "slack" },
		{ image: "zapier-icon.svg", service_name: "zapier" },
		{ image: "omnisend_icon_black.svg", service_name: "omnisend" },
		{ image: "sendlane-icon.svg", service_name: "sendlane" },
		{ image: "instantly-icon.svg", service_name: "instantly" },
		{ image: "klaviyo.svg", service_name: "klaviyo" },
		{ image: "s3.svg", service_name: "s3" },
	];

	const handleAddIntegration = async (service_name: string) => {
		try {
			setIsLoading(true);
			const response = await axiosInstance.get(
				"/integrations/check-limit-reached",
			);
			if (response.status === 200 && response.data) {
				setUpgradePlanPopup(true);
				return;
			}
		} catch {
		} finally {
			setIsLoading(false);
		}

		const isIntegrated = integrationsCredentials.some(
			(integration_cred) => integration_cred.service_name === service_name,
		);
		if (isIntegrated) return;

		if (service_name === "meta") {
			setMetaConnectApp(true);
		} else if (service_name in integrationsHandlers) {
			integrationsHandlers[service_name as keyof ServiceHandlers]();
		}
	};

	const integrationsHandlers: ServiceHandlers = {
		hubspot: handleCreateHubspotOpen,
		mailchimp: handleOpenMailchimpConnect,
		instantly: handleOpenInstantlyConnect,
		sales_force: handleCreateSalesForceOpen,
		google_ads: handleCreateGoogleAdsOpen,
		go_high_level: handleGoHightLevelOpen,
		customer_io: handleCustomerIoConnectOpen,
		s3: handleS3ConnectOpen,
		slack: handleCreateSlackOpen,
		klaviyo: handleCreateKlaviyoOpen,
		omnisend: handleOmnisendConnectOpen,
		sendlane: handleSendlaneConnectOpen,
		zapier: handleOpenZapierConnect,
		webhook: handleCreateWebhookOpen,
		linkedin: handleCreateLinkedinOpen,
		meta: handleCreateMetaOpen,
		bing_ads: handleCreateBingAdsOpen,
	};

	const syncHandlers: ServiceHandlers = {
		hubspot: handleHubspotIconPopupOpen,
		mailchimp: handleMailchimpIconPopupIconOpen,
		instantly: handleInstantlyIconPopupIconOpen,
		sales_force: handleSalesForceIconPopupOpen,
		google_ads: handleGoogleAdsIconPopupIconOpen,
		s3: handleS3IconPopupOpen,
		slack: handleSlackIconPopupIconOpen,
		klaviyo: handleKlaviyoIconPopupOpen,
		omnisend: handleOmnisendIconPopupOpen,
		sendlane: handleSendlaneIconPopupOpen,
		zapier: handleOpenZapierDataSync,
		webhook: handleWebhookIconPopupOpen,
		linkedin: handleLinkedinIconPopupIconOpen,
		meta: handleMetaIconPopupOpen,
		bing_ads: handleBingAdsIconPopupOpen,
		go_high_level: handleGoHightLevelIconPopupOpen,
		customer_io: handleCustomerIoIconPopupOpen,
	};

	return (
		<>
			<Backdrop open={open} sx={{ zIndex: 100, color: "#fff" }} />
			<Drawer
				anchor="right"
				open={open}
				onClose={onClose}
				PaperProps={{
					sx: {
						width: "40%",
						position: "fixed",
						top: 0,
						bottom: 0,
						"@media (max-width: 600px)": {
							width: "100%",
						},
					},
				}}
				slotProps={{
					backdrop: {
						sx: {
							backgroundColor: "rgba(0, 0, 0, 0.01)",
						},
					},
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						py: 2.85,
						px: 2,
						borderBottom: "1px solid #e4e4e4",
						position: "sticky",
						top: 0,
						zIndex: "9",
						backgroundColor: "#fff",
					}}
				>
					<Typography
						variant="h6"
						className="first-sub-title"
						sx={{ textAlign: "center" }}
					>
						Create contact sync
					</Typography>
					<IconButton onClick={onClose} sx={{ p: 0 }}>
						<CloseIcon sx={{ width: "20px", height: "20px" }} />
					</IconButton>
				</Box>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 5,
						height: "100%",
					}}
				>
					<Box sx={{ p: 0, width: "100%" }}>
						<Box
							sx={{
								px: 3,
								py: 2,
								display: "flex",
								flexDirection: "column",
								gap: 3,
								width: "100%",
							}}
						>
							<Typography variant="h6" className="first-sub-title">
								Choose from integrated platform
							</Typography>
							<List
								sx={{
									display: "flex",
									gap: 2,
									p: 0,
									border: "none",
									flexWrap: "wrap",
								}}
							>
								{integrations
									.sort((a, b) => {
										const isIntegratedA = integratedServices.includes(
											a.service_name,
										);
										const isIntegratedB = integratedServices.includes(
											b.service_name,
										);

										if (isIntegratedA && !isIntegratedB) return -1;
										if (!isIntegratedA && isIntegratedB) return 1;
										return 0;
									})
									.map((integration) => {
										const integrationCred = integrationsCredentials.find(
											(cred) => cred.service_name === integration.service_name,
										);
										const isIntegrated = integratedServices.includes(
											integration.service_name,
										);

										const activeService =
											integration.service_name.toLowerCase();

										return (
											<Box
												key={integration.service_name}
												onClick={() =>
													!isIntegrated
														? handleAddIntegration(integration.service_name)
														: integrationCred?.is_failed
															? integrationsHandlers[
																	integration.service_name as keyof ServiceHandlers
																]()
															: syncHandlers[
																	integration.service_name as keyof ServiceHandlers
																]()
												}
												sx={{
													width: `calc((100% - (${integrations.length} - 1) * 16px) / ${integrations.length})`,
													minWidth: "135px",
												}}
											>
												<IntegrationBox
													image={`/${integrationsImage.filter((item) => item.service_name === integration.service_name)[0]?.image}`}
													serviceName={toCamelCase(integration.service_name)}
													isAvalible={
														isIntegrated || integrationCred?.is_failed
													}
													isFailed={integrationCred?.is_failed}
													isIntegrated={isIntegrated}
												/>
											</Box>
										);
									})}
							</List>
						</Box>
					</Box>
				</Box>
			</Drawer>

			{/* Data Sync */}
			<ConnectKlaviyo
				data={null}
				open={klaviyoIconPopupOpen}
				onClose={handleKlaviyoIconPopupClose}
				onCloseCreateSync={onClose}
			/>
			<InstantlyDatasync
				open={instantlyIconPopupOpen}
				onClose={handleInstantlyIconPopupClose}
				onCloseCreateSync={onClose}
				data={null}
			/>
			<BingAdsDataSync
				open={bingAdsIconPopupOpen}
				onClose={handleBingAdsIconPopupClose}
				isEdit={false}
				data={null}
			/>
			<GoHighLevelDataSync
				open={goHightLevelIconPopupOpen}
				onClose={handleGoHightLevelIconPopupClose}
				onCloseCreateSync={onClose}
				isEdit={false}
			/>
			<CustomerIoDataSync
				open={customerIoIconPopupOpen}
				onClose={handleCustomerIoIconPopupClose}
				onCloseCreateSync={onClose}
				isEdit={false}
			/>
			<ConnectSalesForce
				data={null}
				open={salesForceIconPopupOpen}
				onClose={handleSalesForceIconPopupClose}
				onCloseCreateSync={onClose}
			/>
			<ConnectMeta
				data={null}
				open={metaIconPopupOpen}
				onClose={handleMetaIconPopupClose}
				onCloseCreateSync={onClose}
				isEdit={false}
			/>
			<OnmisendDataSync
				open={omnisendIconPopupOpen}
				onClose={handleOmnisendIconPopupOpenClose}
				onCloseCreateSync={onClose}
				isEdit={false}
				data={null}
			/>
			<HubspotDataSync
				open={hubspotIconPopupOpen}
				onClose={handleHubspotIconPopupOpenClose}
				onCloseCreateSync={onClose}
				isEdit={false}
				data={null}
			/>
			<SendlaneDatasync
				open={openSendlaneIconPopupOpen}
				onClose={handleSendlaneIconPopupClose}
				onCloseCreateSync={onClose}
				data={null}
				isEdit={false}
			/>
			<S3Datasync
				open={openS3IconPopupOpen}
				onClose={handleS3IconPopupClose}
				onCloseCreateSync={onClose}
				data={null}
				isEdit={false}
			/>
			<WebhookDatasync
				open={openWebhookIconPopupOpen}
				onClose={handleWebhookIconPopupClose}
				onCloseCreateSync={onClose}
				data={null}
				isEdit={false}
			/>
			<MailchimpDatasync
				open={mailchimpIconPopupOpen}
				onClose={handleMailchimpIconPopupIconClose}
				onCloseCreateSync={onClose}
				data={null}
			/>
			<SlackDatasync
				open={slackIconPopupOpen}
				onClose={handleSlackIconPopupIconClose}
				onCloseCreateSync={onClose}
				data={null}
				isEdit={false}
			/>
			<GoogleADSDatasync
				open={googleAdsIconPopupOpen}
				onClose={handleGoogleAdsIconPopupIconClose}
				onCloseCreateSync={onClose}
				data={null}
				isEdit={false}
			/>
			<LinkedinDataSync
				open={linkedinIconPopupOpen}
				onClose={handleLinkedinIconPopupIconClose}
				onCloseCreateSync={onClose}
				data={null}
				isEdit={false}
			/>
			<ZapierDataSync
				open={openZapierDataSync}
				handleClose={handleCloseZapierDataSync}
			/>

			{/* Add Integration */}
			{/* <AlivbleIntagrationsSlider
				open={plusIconPopupOpen}
				onClose={handlePlusIconPopupClose}
				isContactSync={true}
				integrations={integrations}
				integrationsCredentials={integrationsCredentials}
				handleSaveSettings={handleSaveSettings}
			/> */}
			<SlackConnectPopup
				open={createSlack}
				handlePopupClose={handleCreateSlackClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "slack",
					)?.access_token
				}
			/>
			<GoogleADSConnectPopup
				open={createGoogleAds}
				handlePopupClose={handleCreateGoogleAdsClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "google_ads",
					)?.access_token
				}
			/>
			<GoHighLevelConnectPopup
				open={createGoHighLevel}
				handlePopupClose={handleCreateGoHighLevelClose}
			/>
			<LinkedinConnectPopup
				open={createLinkedin}
				handlePopupClose={handleCreateLinkedinClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "linkedin",
					)?.access_token
				}
			/>
			<WebhookConnectPopup
				open={createWebhook}
				handleClose={handleCreateWebhookClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "webhook",
					)?.access_token
				}
			/>
			<KlaviyoIntegrationPopup
				open={createKlaviyo}
				handleClose={handleCreateKlaviyoClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "klaviyo",
					)?.access_token
				}
			/>
			<ZapierConnectPopup
				open={openZapierConnect}
				handlePopupClose={handleCloseZapierConnect}
				invalid_api_key={isInvalidApiKey}
				boxShadow="rgba(0, 0, 0, 0.01)"
			/>
			<BingAdsIntegrationPopup
				open={createBingAds}
				handleClose={handleCreateBingAdsClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "bing_ads",
					)?.access_token
				}
			/>
			<SalesForceIntegrationPopup
				open={createSalesForce}
				handleClose={handleCreateSalesForceClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "sales_force",
					)?.access_token
				}
			/>
			<MailchimpConnect
				onSave={handleSaveSettings}
				open={openMailchimpConnect}
				handleClose={handleOpenMailchimpConnectClose}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "mailchimp",
					)?.access_token
				}
			/>
			<ConnectInstantly
				onSave={handleSaveSettings}
				open={openInstantlyConnect}
				handleClose={handleOpenInstantlyConnectClose}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "instantly",
					)?.access_token
				}
			/>
			<S3Connect
				open={openS3Connect}
				handleClose={handleS3ConnectClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "s3",
					)?.access_token
				}
			/>
			<SendlaneConnect
				open={openSendlaneConnect}
				handleClose={handleSendlaneConnectClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "sendlane",
					)?.access_token
				}
			/>
			<CustomerIoConnect
				open={openCustomerIoConnect}
				handleClose={handleCustomerIoConnectClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "customer_io",
					)?.access_token
				}
			/>
			<OmnisendConnect
				open={openOmnisendConnect}
				handleClose={handleOmnisendConnectClose}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "omnisend",
					)?.access_token
				}
			/>
			<HubspotIntegrationPopup
				open={createHubspot}
				handleClose={() => setCreateHubspot(false)}
				onSave={handleSaveSettings}
				invalid_api_key={isInvalidApiKey}
				initApiKey={
					integrationsCredentials.find(
						(integartion) => integartion.service_name === "hubspot",
					)?.access_token
				}
			/>
			<MetaConnectButton
				open={metaConnectApp}
				onClose={handleCloseMetaConnectApp}
				invalid_api_key={isInvalidApiKey}
				onSave={handleSaveSettings}
			/>

			<UpgradePlanPopup
				open={upgradePlanPopup}
				limitName={"domain"}
				handleClose={() => setUpgradePlanPopup(false)}
			/>
		</>
	);
};

export default AudiencePopup;
