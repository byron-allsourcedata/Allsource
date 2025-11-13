"use client";
import { Box, Typography, IconButton } from "@mui/material";
import { managementStyle } from "../management";
import CustomToolTip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InstallPixelSection from "@/components/InstallPixelSection";
import NotificationInfoBanner from "@/components/first-time-screens/NotificationInfoBanner";
import { useEffect, useState } from "react";
import GettingStartedSection from "@/components/PixelInstallationSection";
import { DomainWithStat } from "../../components/PixelSubheader";

const InstallPixel: React.FC = () => {
	const router = useRouter();
	const onBack = () => {
		router.push("/management");
	};
	const [domain, setDomain] = useState<DomainWithStat | null>(null);

	useEffect(() => {
		const meItem = sessionStorage.getItem("me");
		const currentDomain = sessionStorage.getItem("current_domain");

		if (!meItem || !currentDomain) {
			setDomain(null);
			return;
		}

		const meData = JSON.parse(meItem);
		const domains = meData?.domains || [];

		const foundDomain =
			domains.find((d: any) => d.domain === currentDomain) || null;
		setDomain(foundDomain);
	}, []);

	return (
		<Box sx={{ ...managementStyle.mainContent }}>
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					position: "sticky",
					top: 0,
					zIndex: 1,
					pt: 1.5,
					backgroundColor: "#fff",
					justifyContent: "space-between",
					width: "100%",
					mb: 3,
					"@media (max-width: 56.25rem)": {
						zIndex: 10,
					},
					"@media (max-width: 37.5rem)": {
						pt: "68px",
						flexDirection: "column",
						pl: "8px",
						alignItems: "flex-start",
						zIndex: 10,
						width: "100%",
						pr: 1.5,
					},
					"@media (max-width: 27.5rem)": {
						flexDirection: "column",
						zIndex: 1,
						justifyContent: "flex-start",
					},
					"@media (max-width: 25rem)": {
						pt: "20px",
						pb: ".375rem",
					},
				}}
			>
				<Box
					sx={{
						flexShrink: 0,
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: 1,
						"@media (max-width: 37.5rem)": { mb: 2 },
						"@media (max-width: 27.5rem)": { mb: 1 },
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: 3,
						}}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								gap: 1,
								pt: 0.75,
							}}
						>
							<IconButton onClick={onBack}>
								<ArrowBackIcon sx={{ color: "rgba(56, 152, 252, 1)" }} />
							</IconButton>
							<Typography
								className="first-sub-title"
								sx={{ textWrap: "nowrap" }}
							>
								Management - Add new domain
							</Typography>
							<CustomToolTip
								title={
									"Management is a feature that allows you to manage your account."
								}
								linkText="Learn more"
								linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/management"
							/>
						</Box>
					</Box>
				</Box>
			</Box>

			<Box sx={{ width: "100%", padding: "0px 152px" }}>
				<GettingStartedSection addDomain={true} showStepper={false} />
			</Box>
		</Box>
	);
};

export default InstallPixel;
