"use client";
import { Box, Typography, IconButton } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import { managementStyle } from "../management";
import CustomToolTip from "@/components/customToolTip";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showInfoToast } from "@/components/ToastNotification";
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
import { useSearchParams } from "next/navigation";
import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";
import { checkPixelInstallationPaid } from "@/services/checkPixelInstallPaid";

type Domain = {
	id: number;
	domain: string;
};

type Me = {
	domains: Domain[];
};

export type ScriptKey = "view_product" | "add_to_cart" | "converted_sale";
export type AdditionalScriptsInfo = Record<ScriptKey, boolean>;

export interface ScriptCardConfig {
	key: ScriptKey;
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
}

const scriptCardConfigs: ScriptCardConfig[] = [
	{
		key: "view_product",
		title: "View Product",
		subtitle:
			"This script records product pages visited, time spent, and categories browsed.",
		imageSrc: "/view_product.svg",
		popupTitle: "View Product Script Installation",
		secondStepText: {
			button:
				"Insert this script just before the closing </body> tag on all product pages.",
			default:
				"Insert this script just before the closing </body> tag on all product pages.",
		},
		thirdStepText: `Once the "View Product" pixel is added to your product pages, it will be automatically marked as "Installed" after a visitor lands on a product page and their activity is registered by Allsource.`,
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
			'Once the "Add to Cart" pixel is placed on your website, it will be automatically marked as "Installed" after Allsource receives the first contact with an "Add to Cart" event from your site.',
	},
	{
		key: "converted_sale",
		title: "Converted Sales",
		subtitle:
			"This script tracks completed purchases and captures order values.",
		imageSrc: "/converted_sale.svg",
		popupTitle: "Converted Sales Script Installation",
		secondStepText: {
			button:
				"Paste this script inside the <body> tag on the 'Thank You' or order confirmation page, triggering on the purchase button click.",
			default:
				"Place this script inside the <body> tag on the order confirmation (Thank You) page to track completed purchases on page load.",
		},
		thirdStepText:
			'Once the "Converted Sale" pixel is added to your order confirmation (Thank You) page, it will be automatically marked as "Installed" after a completed purchase is recorded by Allsource.',
	},
];

const AddAdditionalScript: React.FC = () => {
	const [installedStatus, setInstalledStatus] = useState<AdditionalScriptsInfo>(
		{
			view_product: false,
			add_to_cart: false,
			converted_sale: false,
		},
	);
	const [openmanually, setOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<ScriptKey | undefined>(
		undefined,
	);
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
	const searchParams = useSearchParams();
	const domainIdParam = searchParams.get("domain_id");
	const parsedDomainId = domainIdParam ? parseInt(domainIdParam, 10) : null;
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
		type: ScriptKey,
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

		if (installedStatus[type]) {
			showInfoToast(`Script ${type} is already installed, aborting...`);
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

	const fetchData = async () => {
		if (!parsedDomainId) return;

		try {
			setLoading(true);
			const response = await axiosInstance.get<AdditionalScriptsInfo>(
				`/pixel-management/additional_scripts?domain_id=${parsedDomainId}`,
			);

			if (response.status === 200 && response.data) {
				setInstalledStatus(response.data);
			}
		} catch (error) {
			showErrorToast(`Error fetching data: ${error}`);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (parsedDomainId) {
			fetchData();
		}
	}, [parsedDomainId]);

	useEffect(() => {
		checkPixelInstallationPaid();
	}, []);

	const { whitelabel } = useWhitelabel();

	if (loading) {
		return <CustomizedProgressBar />;
	}

	const onBack = () => {
		router.push("/management");
	};

	const replaceBrandname = (text: string) =>
		text.replaceAll("Allsource", whitelabel.brand_name);

	const configsWithStatus: ScriptCardConfig[] = scriptCardConfigs
		.map((config) => ({
			...config,
			title: replaceBrandname(config.title),
			subtitle: replaceBrandname(config.subtitle),
			popupTitle: replaceBrandname(config.popupTitle),
			secondStepText: {
				button: replaceBrandname(config.secondStepText.button),
				default: replaceBrandname(config.secondStepText.default),
			},
			thirdStepText: replaceBrandname(config.thirdStepText),
		}))
		.map((config) => ({
			...config,
			showInstalled: installedStatus[config.key],
		}));

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
								items={configsWithStatus.map((card) => ({
									title: card.title,
									subtitle: card.subtitle,
									imageSrc: card.imageSrc,
									onClick: card.showInstalled
										? undefined
										: () => {
												setSelectedType(card.key);
												fetchScriptByType(
													card.key,
													card.popupTitle,
													card.secondStepText,
													card.thirdStepText,
												);
											},
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
				type={selectedType}
				open={openmanually}
				handleClose={() => setOpen(false)}
				pixelCode={pixelCode ?? ""}
				secondPixelCode={secondPixelCode ?? ""}
				title={selectedTitle ?? ""}
				secondStepText={selectedSecondText ?? { button: "", default: "" }}
				thirdStepText={selectedThirdText ?? ""}
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
