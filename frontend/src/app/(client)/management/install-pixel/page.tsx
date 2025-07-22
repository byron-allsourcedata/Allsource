"use client";
import { Box, Typography, IconButton } from "@mui/material";
import { managementStyle } from "../management";
import CustomToolTip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InstallPixelSection from "@/components/InstallPixelSection";
import NotificationInfoBanner from "@/components/first-time-screens/NotificationInfoBanner";
import { useState } from "react";

const InstallPixel: React.FC = () => {
	const [bannerVisible, setBannerVisible] = useState(true);
	const router = useRouter();
	const onBack = () => {
		router.push("/management");
	};

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
								Management - Install Tracking Pixel
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

			<Box
				sx={{
					width: "100%",
					padding: "0px 152px",
					"@media(max-width: 600px)": { padding: "0px 12px" },
				}}
			>
				<InstallPixelSection />
			</Box>
		</Box>
	);
};

export default InstallPixel;
