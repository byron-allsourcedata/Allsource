"use client";
import type React from "react";
import { useState, useEffect, Suspense, type FC, type ReactNode } from "react";
import { Box, Typography, Button, AppBar } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { planStyles } from "./settingsStyles";
import { SettingsAccountDetails } from "./components/SettingsAccountDetails";
import { SettingsTeams } from "./components/SettingsTeams";
import { SettingsBilling } from "./components/SettingsBilling";
import { SettingsSubscription } from "./components/SettingsSubscription";
import { SettingsApiDetails } from "./components/SettingsApiDetails";
import axiosInterceptorInstance, {
	useAxios,
} from "@/axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CustomTooltip from "@/components/customToolTip";
import { useNotification } from "@/context/NotificationContext";
import { WhitelabelSettingsPage } from "@/app/features/whitelabel/WhitelabelSettingsPage";
import { flagStore } from "@/services/oneDollar";

const Settings: React.FC = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const section = searchParams.get("section") ?? "accountDetails";

	const { hasNotification } = useNotification();
	const [activeSection, setActiveSection] = useState<string>(section);
	const [accountDetails, setAccountDetails] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [userHasSubscription, setUserHasSubscription] = useState(false);

	const [{ data: whitelabelEnabled }] = useAxios({
		url: "/whitelabel/is-enabled",
	});

	const fetchAccountDetails = async () => {
		try {
			setIsLoading(true);
			const response = await axiosInterceptorInstance.get(
				"/settings/account-details",
			);
			const data = response.data;
			setAccountDetails(data);
			setUserHasSubscription(data.has_subscription);
		} catch (error) {
			console.error("Error fetching account details:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const sectionFromUrl = searchParams.get("section");
		const paymentFailed = searchParams.get("payment_failed");
		if (sectionFromUrl && (userHasSubscription || paymentFailed)) {
			setActiveSection(sectionFromUrl);
		}
		fetchAccountDetails();
	}, [searchParams]);

	const handleTabChange = (section: string) => {
		setActiveSection(section);
		router.push(`/settings?section=${section}`);
	};

	const tabProps = {
		handleTabChange,
		activeTab: activeSection,
	};

	const tabs = {} as Record<string, ReactNode>;

	if (whitelabelEnabled) {
		tabs.whitelabel = <WhitelabelSettingsPage />;
	}

	const selectedTab: ReactNode | undefined =
		tabs[activeSection as keyof typeof tabs];

	return (
		<Box sx={{ position: "relative", width: "100%" }}>
			<AppBar
				position="sticky"
				color="inherit"
				sx={{ boxShadow: "none", pl: 0.5, zIndex: 5 }}
			>
				<Box
					sx={{
						display: "flex",
						width: "100%",
						flexDirection: "row",
						alignItems: "center",
						gap: 1,
						padding: "1rem 0rem 1rem",
						position: "sticky",
						right: "16px",
						top: 0,
						background: "#fff",
						"@media (max-width: 1199px)": {
							paddingTop: "1rem",
						},
						"@media (max-width: 900px)": {
							width: "100%",
							pl: "0px",
							pr: "16px",
							left: "0px",
							flexDirection: "column",
							alignItems: "start",
							justifyContent: "space-between",
						},
					}}
				>
					<Typography
						variant="h4"
						gutterBottom
						className="first-sub-title"
						sx={{
							...planStyles.title,
							gap: 1,
							alignItems: "center",
							justifyContent: "center",
							display: "flex",
							flexDirection: "row",
						}}
					>
						Settings{" "}
						<CustomTooltip
							title={
								"The Settings menu allows you to customise your user experience, manage your account preferences, and adjust notifications."
							}
							linkText="Learn more"
							linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/settings"
						/>
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: 4.25,
							overflowX: "auto",
							justifyContent: "center",
							width: "86%",
							alignItems: "center",
							"@media (max-width: 900px)": {
								width: "100%",
								gap: 2.5,
								justifyContent: "space-between",
							},
							"@media (max-width: 400px)": { width: "100%", gap: 1.25 },
							"@media (max-width: 350px)": {
								width: "100%",
								gap: 1,
								overflow: "hidden",
							},
						}}
					>
						<SettingTab
							tabName="accountDetails"
							label="Account Details"
							userHasSubscription={userHasSubscription}
							{...tabProps}
						/>
						<SettingTab
							tabName="teams"
							label="Teams"
							userHasSubscription={userHasSubscription}
							{...tabProps}
						/>
						<SettingTab
							tabName="billing"
							label="Billing"
							userHasSubscription={userHasSubscription}
							{...tabProps}
						/>
						<SettingTab
							tabName="subscription"
							label="Subscription"
							userHasSubscription={userHasSubscription}
							{...tabProps}
						/>
						{whitelabelEnabled && (
							<SettingTab
								tabName="whitelabel"
								label="Whitelabel"
								disabled={!userHasSubscription}
								userHasSubscription={true}
								{...tabProps}
							/>
						)}
					</Box>
				</Box>
			</AppBar>

			{isLoading && <CustomizedProgressBar />}

			<Box
				sx={{
					flexGrow: 1,
					overflowY: "auto",
					overflowX: "hidden",
					pl: 1,
				}}
			>
				{activeSection === "accountDetails" && accountDetails && (
					<SettingsAccountDetails accountDetails={accountDetails} />
				)}

				{activeSection === "teams" && <SettingsTeams />}

				{activeSection === "billing" && <SettingsBilling />}

				{activeSection === "subscription" && <SettingsSubscription />}

				{activeSection === "apiDetails" && <SettingsApiDetails />}
			</Box>
			{/* didn't want to break something with overflows, so copied the container here for new tabs*/}
			<Box
				sx={{
					flexGrow: 1,
					pl: 1,
				}}
			>
				{selectedTab}
			</Box>
		</Box>
	);
};

const SettingsPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<Settings />
		</Suspense>
	);
};

type Props = {
	label: string;
	tabName: string;
	activeTab: string;
	disabled?: boolean;
	userHasSubscription: boolean;
	handleTabChange: (tab: string) => void;
};

const SettingTab: FC<Props> = ({
	tabName,
	activeTab,
	disabled,
	handleTabChange,
	label,
	userHasSubscription,
}) => {
	return (
		<Button
			className="tab-heading"
			disabled={disabled}
			sx={planStyles.buttonHeading}
			variant={activeTab === tabName ? "contained" : "outlined"}
			onClick={() => {
				if (
					!userHasSubscription &&
					tabName !== "accountDetails" &&
					tabName !== "teams"
				) {
					flagStore.set(true);
					return;
				}
				handleTabChange(tabName);
			}}
		>
			{label}
		</Button>
	);
};

export default SettingsPage;
