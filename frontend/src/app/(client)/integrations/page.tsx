"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { Box, Typography } from "@mui/material";
import CustomTooltip from "@/components/customToolTip";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import Slider from "../../../components/Slider";
import { SliderProvider } from "@/context/SliderContext";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useNotification } from "@/context/NotificationContext";
import { useIntegrationContext } from "@/context/IntegrationContext";
import { FirstTimeScreenCommonVariant1 } from "@/components/first-time-screens";
import AudienceSynergyPreview from "@/components/first-time-screens/AudienceSynergyPreview";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";
import { PixelManagment } from "./components/PixelManagmentTab";
import { UserIntegrationListTab } from "./components/UserIntegrationListTab";
import { ActiveIntegration, IntegrationCredentials } from "./components/types";

const Integrations = () => {
	const { hasNotification } = useNotification();
	const { needsSync, setNeedsSync } = useIntegrationContext();
	const [value, setValue] = useState("1");
	const [integrationsCredentials, setIntegrationsCredentials] = useState<
		IntegrationCredentials[]
	>([]);
	const [hasIntegrations, setHasIntegrations] = useState<Boolean>(false);
	const [integrations, setIntegrations] = useState<any[]>([]);
	const [status, setStatus] = useState<string>("");
	const router = useRouter();
	const [showSlider, setShowSlider] = useState(false);
	const [isLoading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("1");
	const searchParams = useSearchParams();
	const [integrationsAvailable, setActiveIntegrations] = useState<
		ActiveIntegration[]
	>([]);
	const statusIntegrate = searchParams.get("message");
	const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
		setActiveTab(newValue);
	};

	useEffect(() => {
		const code = searchParams.get("code");
		const scope = searchParams.get("scope");
		if (code && scope) {
			setValue("3");
			setActiveTab("3");
		}
	}, []);

	useEffect(() => {
		const fetchActiveIntegration = async () => {
			try {
				const response = await axiosInstance.get("/integrations/active");
				if (response.status === 200) {
					setActiveIntegrations(response.data);
				}
			} catch (error) {
				console.error(error);
			}
		};
		fetchActiveIntegration();
		const fetchIntegrationCredentials = async () => {
			try {
				setLoading(true);
				const response = await axiosInstance.get("/integrations/credentials/");
				if (response.status === 200) {
					setIntegrationsCredentials(response.data);
					setHasIntegrations(response.data.length > 0);
				}
			} catch (error) {
				if (error instanceof AxiosError && error.response?.status === 403) {
					const status = error.response.data.status;
					if (status === "NEED_BOOK_CALL") {
						sessionStorage.setItem("is_slider_opened", "true");
						setShowSlider(true);
					} else {
						setShowSlider(false);
					}
				}
			} finally {
				setLoading(false);
			}
		};
		const fetchIntegration = async () => {
			try {
				setLoading(true);
				const response = await axiosInstance.get("/integrations/");
				if (response.status === 200) {
					setIntegrations(response.data);
				}
			} finally {
				setLoading(false);
				setNeedsSync(false);
			}
		};
		if (value === "1") {
			fetchIntegrationCredentials();
			if (!status) {
				fetchIntegration();
			}
		}
	}, [value, needsSync]);

	const handleSaveSettings = (newIntegration: IntegrationCredentials) => {
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
	};

	const handleDeleteSettings = (serviceName: string) => {
		setIntegrationsCredentials((prevIntegrations) => {
			return prevIntegrations.filter(
				(integration) => integration.service_name !== serviceName,
			);
		});
	};
	const changeTab = (value: string) => {
		setValue(value);
	};
	const [showFirstTime, setShowFirstTime] = useState(true);
	useEffect(() => {
		if (!isLoading && !hasIntegrations) {
			setShowFirstTime(true);
		} else {
			setShowFirstTime(false);
		}
	}, [isLoading, hasIntegrations]);
	const handleBegin = () => {
		setShowFirstTime(false);
		setActiveTab("1");
	};
	return (
		<>
			{isLoading && <CustomizedProgressBar />}
			{!isLoading && (
				<>
					{showFirstTime && (
						<FirstTimeScreenCommonVariant1
							Header={{
								TextTitle: "Integrations",
								TextSubtitle:
									"Connect your favourite tools to automate tasks and ensure all your data is accessible in one place",
								link: "https://allsourceio.zohodesk.com/portal/en/kb/articles/what-is-integration",
							}}
							InfoNotification={{
								Text: "This page manages all your connected platforms and data pipelines in one centralized hub. View status, configure settings, and troubleshoot connections for seamless data flow across your marketing stack.",
							}}
							Content=<AudienceSynergyPreview
								tableSrc="/integrations-first-time-screen.svg"
								headerTitle="Connect Your Marketing Platforms"
								caption="Sync your audience data seamlessly with ad platforms and CRM tools to activate campaigns across channels."
								onOpenPopup={handleBegin}
								onBegin={handleBegin}
								beginDisabled={false}
								buttonLabel="Create Integration"
							/>
							HelpCard={{
								headline: "Struggling with Integrations?",
								description:
									"Get expert help connecting your platforms in a free 30-minute troubleshooting session.",
								helpPoints: [
									{
										title: "Connection Setup",
										description: "Step-by-step integration guidance",
									},
									{
										title: "Error Resolution",
										description: " Fix API/auth issues",
									},
									{
										title: "Data Flow Optimization",
										description: " Ensure seamless sync",
									},
								],
							}}
							LeftMenu={{
								header: "Fix & Optimize Your Data Flows",
								subtitle: "Free 30-Min Sync Strategy Session",
								items: [
									{
										Icon: SettingsIcon,
										title: "Connection Setup",
										subtitle: `We’ll verify your data sources are properly linked to deliver accurate insights.`,
									},
									{
										Icon: SpeedIcon,
										title: "Error Resolution",
										subtitle: `Diagnose and fix sync failures that skew your analytics.`,
									},
									{
										Icon: MovingIcon,
										title: "Data Flow Optimization",
										subtitle: "Streamline how insights reach your dashboards.",
									},
								],
							}}
							ContentStyleSX={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								maxWidth: "840px",
								margin: "0 auto",
								mt: 2,
							}}
						/>
					)}
					{!showFirstTime && (
						<TabContext value={value}>
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									width: "100%",
									mb: 0,
									"@media (max-width: 900px)": {
										flexDirection: "column",
										display: "flex",
										alignItems: "flex-start",
									},
									"@media (max-width: 600px)": {
										flexDirection: "column",
										display: "flex",
										ml: 0,
										alignItems: "flex-start",
									},
									"@media (max-width: 440px)": {
										flexDirection: "column",
										justifyContent: "flex-start",
									},
								}}
							>
								<Box
									sx={{
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
										position: "sticky",
										top: 0,
										pt: "12px",
										pb: "12px",
										pl: "8px",
										zIndex: 1,
										backgroundColor: "#fff",
										justifyContent: "space-between",
										width: "100%",
										"@media (max-width: 900px)": { left: 0, zIndex: 1 },
										"@media (max-width: 700px)": {
											flexDirection: "column",
											display: "flex",
											alignItems: "flex-start",
											zIndex: 1,
											width: "100%",
										},
										"@media (max-width: 440px)": {
											flexDirection: "column",
											pt: hasNotification ? "3rem" : "0.75rem",
											top: hasNotification ? "4.5rem" : "",
											zIndex: 1,
											justifyContent: "flex-start",
										},
										"@media (max-width: 400px)": {
											pt: hasNotification ? "4.25rem" : "",
											pb: "6px",
										},
									}}
								>
									<Box
										sx={{
											flexShrink: 0,
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
											width: "10%",
											gap: 1,
											"@media (max-width: 600px)": { mb: 2 },
											"@media (max-width: 440px)": { mb: 1 },
										}}
									>
										<Typography
											className="first-sub-title"
											sx={{
												fontFamily: "var(--font-nunito)",
												fontSize: "16px",
												lineHeight: "normal",
												fontWeight: 600,
												color: "#202124",
											}}
										>
											Integrations
										</Typography>

										<Box
											sx={{ "@media (max-width: 600px)": { display: "none" } }}
										>
											<CustomTooltip
												title={
													"Connect your favourite tools to automate tasks and ensure all your data is accessible in one place."
												}
												linkText="Learn more"
												linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/what-is-integration"
											/>
										</Box>
									</Box>

									<Box
										sx={{
											flexGrow: 1,
											display: "flex",
											justifyContent: "center",
											width: "100%",
											pr: "10%",
											alignItems: "center",
											"@media (max-width: 900px)": { pr: 0 },
											"@media (max-width: 600px)": { width: "97%", pr: "0" },
										}}
									>
										{status === "PIXEL_INSTALLATION_NEEDED" ? (
											""
										) : (
											<TabList
												centered
												aria-label="Integrations Tabs"
												TabIndicatorProps={{
													sx: { backgroundColor: "rgba(56, 152, 252, 1)" },
												}}
												sx={{
													textTransform: "none",
													minHeight: 0,
													pb: 0,
													"& .MuiTabs-indicator": {
														backgroundColor: "rgba(56, 152, 252, 1)",
														height: "1.4px",
													},
													"@media (max-width: 600px)": {
														border: "1px solid rgba(228, 228, 228, 1)",
														borderRadius: "4px",
														width: "100%",
														"& .MuiTabs-indicator": {
															height: "0",
														},
													},
												}}
												onChange={handleTabChange}
											/>
										)}
									</Box>
								</Box>
							</Box>
							<Box>
								<TabPanel
									value="1"
									sx={{
										flexGrow: 1,
										height: "100%",
										overflowY: "auto",
										padding: 0,
										ml: 1.5,
									}}
								>
									<UserIntegrationListTab
										integrationsCredentials={integrationsCredentials}
										changeTab={changeTab}
										integrations={integrations}
										integrationsAvailable={integrationsAvailable}
										handleSaveSettings={handleSaveSettings}
										handleDeleteSettings={handleDeleteSettings}
									/>
								</TabPanel>
								<TabPanel value="2" sx={{ width: "100%", padding: "12px 0px" }}>
									<Box sx={{ overflow: "auto", padding: 0 }}>
										<PixelManagment />
									</Box>
								</TabPanel>
							</Box>
						</TabContext>
					)}
				</>
			)}
			{showSlider && <Slider />}
		</>
	);
};

const IntegraitonsPage = () => {
	return (
		<SliderProvider>
			<Suspense fallback={<CustomizedProgressBar />}>
				<Integrations />
			</Suspense>
		</SliderProvider>
	);
};

export default IntegraitonsPage;
