"use client";
import { Box, Typography, IconButton } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { managementStyle } from "../management";
import CustomToolTip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast } from "@/components/ToastNotification";
import GettingStartedSection from "@/components/GettingStartedSection";
import { SliderProvider } from "@/context/SliderContext";
import {
	AudienceSynergyPreview,
	FirstTimeScreenCommonVariant2,
} from "@/components/first-time-screens";
import DomainButtonSelect from "../../components/NavigationDomainButton";
import ManagementTable from "../components/ManagementTable";
import {
	CardsSection,
	FirstTimeScreenCommonVariant1,
} from "@/components/first-time-screens";
import WelcomePopup from "@/components/first-time-screens/CreatePixelSourcePopup";
import { EmptyAnalyticsPlaceholder } from "../../analytics/components/placeholders/EmptyPlaceholder";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PixelManagementItem } from "../page";
import FeatureCardWithButton from "@/components/first-time-screens/FeatureCardWithButton";

const Management: React.FC = () => {
	const [pixelData, setPixelData] = useState<PixelManagementItem[]>([]);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState("");
	const [popupOpen, setPopupOpen] = useState(false);

	const checkPixel = async () => {
		try {
			const response = await axiosInstance.get("/check-user-authorization");
			if (response.data.status === "NEED_BOOK_CALL") {
				sessionStorage?.setItem("is_slider_opened", "true");
			}
		} catch (error) {
			if (error instanceof AxiosError && error.response?.status === 403) {
				if (error.response.data.status === "PIXEL_INSTALLATION_NEEDED") {
					setStatus(error.response.data.status);
				}
			} else {
				showErrorToast(`Error fetching data:${error}`);
			}
		} finally {
			setLoading(false);
		}
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/pixel-management");
			if (response.status === 200) {
				setPixelData(response.data);
			}
		} catch (error) {
			showErrorToast(`Error fetching data:${error}`);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		checkPixel();
		fetchData();
	}, []);

	if (loading) {
		return <CustomizedProgressBar />;
	}

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
					pl: "8px",
					zIndex: 1,
					pt: 1.5,
					backgroundColor: "#fff",
					justifyContent: "space-between",
					width: "100%",
					"@media (max-width: 56.25rem)": {
						zIndex: 1,
					},
					"@media (max-width: 37.5rem)": {
						pt: "68px",
						flexDirection: "column",
						pl: "8px",
						alignItems: "flex-start",
						zIndex: 1,
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
								Management - Check Pixel Health
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
				<Box
					sx={{
						flexGrow: 1,
						flexShrink: 1,
						display: "flex",
						overflow: "hidden",
						justifyContent: "center",
						width: "100%",
						pr: "10%",
						alignItems: "center",
						"@media (max-width: 56.25rem)": { pr: 0 },
						"@media (max-width: 37.5rem)": {
							width: "100%",
							pr: "0",
						},
					}}
				/>
			</Box>

			{false && <EmptyAnalyticsPlaceholder />}
			{true && (
				<Box sx={{ pr: 2, width: "100%" }}>
					<FirstTimeScreenCommonVariant1
						InfoNotification={{
							Text: "Check if your pixel is active and recording visitor interactions on your website.",
							sx: {
								width: "100%",
								"@media (max-width: 37.5rem)": { pt: 3 },
								"@media (max-width: 25rem)": { pt: 5 },
							},
						}}
						Content={
							<FeatureCardWithButton
								title={"Check Pixel Health "}
								subtitle={"Test if your pixel works properly across all pages."}
								imageSrc={"/check-pixel-health.svg"}
								img_height={203}
								img_width={373}
								onClick={() => {}}
								buttonLabel={"Test"}
								showRecommended={false}
							/>
						}
						MainBoxStyleSX={{ width: "100%" }}
						ContentStyleSX={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							width: "100%",
							margin: "0 auto",
							padding: "0rem 9.5rem",
							mt: 2,
							"@media (max-width: 600px)": {
								padding: 0,
							},
						}}
					/>
					{popupOpen && (
						<WelcomePopup
							open={popupOpen}
							onClose={() => setPopupOpen(false)}
							variant="integration"
						/>
					)}
				</Box>
			)}
		</Box>
	);
};

const ManagementPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<SliderProvider>
				<Management />
			</SliderProvider>
		</Suspense>
	);
};

export default ManagementPage;
