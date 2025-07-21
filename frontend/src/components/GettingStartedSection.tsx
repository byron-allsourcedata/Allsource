import type React from "react";
import { useEffect, useRef, useState } from "react";
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
	const verifyRef = useRef<HTMLDivElement | null>(null);
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
	const scrollToRef = (ref: React.RefObject<HTMLElement>) => {
		setTimeout(() => {
			ref.current?.scrollIntoView({ behavior: "smooth" });
		}, 1000);
	};

	const handleInstallStatusChange = (status: "success" | "failed" | null) => {
		setInstallationStatus(status);
		if (status === "success") {
			scrollToRef(verifyRef);
		}
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

	const shouldRenderBasedOnStatus = installationStatus === "success";

	return (
		<>
			<GetStartedHintsProvider>
				<Grid
					container
					sx={{
						height: "100%",
						pr: 2,
						"@media (max-width: 1200px)": { gap: 4, pr: 0 },
					}}
				>
					{showStepper && (
						<Grid
							item
							xs={12}
							md={4}
							order={{ xs: 1, md: 2 }}
							sx={{ display: { xs: "none", md: "block" } }}
						>
							<VerticalStepper steps={stepData} />
						</Grid>
					)}

					<Grid
						item
						xs={12}
						md={showStepper ? 8 : 12}
						order={{ xs: 2, md: 1 }}
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
						}}
					>
						<Typography
							variant="h4"
							component="h1"
							className="first-sub-title"
							sx={{
								...dashboardStyles.title,
								display: { md: "none" },
							}}
						>
							Install Your Pixel
						</Typography>

						{showStepper && (
							<Box sx={{ display: { md: "none" } }}>
								<VerticalStepper steps={stepData} />
							</Box>
						)}

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
							<Box ref={verifyRef}>
								<VerifyPixelIntegration
									domain={selectedDomain}
									showHint={showHintVerify}
								/>
							</Box>
						)}
					</Grid>
				</Grid>
			</GetStartedHintsProvider>
		</>
	);
};

export default GettingStartedSection;
