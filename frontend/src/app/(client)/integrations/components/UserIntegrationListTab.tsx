import { useEffect, useState } from "react";
import { useIntegrationHints } from "../context/IntegrationsHintsContext";
import { useZohoChatToggle } from "@/hooks/useZohoChatToggle";
import {
	Box,
	InputAdornment,
	TextField,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import Image from "next/image";
import ShopifySettings from "@/components/ShopifySettings";
import DataSyncList from "@/app/(client)/data-sync/components/DataSyncList";
import BCommerceConnect from "@/components/Bcommerce";
import OmnisendConnect from "@/components/integrations/OmnisendIntegration";
import MailchimpConnect from "@/components/integrations/MailchimpIntegration";
import InstantlyConnect from "@/components/integrations/InstantlyIntegration";
import SendlaneConnect from "@/components/integrations/SendlaneIntegration";
import S3Connect from "@/components/integrations/S3Integration";
import AttentiveIntegrationPopup from "@/components/integrations/AttentiveIntegration";
import ZapierConnectPopup from "@/components/integrations/ZapierIntegration";
import SlackConnectPopup from "@/components/integrations/SlackIntegration";
import LinkedinConnectPopup from "@/components/integrations/LinkedinIntegration";
import WebhookConnectPopup from "@/components/integrations/WebhookIntegration";
import HubspotIntegrationPopup from "@/components/integrations/HubspotIntegration";
import GoogleADSConnectPopup from "@/components/integrations/GoogleADSIntegration";
import BingAdsIntegrationPopup from "@/components/integrations/BingAdsIntegration";
import GoHighLevelConnectPopup from "@/components/integrations/GoHighLevelIntegration";
import CustomerIoConnect from "@/components/integrations/CustomerIoIntegration";
import MetaConnectButton from "@/components/integrations/MetaIntegration";
import KlaviyoIntegrationPopup from "@/components/integrations/KlaviyoIntegration";
import SalesForceIntegrationPopup from "@/components/integrations/SalesForceIntegration";
import HintCard from "../../components/HintCard";
import { DeleteIntegrationPopup } from "./DeleteIntegrationPopup";
import { IntegrationBox } from "@/components/ui/integrations/IntegrationBox";
import { UpgradePlanPopup } from "@/app/(client)/components/UpgradePlanPopup";
import axios from "axios";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { ActiveIntegration, IntegrationCredentials } from "./types";

interface IntegrationsListProps {
	integrationsCredentials: IntegrationCredentials[];
	integrations: any[];
	changeTab?: (value: string) => void;
	handleSaveSettings: (new_integration: any) => void;
	handleDeleteSettings?: (serviceName: string) => void;
	integrationsAvailable?: ActiveIntegration[];
}

//fisst tab on old version page, now - main content on page
export const UserIntegrationListTab = ({
	integrationsCredentials,
	integrations,
	handleSaveSettings,
	handleDeleteSettings,
	integrationsAvailable,
}: IntegrationsListProps) => {
	const [activeService, setActiveService] = useState<string | null>(null);
	const [openModal, setOpenModal] = useState<string | null>(null);
	const [openDeletePopup, setOpenDeletePopup] = useState(false);
	const [search, setSearch] = useState<string>("");
	const [upgradePlanPopup, setUpgradePlanPopup] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { hints, cards, changeIntegrationHint, resetIntegrationHints } =
		useIntegrationHints();

	useZohoChatToggle(openDeletePopup || openModal !== null);

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(event.target.value);
	};

	const handleActive = (service: string) => {
		setActiveService(service);
	};

	const handleClose = () => {
		setOpenModal(null);
	};

	const handleAddIntegration = async (service_name: string) => {
		try {
			setIsLoading(true);
			// const response = await axiosInstance.get('/integrations/check-limit-reached')
			// if (response.status === 200 && response.data == true) {
			//   setUpgradePlanPopup(true)
			//   return
			// }
			// console.log(response)
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				const { status, data } = error.response;
				if (status === 400 && data?.status === "DOMAIN_NOT_FOUND") {
					showErrorToast("Please set up your domain to continue");
					return;
				}
			}
		} finally {
			setIsLoading(false);
		}

		const isIntegrated = integrationsCredentials.some(
			(integration_cred) => integration_cred.service_name === service_name,
		);
		if (isIntegrated) return;
		setOpenModal(service_name);
	};

	const handleDeleteOpen = () => {
		setOpenDeletePopup(true);
	};

	const handleDeleteClose = () => {
		setOpenDeletePopup(false);
	};

	const handleDelete = async () => {
		try {
			const response = await axiosInstance.delete("/integrations/", {
				params: {
					service_name: activeService,
				},
			});

			if (response.status === 200) {
				showToast(`Remove ${activeService} Successfully`);
				if (handleDeleteSettings && activeService) {
					handleDeleteSettings(activeService);
					setActiveService(null);
				}
			}
		} catch (error) {
			showErrorToast(`Remove ${activeService} failed`);
		}
	};

	const integratedServices = integrationsCredentials.map(
		(cred) => cred.service_name,
	);

	useEffect(() => {
		resetIntegrationHints();
	}, []);

	const theme = useTheme();
	const isNarrow = useMediaQuery("(max-width:900px)");

	return (
		<Box
			sx={{
				width: "100%",
				flexGrow: 1,
				overflow: "auto",
				pt: 2,
				"@media (max-width: 600px)": {
					pr: 2,
					pb: 4,
					height: "calc(100vh - 11.25rem)",
					pt: 2,
				},
			}}
		>
			{isLoading && <CustomizedProgressBar />}
			<UpgradePlanPopup
				open={upgradePlanPopup}
				limitName={"domain"}
				handleClose={() => setUpgradePlanPopup(false)}
			/>
			<Box
				sx={{
					position: "relative",
					overflow: "visible",
				}}
			>
				<Box
					sx={{
						overflowX: "hidden",
						mb: 3.75,
						maxWidth: "500px",
						"@media(max-width: 900px)": { width: "100%" },
					}}
				>
					<TextField
						fullWidth
						placeholder="Search integrations"
						value={search}
						onChange={handleSearch}
						inputProps={{
							style: {
								padding: 0,
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Image
										src="/ic_round-search.svg"
										width={24}
										height={24}
										alt="search"
									/>
								</InputAdornment>
							),
						}}
						variant="outlined"
					/>
				</Box>

				<HintCard
					card={cards.search}
					positionLeft={530}
					positionTop={20}
					rightSide={false}
					isOpenBody={hints.search.showBody}
					toggleClick={() => {
						if (hints.integration.showBody) {
							changeIntegrationHint("integration", "showBody", "close");
						}
						changeIntegrationHint("search", "showBody", "toggle");
					}}
					closeClick={() =>
						changeIntegrationHint("search", "showBody", "close")
					}
				/>
			</Box>

			<Box
				sx={{
					display: "flex",
					gap: 2,
					flexWrap: "wrap",
					overflowX: "hidden",
					"@media (max-width: 900px)": {
						justifyContent: "center",
					},
				}}
			>
				{integrationsAvailable
					?.filter((integration) => {
						if (search) {
							return integration.service_name
								.toLowerCase()
								.includes(search.toLowerCase());
						}
						return true;
					})
					.sort((a, b) => {
						const isAIntegrated = integratedServices.includes(a.service_name);
						const isBIntegrated = integratedServices.includes(b.service_name);

						if (isAIntegrated === isBIntegrated) {
							return a.service_name.localeCompare(b.service_name);
						}
						return isAIntegrated ? -1 : 1;
					})
					.map((integration, idx) => {
						const isFirst = idx === 0;
						const isIntegrated = integratedServices.includes(
							integration.service_name,
						);
						const integrationCred = integrationsCredentials.find(
							(cred) => cred.service_name === integration.service_name,
						);

						return (
							<Box
								key={integration.service_name}
								onClick={() =>
									isIntegrated
										? handleActive(integration.service_name)
										: handleAddIntegration(integration.service_name)
								}
								sx={{
									position: "relative",
									flexShrink: 0,
								}}
							>
								{isFirst && (
									<Box onClick={(e) => e.stopPropagation()} sx={{}}>
										<HintCard
											card={cards.integration}
											positionLeft={isNarrow ? 150 : 125}
											positionTop={125}
											rightSide={false}
											isOpenBody={hints.integration.showBody}
											toggleClick={() => {
												if (hints.search.showBody) {
													changeIntegrationHint("search", "showBody", "close");
												}
												changeIntegrationHint(
													"integration",
													"showBody",
													"toggle",
												);
											}}
											closeClick={() =>
												changeIntegrationHint(
													"integration",
													"showBody",
													"close",
												)
											}
										/>
									</Box>
								)}

								<IntegrationBox
									image={`/${integration.image_url}`}
									service_name={integration.service_name}
									active={activeService === integration.service_name}
									is_avalible={!isIntegrated}
									is_integrated={isIntegrated}
									handleClick={() => setOpenModal(integration.service_name)}
									handleDelete={handleDeleteOpen}
									is_failed={integrationCred?.is_failed}
								/>
							</Box>
						);
					})}
			</Box>

			{openModal === "klaviyo" && (
				<KlaviyoIntegrationPopup
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "klaviyo",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "klaviyo",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}
			{openModal === "sales_force" && (
				<SalesForceIntegrationPopup
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "sales_force",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "sales_force",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "attentive" && (
				<AttentiveIntegrationPopup
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "attentive",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "attentive",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "meta" && (
				<MetaConnectButton
					open={true}
					onClose={handleClose}
					onSave={handleSaveSettings}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "meta",
						)?.is_failed === true
					}
					isEdit={true}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "shopify" && (
				<ShopifySettings
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "shopify",
						)?.access_token
					}
					initShopDomain={
						integrationsCredentials.find(
							(integration) => integration.service_name === "shopify",
						)?.shop_domain
					}
				/>
			)}

			{openModal === "big_commerce" && (
				<BCommerceConnect
					open={true}
					onClose={handleClose}
					initShopHash={
						integrationsCredentials.find(
							(integration) => integration.service_name === "big_commerce",
						)?.shop_domain
					}
					error_message={
						integrationsCredentials.find(
							(integration) => integration.service_name === "big_commerce",
						)?.error_message
					}
				/>
			)}

			{openModal === "omnisend" && (
				<OmnisendConnect
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "omnisend",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "omnisend",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "mailchimp" && (
				<MailchimpConnect
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "mailchimp",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "mailchimp",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "instantly" && (
				<InstantlyConnect
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "instantly",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "instantly",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "sendlane" && (
				<SendlaneConnect
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "sendlane",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "sendlane",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "customer_io" && (
				<CustomerIoConnect
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "customer_io",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "customer_io",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "s3" && (
				<S3Connect
					open={true}
					handleClose={handleClose}
					onSave={handleSaveSettings}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "s3",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "s3",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "zapier" && (
				<ZapierConnectPopup
					open={true}
					handlePopupClose={handleClose}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "zapier",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "slack" && (
				<SlackConnectPopup
					open={true}
					handlePopupClose={handleClose}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "slack",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "google_ads" && (
				<GoogleADSConnectPopup
					open={true}
					handlePopupClose={handleClose}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "google_ads",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}
			{openModal === "go_high_level" && (
				<GoHighLevelConnectPopup
					open={true}
					handlePopupClose={handleClose}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}
			{openModal === "linkedin" && (
				<LinkedinConnectPopup
					open={true}
					handlePopupClose={handleClose}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "linkedin",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "bing_ads" && (
				<BingAdsIntegrationPopup
					open={true}
					handleClose={handleClose}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "bing_ads",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.1)"
				/>
			)}

			{openModal === "webhook" && (
				<WebhookConnectPopup
					open={true}
					handleClose={handleClose}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "webhook",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
			)}

			{openModal === "hubspot" && (
				<HubspotIntegrationPopup
					open={true}
					handleClose={handleClose}
					initApiKey={
						integrationsCredentials.find(
							(integration) => integration.service_name === "hubspot",
						)?.access_token
					}
					invalid_api_key={
						integrationsCredentials.find(
							(integration) => integration.service_name === "hubspot",
						)?.is_failed === true
					}
					boxShadow="rgba(0, 0, 0, 0.01)"
				/>
			)}

			<Box>
				{activeService &&
					activeService !== "shopify" &&
					activeService !== "big_commerce" && (
						<DataSyncList key={activeService} service_name={activeService} />
					)}
			</Box>

			<DeleteIntegrationPopup
				open={openDeletePopup}
				onClose={handleDeleteClose}
				service_name={activeService}
				handleDelete={handleDelete}
			/>
		</Box>
	);
};
