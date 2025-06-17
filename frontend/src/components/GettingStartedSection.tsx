import type React from "react";
import { useEffect, useState } from "react";
import { Box, Link as MuiLink, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "@/app/(client)/analytics/dashboardStyles";
import {
	type StepConfig,
	VerticalStepper,
} from "@/app/(client)/analytics/components/VerticalStepper";
import PixelInstallation from "@/app/(client)/analytics/components/PixelInstallation";
import VerifyPixelIntegration from "../components/VerifyPixelIntegration";
import RevenueTracking from "@/components/RevenueTracking";
import CustomTooltip from "@/components/customToolTip";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DomainVerificationOutlinedIcon from "@mui/icons-material/DomainVerificationOutlined";
import OpenInBrowserOutlinedIcon from "@mui/icons-material/OpenInBrowserOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import DomainSelector from "@/app/(client)/analytics/components/DomainSelector";
import { GetStartedHintsProvider } from "@/app/(client)/analytics/components/context/PixelInstallHintsContext";

type GettingStartedSectionProps = {
	addDomain?: boolean;
	showStepper?: boolean;
};

const GettingStartedSection: React.FC<GettingStartedSectionProps> = ({
	addDomain,
	showStepper = true,
}) => {
	const [selectedDomain, setSelectedDomain] = useState("");
	const [showHintVerify, setShowHintVerify] = useState(false);
	const [selectedMethod, setSelectedMethod] = useState<string | null>("");
	const [installationStatus, setInstallationStatus] = useState<
		"success" | "failed" | null
	>(null);
	const [stepData, setStepData] = useState<StepConfig[]>([
		{
			label: "Choose a domain",
			status: "active",
			icon: (
				<DomainVerificationOutlinedIcon
					sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
				/>
			),
		},
		{
			label: "Select Installation Method",
			status: "default",
			icon: (
				<OpenInBrowserOutlinedIcon
					sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
				/>
			),
		},
		{
			label: "Verify integration",
			status: "default",
			icon: (
				<VerifiedIcon
					sx={{ color: "rgba(255, 255, 255, 1)", fontSize: "17px" }}
				/>
			),
		},
	]);

	const handleInstallStatusChange = (status: "success" | "failed" | null) => {
		setInstallationStatus(status);

		const updatedStepData = [...stepData];
		if (status === "success") {
			updatedStepData[1].status = "completed";
			updatedStepData[2].status = "active";
		} else {
			updatedStepData[1].status = "active";
			updatedStepData[2].status = "default";
		}

		setStepData(updatedStepData);
	};

	useEffect(() => {
		const handleRedirect = async () => {
			const query = new URLSearchParams(window.location.search);
			const authorizationGoogleCode = query.get("code");
			const installBigcommerce = query.get("install_bigcommerce");
			const googleScope = query.get("scope");
			if ((authorizationGoogleCode && googleScope) || installBigcommerce) {
				const currentDomain = sessionStorage.getItem("current_domain");
				if (currentDomain) {
					setSelectedDomain(currentDomain);
				}
			}
		};

		handleRedirect();
	}, []);

	useEffect(() => {
		if (selectedDomain !== "") {
			setStepData((prev) => [
				{ ...prev[0], status: "completed" },
				{ ...prev[1], status: "active" },
				{ ...prev[2], status: "default" },
			]);
		} else {
			setStepData((prev) => [
				{ ...prev[0], status: "completed" },
				{ ...prev[1], status: "default" },
				{ ...prev[2], status: "default" },
			]);
		}
	}, [selectedDomain]);

	const defaultStepIcons = [
		<DomainVerificationOutlinedIcon
			key="domain-verification"
			sx={{ color: "white", fontSize: "17px" }}
		/>,
		<OpenInBrowserOutlinedIcon
			key="open-in-browser"
			sx={{ color: "white", fontSize: "17px" }}
		/>,
		<VerifiedIcon key="verified" sx={{ color: "white", fontSize: "17px" }} />,
	];

	const handleInstallSelected = (
		method: "manual" | "google" | "cms" | null,
	) => {
		setInstallationStatus(null);
		if (method === null) {
			const newStepData: StepConfig[] = [
				{
					label: "Choose a domain",
					status: "completed",
					icon: defaultStepIcons[0],
				},
				{
					label: "Select Installation Method",
					status: "active",
					icon: defaultStepIcons[1],
				},
				{
					label: "Verify integration",
					status: "default",
					icon: defaultStepIcons[2],
				},
			];
			setStepData(newStepData);
		} else {
			const newStepData: StepConfig[] = [
				{
					label: "Choose a domain",
					status: "completed",
					icon: defaultStepIcons[0],
				},
				{
					label: "Select Installation Method",
					status: method === "google" ? "active" : "completed",
					icon: defaultStepIcons[1],
				},
				{
					label: "Verify integration",
					status: method === "google" ? "default" : "active",
					icon: defaultStepIcons[2],
				},
			];
			setStepData(newStepData);
		}
	};

	const shouldShowVerifyComponent =
		selectedDomain !== "" && selectedMethod !== "" && selectedMethod !== null;

	const isGoogleOrManualMethod =
		selectedMethod === "google" || selectedMethod === "manual";

	const shouldRenderBasedOnStatus =
		!isGoogleOrManualMethod || installationStatus === "success";

	const isCenteredLayout = !showStepper;

	return (
		<>
			<GetStartedHintsProvider>
				<Grid
					container
					sx={{
						height: "100%",
						pr: 2,
						justifyContent: isCenteredLayout ? "center" : undefined,
						alignItems: isCenteredLayout ? "center" : undefined,
						"@media (max-width: 1200px)": { gap: 4, pr: 0 },
					}}
				>
					<Grid
						item
						xs={12}
						sx={{ display: { md: "none" }, overflow: "hidden" }}
					>
						<Typography
							variant="h4"
							component="h1"
							className="first-sub-title"
							sx={dashboardStyles.title}
						>
							Install Your Pixel
						</Typography>
						{showStepper && <VerticalStepper steps={stepData} />}
						<DomainSelector
							onDomainSelected={(domain) => {
								setSelectedDomain(domain ? domain.domain : "");
							}}
							selectedDomainProp={selectedDomain}
							addDomain={addDomain}
						/>
						{selectedDomain !== "" && (
							<PixelInstallation
								onInstallStatusChange={handleInstallStatusChange}
								onInstallSelected={(method) => {
									handleInstallSelected(method);
									setShowHintVerify(true);
								}}
							/>
						)}

						{shouldShowVerifyComponent && shouldRenderBasedOnStatus && (
							<VerifyPixelIntegration
								domain={selectedDomain}
								showHint={showHintVerify}
							/>
						)}
					</Grid>
					<Grid
						item
						xs={12}
						lg={showStepper ? 8 : 12}
						sx={{
							display: { xs: "none", md: "block" },
							order: { xs: 2, sm: 2, md: 2, lg: 1 },
						}}
					>
						<Box sx={{ overflow: "visible" }}>
							<DomainSelector
								onDomainSelected={(domain) => {
									setSelectedDomain(domain ? domain.domain : "");
								}}
								selectedDomainProp={selectedDomain}
								addDomain={addDomain}
							/>
							{selectedDomain !== "" && (
								<PixelInstallation
									onInstallStatusChange={handleInstallStatusChange}
									onInstallSelected={(method) => {
										handleInstallSelected(method);
										setSelectedMethod(method);
										setShowHintVerify(true);
									}}
								/>
							)}
							{shouldShowVerifyComponent && shouldRenderBasedOnStatus && (
								<VerifyPixelIntegration
									domain={selectedDomain}
									showHint={showHintVerify}
								/>
							)}
						</Box>
					</Grid>
					{showStepper && (
						<Grid
							item
							xs={12}
							lg={4}
							sx={{
								display: { xs: "none", md: "block" },
								order: { xs: 1, sm: 1, md: 1, lg: 2 },
							}}
						>
							<VerticalStepper steps={stepData} />
						</Grid>
					)}
				</Grid>
			</GetStartedHintsProvider>
		</>
	);
};

export default GettingStartedSection;
