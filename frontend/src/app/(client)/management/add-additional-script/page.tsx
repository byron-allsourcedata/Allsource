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
import { SliderProvider } from "@/context/SliderContext";
import {
	CardsSection,
	FirstTimeScreenCommonVariant1,
} from "@/components/first-time-screens";
import WelcomePopup from "@/components/first-time-screens/CreatePixelSourcePopup";
import { EmptyAnalyticsPlaceholder } from "../../analytics/components/placeholders/EmptyPlaceholder";
import { MovingIcon, SettingsIcon, SpeedIcon } from "@/icon";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PixelManagementItem } from "../page";
import ScriptsPopup from "../components/ScriptsPopup";

type Domain = {
	id: number;
	domain: string;
};

type Me = {
	domains: Domain[];
};

type ScriptCardConfig = {
	key: string;
	title: string;
	subtitle: string;
	imageSrc: string;
	popupTitle: string;
	secondStepText: {
		button: string;
		default: string;
	};
	thirdStepText: string;
	showInstalled?: boolean;
};

const scriptCardConfigs: ScriptCardConfig[] = [
	{
		key: "view_product",
		title: "View Product",
		subtitle:
			"This script records product pages visited, time spent, and categories browsed.",
		imageSrc: "/view_product.svg",
		popupTitle: "View Product Script Installation",
		secondStepText: {
			button: "",
			default:
				"Insert this script just before the closing </body> tag on all product pages.",
		},
		thirdStepText:
			'Once the "View Product" pixel is added to your product pages, please wait 10–15 minutes. The pixel will be automatically marked as "Installed" after a visitor lands on a product page and is recognized in our system.',
	},
	{
		key: "add_to_cart",
		title: "Add to Cart",
		subtitle:
			"This script identifies users who showed purchase intent by adding items to cart.",
		imageSrc: "/add_to_cart.svg",
		popupTitle: "Add To Cart Script Installation",
		secondStepText: {
			button:
				"Place this script inside the <footer> tag or before the closing </body> tag on every page containing an 'Add to Cart' button. This script tracks 'Add to Cart' events triggered by button clicks.",
			default:
				"Place this script just before the closing </body> tag on all pages that include an 'Add to Cart' button to track events triggered on page load.",
		},
		thirdStepText:
			'Once the "Add to Cart" pixel is placed on your website, please wait 10–15 minutes. The pixel will be automatically marked as "Installed" after a user clicks an "Add to Cart" button and the event is registered in our system.',
	},
	{
		key: "converted_sale",
		title: "Converted Sales",
		subtitle:
			"This script tracks completed purchases and capturing order values.",
		imageSrc: "/converted_sale.svg",
		popupTitle: "Converted Sales Script Installation",
		secondStepText: {
			button:
				"Paste this script inside the <body> tag on the 'Thank You' or order confirmation page, triggering on the purchase button click.",
			default:
				"Place this script inside the <body> tag on the order confirmation (Thank You) page to track completed purchases on page load.",
		},
		thirdStepText:
			'Once the "Converted Sale" pixel is added to your order confirmation (Thank You) page, please wait 10–15 minutes. The pixel will be automatically marked as "Installed" after a purchase is completed and the conversion is tracked in our system.',
	},
];

const AddAdditionalScript: React.FC = () => {
	const [pixelData, setPixelData] = useState<PixelManagementItem[]>([]);
	const [openmanually, setOpen] = useState(false);
	const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
	const [selectedSecondText, setSelectedSecondText] = useState<{
		button: string;
		default: string;
	} | null>(null);
	const [selectedThirdText, setSelectedThirdText] = useState<string | null>(
		null,
	);
	const [pixelCode, setPixelCode] = useState<string | null>(null);
	const [secondPixelCode, setSecondPixelCode] = useState<string | null>(null);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState("");
	const [popupOpen, setPopupOpen] = useState(false);

	const getCurrentDomainId = (): number | null => {
		const currentDomain = sessionStorage.getItem("current_domain");
		const meRaw = sessionStorage.getItem("me");

		if (!currentDomain || !meRaw) return null;

		try {
			const me: Me = JSON.parse(meRaw);
			const domainObj = me.domains.find((d) => d.domain === currentDomain);
			return domainObj?.id ?? null;
		} catch {
			return null;
		}
	};

	const fetchScriptByType = async (
		type: string,
		popupTitle: string,
		secondStepText: {
			button: string;
			default: string;
		},
		thirdStepText: string,
	) => {
		const domainId = getCurrentDomainId();

		if (!domainId) {
			showErrorToast("Error fetching pixel script(no domain find)");
			return;
		}

		try {
			setIsLoading(true);
			const res = await axiosInstance.get(
				`/pixel-management/${type}/${domainId}`,
			);
			if (res.status === 200 && typeof res.data === "object") {
				const { button: buttonScript, default: defaultScript } = res.data;
				if (type === "view_product") {
					setPixelCode(defaultScript || null);
					setSecondPixelCode(null);
				} else {
					setPixelCode(buttonScript || null);
					setSecondPixelCode(defaultScript || null);
				}
				setSelectedTitle(popupTitle);
				setSelectedSecondText(secondStepText);
				setSelectedThirdText(thirdStepText);
				setOpen(true);
			} else {
				showErrorToast("Script not found.");
			}
		} catch (err) {
			showErrorToast("Error fetching pixel script.");
		} finally {
			setIsLoading(false);
		}
	};

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
			{isLoading && <CustomizedProgressBar />}
			<Box
				sx={{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					position: "sticky",
					top: 0,
					pl: "0.5rem",
					zIndex: 1,
					pt: 1.5,
					backgroundColor: "#fff",
					justifyContent: "space-between",
					width: "100%",
					"@media (max-width: 900px)": {
						zIndex: 1,
					},
					"@media (max-width: 600px)": {
						pt: "4.25rem",
						flexDirection: "column",
						pl: "0.5rem",
						alignItems: "flex-start",
						zIndex: 1,
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
				<Box sx={{ pr: 2 }}>
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
								items={scriptCardConfigs.map((card) => ({
									title: card.title,
									subtitle: card.subtitle,
									imageSrc: card.imageSrc,
									onClick: () =>
										fetchScriptByType(
											card.key,
											card.popupTitle,
											card.secondStepText,
											card.thirdStepText,
										),
									showRecommended: false,
									showInstalled: card.showInstalled,
								}))}
								itemProps={{
									xs: 12,
									sm: 6,
									md: 4,
								}}
								spacing={3}
								containerSx={{ gap: 0, display: "flex" }}
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
			<ScriptsPopup
				open={openmanually}
				handleClose={() => setOpen(false)}
				pixelCode={pixelCode || ""}
				secondPixelCode={secondPixelCode || ""}
				title={selectedTitle || ""}
				secondStepText={selectedSecondText || { button: "", default: "" }}
				thirdStepText={selectedThirdText || ""}
			/>
		</Box>
	);
};

const AddAdditionalScriptPage: React.FC = () => {
	return (
		<Suspense fallback={<CustomizedProgressBar />}>
			<SliderProvider>
				<AddAdditionalScript />
			</SliderProvider>
		</Suspense>
	);
};

export default AddAdditionalScriptPage;
