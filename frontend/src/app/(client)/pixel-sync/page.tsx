"use client";
import { Box, Typography, Button, Grid } from "@mui/material";
import React, { useState, useEffect, Suspense } from "react";
import { datasyncStyle } from "./datasyncStyle";
import CustomTooltip from "@/components/customToolTip";
import FilterListIcon from "@mui/icons-material/FilterList";
import Image from "next/image";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import DataSyncList from "./components/DataSyncList";
import { useRouter } from "next/navigation";
import WelcomePopup from "@/components/first-time-screens/CreatePixelSourcePopup";
import { EmptyAnalyticsPlaceholder } from "../analytics/components/placeholders/EmptyPlaceholder";

const centerContainerStyles = {
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	border: "1px solid rgba(235, 235, 235, 1)",
	borderRadius: 2,
	padding: 3,
	boxSizing: "border-box",
	width: "100%",
	textAlign: "center",
	flex: 1,
	"& img": {
		width: "auto",
		height: "auto",
		maxWidth: "100%",
	},
};
import FilterDatasync from "@/components/FilterDatasync";
import AudiencePopup from "@/components/AudienceSlider";
import { useNotification } from "@/context/NotificationContext";
// import FirstTimeScree from "./components/FirstTimeScree";
import {
	FirstTimeScreenCommonVariant1,
	FirstTimeScreenCommonVariant2,
} from "@/components/first-time-screens";
import AudienceSynergyPreview from "@/components/first-time-screens/AudienceSynergyPreview";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";
import { useIntegrationContext } from "@/context/IntegrationContext";
import { useZohoChatToggle } from "@/hooks/useZohoChatToggle";
import GettingStartedSection from "@/components/GettingStartedSection";

const DataSync = () => {
	const router = useRouter();
	const { hasNotification } = useNotification();
	const { needsSync } = useIntegrationContext();
	const [status, setStatus] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [filterPopup, setFilterPopup] = useState(false);
	const [filters, setFilters] = useState<any>();
	const [openCreateDataSyncPopup, setOpenCreateDataSyncPopup] = useState(false);
	const [hasContacts, setHasContacts] = useState(false);
	const [hasDataSync, setHasDataSync] = useState(false);

	useZohoChatToggle(filterPopup || openCreateDataSyncPopup);

	const handleFilterPopupOpen = () => {
		setFilterPopup(true);
	};

	const handleAudiencePopupOpen = () => {
		setOpenCreateDataSyncPopup(true);
	};

	const handleAudiencePopupClose = () => {
		setOpenCreateDataSyncPopup(false);
	};
	const handleFilterPopupClose = () => {
		setFilterPopup(false);
	};

	const onApply = (filter: any) => {
		setFilters(filter);
	};

	const installPixel = () => {
		router.push("/dashboard");
	};

	const [popupOpen, setPopupOpen] = useState(false);

	const handleOpenPopup = () => {
		setPopupOpen(true);
	};

	useEffect(() => {
		const openPopupHandler = () => setOpenCreateDataSyncPopup(true);

		window.addEventListener("open-sync-popup", openPopupHandler);

		return () => {
			window.removeEventListener("open-sync-popup", openPopupHandler);
		};
	}, []);

	useEffect(() => {
		const fetchIntegrations = async () => {
			try {
				setIsLoading(true);
				const response = await axiosInstance.get(
					"/data-sync/has-data-sync-and-contacts",
				);
				setHasDataSync(response.data.hasDataSync);
				setHasContacts(response.data.hasContacts);
			} catch (err) {
				if (err instanceof AxiosError && err.response?.status === 403) {
					if (err.response.data.status === "PIXEL_INSTALLATION_NEEDED") {
						setStatus("PIXEL_INSTALLATION_NEEDED");
					}
				}
				console.error("Error checking integrations:", err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchIntegrations();
	}, [needsSync]);

	if (isLoading) {
		return <CustomizedProgressBar />;
	}

	return (
		<>
			{isLoading && <CustomizedProgressBar />}
			{!isLoading && (
				<Box sx={datasyncStyle.mainContent}>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%",
							zIndex: 100,
							position: "sticky",
							bgcolor: "#fff",
							top: 0,
							pr: 2,
							"@media (max-width: 900px)": {
								pt: hasNotification ? 5 : 0,
							},
							"@media (max-width: 400px)": {
								pt: hasNotification ? 7 : 0,
							},
						}}
					>
						{hasContacts && hasDataSync && (
							<Box
								sx={{
									flexShrink: 0,
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									pl: "0.5rem",
									mt: 2.05,
									gap: 1,
									"@media (max-width: 900px)": { mb: 2 },
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
									Pixel Sync
								</Typography>
								<CustomTooltip
									title={
										"How data sync works and to customise your sync settings."
									}
									linkText="Learn more"
									linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/data-sync-contacts"
								/>
							</Box>
						)}
						{hasContacts && hasDataSync && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "end",
									mt: 2.05,
									gap: "15px",
									"@media (max-width: 900px)": {
										gap: "8px",
									},
								}}
							>
								<Button
									onClick={handleAudiencePopupOpen}
									aria-haspopup="true"
									disabled={status === "PIXEL_INSTALLATION_NEEDED"}
									sx={{
										textTransform: "none",
										color:
											status === "PIXEL_INSTALLATION_NEEDED"
												? "rgba(128, 128, 128, 1)"
												: "rgba(56, 152, 252, 1)",
										border: "1px solid rgba(56, 152, 252, 1)",
										borderRadius: "4px",
										padding: "9px 16px",
										opacity:
											status === "PIXEL_INSTALLATION_NEEDED" ? "0.4" : "1",
										minWidth: "auto",
										"@media (max-width: 900px)": {
											display: "none",
										},
									}}
								>
									<Typography
										className="second-sub-title"
										sx={{
											marginRight: "0.5em",
											padding: 0.2,
											textAlign: "left",
											color: "rgba(56, 152, 252, 1) !important",
										}}
									>
										Create Pixel Sync
									</Typography>
								</Button>
								<Button
									onClick={handleFilterPopupOpen}
									aria-haspopup="true"
									sx={{
										textTransform: "none",
										color: "rgba(128, 128, 128, 1)",
										border:
											filters?.length > 0
												? "1px solid rgba(56, 152, 252, 1)"
												: "1px solid rgba(184, 184, 184, 1)",
										borderRadius: "4px",
										padding: "8px",
										minWidth: "auto",
										position: "relative",
										"@media (max-width: 900px)": {
											border: "none",
											padding: 0,
										},
									}}
								>
									<FilterListIcon
										fontSize="medium"
										sx={{
											color:
												filters?.length > 0
													? "rgba(56, 152, 252, 1)"
													: "rgba(128, 128, 128, 1)",
										}}
									/>
								</Button>
							</Box>
						)}
					</Box>
					<Box
						sx={{
							width: "100%",
							pl: 0.5,
							pt: !hasContacts && !hasDataSync ? 5 : 0,
							pr: 1,
							"@media (max-width: 440px)": { pt: 3 },
						}}
					>
						{status === "PIXEL_INSTALLATION_NEEDED" && !isLoading ? (
							<Box sx={{ mr: 2 }}>
								<FirstTimeScreenCommonVariant2
									Header={{
										TextTitle: "Install Pixel",
									}}
									InfoNotification={{
										Text: "Pixel Sync page will be available after pixel installation",
									}}
									HelpCard={{
										headline: "Need Help with Pixel Setup?",
										description:
											"Book a 30-minute call, and our expert will guide you through the platform and troubleshoot any pixel issues.",
										helpPoints: [
											{
												title: "Quick Setup Walkthrough",
												description: "Step-by-step pixel installation help",
											},
											{
												title: "Troubleshooting Session",
												description: "Fix errors and verify your pixel",
											},
											{
												title: "Platform Demo",
												description: "See how everything works in action",
											},
										],
									}}
									Content={<GettingStartedSection />}
									ContentStyleSX={{
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
										alignItems: "center",
										width: "100%",
										pb: 2,
										mt: 2,
									}}
								/>
							</Box>
						) : !isLoading ? (
							<>
								{!hasContacts && <EmptyAnalyticsPlaceholder />}
								{hasContacts && !hasDataSync && (
									<Box sx={{ mt: 2 }}>
										<FirstTimeScreenCommonVariant1
											Header={{
												TextTitle: "Pixel Sync",
												TextSubtitle: "Customise your sync settings",
												link: "https://allsourceio.zohodesk.com/portal/en/kb/articles/data-sync",
											}}
											WarningNotification={{
												condition: false,
												ctaUrl: "/integrations",
												ctaLabel: "Add Integration",
												message:
													"You need to create at least one integration before you can sync your audience",
											}}
											InfoNotification={{
												Text: "This page shows real-time synchronization status across all your integrated platforms. Monitor data flows, troubleshoot delays, and ensure all systems are updating properly.",
											}}
											Content={
												<AudienceSynergyPreview
													tableSrc="/pixel_sync_FTS.svg"
													headerTitle="Sync Audience to Any Platform"
													caption="Send your pixel contacts segments to connected platforms like Meta Ads, Google Ads, and Mailchimp with one click."
													onOpenPopup={handleOpenPopup}
													onBegin={() => handleAudiencePopupOpen()}
													// beginDisabled={!hasIntegrations}
													buttonLabel="Create Pixel Sync"
												/>
											}
											HelpCard={{
												headline: "Need Help with Data Synchronization?",
												description:
													"Book a free 30-minute session to troubleshoot, optimize, or automate your data flows.",
												helpPoints: [
													{
														title: "Connection Setup",
														description: "Configure integrations correctly",
													},
													{
														title: "Sync Diagnostics",
														description: "Fix failed data transfers",
													},
													{
														title: "Mapping Assistance",
														description: "Align your data fields",
													},
												],
											}}
											LeftMenu={{
												header: "Fix & Optimize Your Data Flows",
												subtitle: "Free 30-Min Sync Audit",
												image: {
													url: "/data_sync_FTS.svg",
													width: 600,
													height: 300,
												},
												items: [
													{
														Icon: SettingsIcon,
														title: "Connection Setup",
														subtitle: `We’ll ensure your integrations are properly configured for reliable data flow.`,
													},
													{
														Icon: SpeedIcon,
														title: "Sync Diagnostics",
														subtitle: `Identify and resolve synchronization failures in real-time.`,
													},
													{
														Icon: MovingIcon,
														title: "Mapping Assistance",
														subtitle:
															"Align your source and destination fields perfectly.",
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
										{popupOpen && !hasDataSync && (
											<WelcomePopup
												open={popupOpen}
												onClose={() => setPopupOpen(false)}
												variant="integration"
											/>
										)}
									</Box>
								)}
								{hasContacts && hasDataSync && (
									<DataSyncList filters={filters} />
								)}
							</>
						) : (
							<></>
						)}
					</Box>
				</Box>
			)}
			<FilterDatasync
				open={filterPopup}
				onClose={handleFilterPopupClose}
				onApply={onApply}
				dataSyncType="pixel"
			/>
			<AudiencePopup
				open={openCreateDataSyncPopup}
				onClose={handleAudiencePopupClose}
			/>
		</>
	);
};

const DatasyncPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<DataSync />
		</Suspense>
	);
};

export default DatasyncPage;
