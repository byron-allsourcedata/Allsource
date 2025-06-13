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
import { FirstTimeScreenCommonVariant2 } from "@/components/first-time-screens";
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

export type PixelKey =
	| "is_view_product_installed"
	| "is_add_to_cart_installed"
	| "is_converted_sales_installed";

export interface AdditionalPixel {
	is_add_to_cart_installed: boolean;
	is_converted_sales_installed: boolean;
	is_view_product_installed: boolean;
	[key: string]: boolean;
}

export interface PixelManagementItem {
	id: number;
	domain_name: string;
	pixel_status: boolean;
	additional_pixel: AdditionalPixel;
	resulutions: any;
	data_sync: number;
}

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
					pl: "0.5rem",
					zIndex: 10000,
					pt: 1.5,
					backgroundColor: "#fff",
					justifyContent: "space-between",
					width: "100%",
					"@media (max-width: 900px)": {
						zIndex: 10,
					},
					"@media (max-width: 600px)": {
						pt: "4.25rem",
						flexDirection: "column",
						pl: "0.5rem",
						alignItems: "flex-start",
						zIndex: 10,
						width: "100%",
						pr: 1.5,
					},
					"@media (max-width: 440px)": {
						flexDirection: "column",
						zIndex: 1,
						justifyContent: "flex-start",
					},
					"@media (max-width: 400px)": {
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
						gap: 1,
						"@media (max-width: 600px)": { mb: 2 },
						"@media (max-width: 440px)": { mb: 1 },
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
								Management - Add Additional Pixel Script
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
						"@media (max-width: 900px)": { pr: 0 },
						"@media (max-width: 600px)": {
							width: "100%",
							pr: "0",
						},
					}}
				/>
			</Box>

			{false && <EmptyAnalyticsPlaceholder />}
			{true && (
				<Box sx={{ mt: 2 }}>
					<FirstTimeScreenCommonVariant1
						WarningNotification={{
							condition: false,
							ctaUrl: "/integrations",
							ctaLabel: "Add Integration",
							message:
								"You need to create at least one integration before you can sync your audience",
						}}
						InfoNotification={{
							Text: "Install these script to segment users by conversions, browsing, and cart activity.",
							sx: {
								width: "100%",
								"@media (max-width: 600px)": { pt: 3, pr: 2 },
							},
						}}
						Content={
							<CardsSection
								items={[
									{
										title: "Converted Sales",
										subtitle:
											"This script tracks completed purchases and capturing order values.",
										imageSrc: "/converted_sale.svg",
										onClick: () => {},
										showRecommended: false,
									},
									{
										title: "Add to Cart",
										subtitle:
											"This script identifies users who who showed purchase intent by adding items to cart.",
										imageSrc: "/add_to_cart.svg",
										onClick: () => {},
										showRecommended: false,
									},
									{
										title: "View Product",
										subtitle:
											"This script records product pages visited, time spent, and categories browsed.",
										imageSrc: "/view_product.svg",
										onClick: () => {},
										showRecommended: false,
									},
								]}
							/>
						}
						HelpCard={{
							headline: "Need Help with Pixel Setup?",
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
						MainBoxStyleSX={{ width: "100%" }}
						ContentStyleSX={{
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							width: "100%",
							margin: "0 auto",
							mt: 2,
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
