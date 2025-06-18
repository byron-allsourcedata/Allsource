import type React from "react";
import { useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { dashboardStyles } from "@/app/(client)/analytics/dashboardStyles";
import PixelInstallation from "@/app/(client)/analytics/components/PixelInstallation";
import VerifyPixelIntegration from "./VerifyPixelIntegration";
import { GetStartedHintsProvider } from "@/app/(client)/analytics/components/context/PixelInstallHintsContext";

type InstallPixelSectionProps = {
	newDomain?: boolean;
};

const InstallPixelSection: React.FC<InstallPixelSectionProps> = ({
	newDomain,
}) => {
	const [selectedDomain, setSelectedDomain] = useState("");
	const [showHintVerify, setShowHintVerify] = useState(false);
	const [selectedMethod, setSelectedMethod] = useState<string | null>("");
	const [installationStatus, setInstallationStatus] = useState<
		"success" | "failed" | null
	>(null);

	const handleInstallStatusChange = (status: "success" | "failed" | null) => {
		setInstallationStatus(status);
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
		const currentDomain = sessionStorage.getItem("current_domain");
		if (currentDomain) {
			setSelectedDomain(currentDomain);
		}
	}, []);

	const shouldShowVerifyComponent =
		selectedDomain !== "" && selectedMethod !== "" && selectedMethod !== null;

	const isGoogleOrManualMethod =
		selectedMethod === "google" || selectedMethod === "manual";

	const shouldRenderBasedOnStatus =
		!isGoogleOrManualMethod || installationStatus === "success";

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
						{selectedDomain !== "" && (
							<PixelInstallation
								step={1}
								onInstallStatusChange={handleInstallStatusChange}
								onInstallSelected={(method) => {
									setShowHintVerify(true);
								}}
							/>
						)}

						{shouldShowVerifyComponent && shouldRenderBasedOnStatus && (
							<VerifyPixelIntegration
								step={2}
								domain={selectedDomain}
								showHint={showHintVerify}
							/>
						)}
					</Grid>
					<Grid
						item
						xs={12}
						lg={12}
						sx={{
							display: { xs: "none", md: "block" },
							order: { xs: 2, sm: 2, md: 2, lg: 1 },
						}}
					>
						<Box sx={{ overflow: "visible" }}>
							{selectedDomain !== "" && (
								<PixelInstallation
									step={1}
									onInstallStatusChange={handleInstallStatusChange}
									onInstallSelected={(method) => {
										setSelectedMethod(method);
										setShowHintVerify(true);
									}}
								/>
							)}
							{shouldShowVerifyComponent && shouldRenderBasedOnStatus && (
								<VerifyPixelIntegration
									step={2}
									domain={selectedDomain}
									showHint={showHintVerify}
								/>
							)}
						</Box>
					</Grid>
				</Grid>
			</GetStartedHintsProvider>
		</>
	);
};

export default InstallPixelSection;
