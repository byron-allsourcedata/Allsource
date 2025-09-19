"use client";
import type React from "react";
import { useEffect, useState, useMemo } from "react";
import {
	Box,
	Button,
	Typography,
	Modal,
	IconButton,
	Divider,
	Grid,
	Link,
	Input,
	TextField,
} from "@mui/material";
import type { AxiosError } from "axios";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import CustomTooltip from "@/components/customToolTip";
import { styles } from "../../../../css/cmsStyles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
	showErrorToast,
	showToast,
} from "../../../../components/ToastNotification";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { cmsHintCards } from "./context/hintsCardsContent";
import { useGetStartedHints } from "./context/PixelInstallHintsContext";
import HintCard from "@/app/(client)/components/HintCard";
import { useRef } from "react";
import CustomButton from "@/components/ui/CustomButton";
import CircularProgress from "@mui/material/CircularProgress";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";

interface HintCardInterface {
	description: string;
	title: string;
	linkToLoadMore: string;
}

const style = {
	bgcolor: "background.paper",
	p: 3,
	mt: 2,
	borderRadius: 2,
	border: "1px solid rgba(231, 231, 233, 1)",
	width: "100%",
	boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.08)",
	display: "flex",
	flexDirection: "column",
	transition: "transform 0.3s ease-in-out",
	transform: "translateX(100%)",
	"@media (max-width: 600px)": {
		width: "100%",
		height: "100%",
		p: 2,
	},
};

const openStyle = {
	transform: "translateX(0%)",
	right: 0,
};

const typographyStyles = {
	textTransform: "none",
	fontFamily: "var(--font-nunito)",
	fontSize: "14px",
	fontWeight: "500",
	lineHeight: "19.6px",
	color: "rgba(74, 74, 74, 1) !important",
	textWrap: "nowrap",
	paddingTop: "1em",
	paddingBottom: "0.75em",
};

const buttonStyles = (platform?: boolean) => ({
	backgroundColor: platform ? "rgba(240, 242, 245, 1)" : "#fff",
	display: "flex",
	flexDirection: "column",
	padding: "1em",
	borderColor: "rgba(228, 228, 228, 1)",
	border: platform
		? "1px solid rgba(56, 152, 252, 1)"
		: "1px solid rgba(228, 228, 228, 1)",
	width: "100%",
});

const buttonGoogle = (platform?: boolean) => ({
	backgroundColor: platform ? "rgba(240, 242, 245, 1)" : "#fff",
	display: "flex",
	flexDirection: "column",
	padding: "1em 2em 1.5em 1em",
	borderColor: "rgba(228, 228, 228, 1)",
	border: platform
		? "1px solid rgba(56, 152, 252, 1)"
		: "1px solid rgba(228, 228, 228, 1)",
	width: "100%",
});

const typographyGoogle = {
	textTransform: "none",
	color: "rgba(74, 74, 74, 1) !important",
	textWrap: "wrap",
	paddingTop: "0.25em",
	paddingBottom: "0.75em",
};

const maintext = {
	fontFamily: "var(--font-nunito)",
	fontSize: "14px",
	fontWeight: "600",
	lineHeight: "19.6px",
	color: "rgba(0, 0, 0, 1)",
	paddingTop: "1em",
	paddingBottom: "0.75em",
};

const subtext = {
	fontFamily: "var(--font-nunito)",
	fontSize: "15px",
	fontWeight: "600",
	lineHeight: "19.6px",
	textAlign: "center",
	color: "rgba(74, 74, 74, 1)",
	paddingTop: "0.25em",
	"@media (max-width: 600px)": { textAlign: "left", fontSize: "14px" },
};

interface CmsData {
	manual?: string;
	pixel_client_id?: string;
}

interface PopupProps {
	open: boolean;
	handleClose: () => void;
	pixelCode: string;
	pixel_client_id: string;
	onInstallStatusChange: (status: "success" | "failed" | null) => void;
}

const Popup: React.FC<PopupProps> = ({
	open,
	pixelCode,
	pixel_client_id,
	onInstallStatusChange,
}) => {
	const { cmsHints, changeCMSHint, resetCMSHints } = useGetStartedHints();
	const shopifyRef = useRef<HTMLDivElement | null>(null);
	const wordpressRef = useRef<HTMLDivElement | null>(null);
	const bigcommerceRef = useRef<HTMLDivElement | null>(null);
	const [showHint, setShowHint] = useState(true);
	const [selectedCMS, setSelectedCMS] = useState<string | null>(null);
	const [headerTitle, setHeaderTitle] = useState<string>("Install on CMS");
	const [access_token, setAccessToken] = useState("");
	const [accessTokenExists, setAccessTokenExists] = useState(false);
	const [storeHash, setstoreHash] = useState("");
	const [storeHashError, setStoreHashError] = useState(false);
	const [loading, setLoading] = useState(false);
	const [shopifyInstalled, setShopifyInstall] = useState(false);
	const [bigcommerceInstalled, setBigcommerceInstalled] = useState(false);
	const { whitelabel } = useWhitelabel();
	const sourcePlatform = useMemo(() => {
		if (typeof window !== "undefined") {
			const savedMe = sessionStorage.getItem("me");
			if (savedMe) {
				try {
					const parsed = JSON.parse(savedMe);
					return parsed.source_platform || "";
				} catch (error) {}
			}
		}
		return "";
	}, [typeof window !== "undefined" ? sessionStorage.getItem("me") : null]);
	const [errors, setErrors] = useState({
		access_token: "",
	});

	useEffect(() => {
		const fetchCredentials = async () => {
			const query = new URLSearchParams(window.location.search);
			const installBigcommerce = query.get("install_bigcommerce");
			if (installBigcommerce) {
				setSelectedCMS("Bigcommerce");
				if (installBigcommerce === "true") {
					onInstallStatusChange("success");
					setBigcommerceInstalled(true);
				}
			}
			try {
				const response_shopify = await axiosInstance.get(
					"/integrations/credentials/shopify",
				);
				if (response_shopify.status === 200) {
					setAccessToken(response_shopify.data.access_token);
					if (response_shopify.data.access_token) {
						setAccessTokenExists(true);
					}
				}
			} catch (error) {}
			try {
				const response_big_commerce = await axiosInstance.get(
					"/integrations/credentials/bigcommerce",
				);
				if (response_big_commerce.status === 200) {
					setstoreHash(response_big_commerce.data.shop_domain);
					if (response_big_commerce.data.shop_domain) {
						setAccessTokenExists(true);
					}
				}
			} catch (error) {}

			if (sourcePlatform === "shopify") {
				setSelectedCMS("Shopify");
				setHeaderTitle("Shopify settings");
			} else if (sourcePlatform === "big_commerce") {
				setSelectedCMS("Bigcommerce");
				setHeaderTitle("Bigcommerce settings");
			}
		};
		fetchCredentials();
	}, []);

	const [isFocused, setIsFocused] = useState(true);
	const handleFocus = () => {
		setIsFocused(true);
	};

	const handleBlur = () => {
		setIsFocused(false);
	};
	const handleCopyToClipboard = () => {
		onInstallStatusChange("success");
		navigator.clipboard.writeText(pixel_client_id);
		showToast("Site ID copied to clipboard!");
	};

	const handleStoreHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setstoreHash(value);
		setStoreHashError(!!value);
	};

	const cmsRefMap: Record<string, React.RefObject<HTMLDivElement>> = {
		Shopify: shopifyRef,
		WordPress: wordpressRef,
		Bigcommerce: bigcommerceRef,
	};

	const scrollToRef = (ref: React.RefObject<HTMLElement>) => {
		ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const handleButtonClick = async (cms: string) => {
		setSelectedCMS(cms);
		setShowHint(false);
		setHeaderTitle(`Install with ${cms}`);
		if (cms === "Shopify" && shopifyInstalled) {
			onInstallStatusChange("success");
		} else if (cms === "Bigcommerce" && bigcommerceInstalled) {
			onInstallStatusChange("success");
		} else {
			onInstallStatusChange(null);
		}
		const targetRef = cmsRefMap[cms];
		if (targetRef) {
			setTimeout(() => scrollToRef(targetRef), 100);
		}
	};

	const handleBackClick = () => {
		setSelectedCMS(null);
		setHeaderTitle("Install on CMS");
	};

	const validateField = (
		value: string | undefined,
		type: "access_token" | "shop_domain",
	): string => {
		const stringValue = value ? value.trim() : "";

		switch (type) {
			case "access_token":
				return stringValue ? "" : "Access Token is required";
			case "shop_domain":
				return stringValue ? "" : "Shop Domain is required";
			default:
				return "";
		}
	};

	const handleSubmitBigcommerce = async () => {
		const response = await axiosInstance.get(
			"/integrations/bigcommerce/oauth",
			{ params: { store_hash: storeHash } },
		);
		window.location.href = response.data.url;
	};

	function formatShopifyError(detail: any): string {
		if (!detail) return "An unexpected error occurred";

		switch (detail.status) {
			case "CREDENTIALS_INVALID": {
				if (
					Array.isArray(detail.missing_scopes) &&
					detail.missing_scopes.length > 0
				) {
					const scopesList = detail.missing_scopes
						.map((s: string) => `• ${s}`)
						.join("\n");
					return `${detail.message}\n\nMissing scopes:\n${scopesList}`;
				}
				return detail.message ?? "Access token is invalid";
			}
			case "STORE_DOMAIN":
				return "Store domain does not match the one you specified earlier";
			default:
				return `An unexpected error occurred: ${detail.status ?? "unknown"}`;
		}
	}

	const handleSubmit = async () => {
		const shop_domain_raw = sessionStorage.getItem("current_domain");
		const shop_domain = shop_domain_raw ?? "";
		const newErrors = {
			access_token: validateField(access_token, "access_token"),
		};
		setErrors(newErrors);

		if (newErrors.access_token) {
			return;
		}

		const accessToken = localStorage.getItem("token");
		if (!accessToken) return;

		const body: Record<string, any> = {
			shopify: {
				shop_domain: shop_domain.trim(),
				access_token: access_token.trim(),
			},
			pixel_install: true,
		};

		try {
			setLoading(true);
			const response = await axiosInstance.post("/integrations/", body, {
				params: {
					service_name: "shopify",
				},
			});

			if (response.status === 200) {
				showToast("Successfully installed pixel");
				setShopifyInstall(true);
				onInstallStatusChange("success");
			} else {
				showErrorToast("Failed to install pixel");
			}
		} catch (error: unknown) {
			const axiosError = error as AxiosError;
			const data = axiosError?.response?.data as {
				detail?: any;
				status?: string;
			};

			const detail = data?.detail ?? data;

			showErrorToast(formatShopifyError(detail));
		} finally {
			setLoading(false);
		}
	};

	const handleInstallButtonClick = () => {
		const shop_domain_raw = sessionStorage.getItem("current_domain");
		let url = shop_domain_raw ?? "";

		if (url) {
			if (!/^https?:\/\//i.test(url)) {
				url = "http://" + url;
			}

			const hasQuery = url.includes("?");
			const newUrl =
				url +
				(hasQuery ? "&" : "?") +
				"mff=true" +
				`&api=${process.env.NEXT_PUBLIC_API_DOMAIN}` +
				`&domain_url=${process.env.NEXT_PUBLIC_BASE_URL}/leads`;
			window.open(newUrl, "_blank");
		}
	};

	const isFormValid = () => {
		const shop_domain_raw = sessionStorage.getItem("current_domain");
		const errors = {
			access_token: validateField(access_token, "access_token"),
		};

		return !errors.access_token;
	};

	return (
		<Box sx={{ ...style, ...(open ? openStyle : {}), zIndex: 1200 }}>
			<Box sx={{ flex: 1 }}>
				<Box
					sx={{
						display: "flex",
						width: "100%",
						flexDirection: "row",
						alignItems: "center",
						gap: 2,
						justifyContent: "start",
					}}
				>
					<Image src="/1.svg" alt="1" width={20} height={20} />
					<Typography
						variant="h6"
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "16px",
							width: "100%",
							fontWeight: 600,
							color: "rgba(33, 43, 54, 1)",
							lineHeight: "21.82px",
							letterSpacing: "0.5px",
							textShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
							alignSelf: "flex-start",
							"@media (max-width: 600px)": {
								fontSize: "14px",
								textAlign: "left",
							},
						}}
					>
						Choose CMS
					</Typography>
					{cmsHints["chooseCMS"]?.show && showHint && (
						<HintCard
							card={cmsHintCards["chooseCMS"]}
							positionLeft={360}
							positionTop={50}
							isOpenBody={cmsHints["chooseCMS"].showBody}
							toggleClick={() =>
								changeCMSHint("chooseCMS", "showBody", "toggle")
							}
							closeClick={() => changeCMSHint("chooseCMS", "showBody", "close")}
						/>
					)}
				</Box>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						padding: "2em 0em 0em 0em",
						justifyContent: "start",
						gap: 3,
						"@media (max-width: 900px)": {
							flexDirection: "column",
						},
						"@media (max-width: 600px)": {
							flexDirection: "column",
						},
					}}
				>
					<Grid item xs={12} md={6} sx={{ width: "100%" }}>
						<Button
							variant="outlined"
							fullWidth
							onClick={() => handleButtonClick("Shopify")}
							sx={{
								...buttonGoogle(selectedCMS === "Shopify"),
								position: "relative",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								padding: 2,
								"@media (max-width: 600px)": {
									width: "100%",
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "start",
									gap: 1,
								},
							}}
						>
							<Box
								sx={{
									position: "absolute",
									top: 8,
									right: 8,
								}}
							>
								<CustomTooltip
									title={"Quickly integrate using Shopify for seamless setup."}
									linkText="Learn more"
									linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify"
								/>
							</Box>
							<Image
								src={"/install_cms1.svg"}
								alt="Install on Shopify"
								width={38}
								height={38}
								style={{ marginBottom: 12 }}
							/>
							<Typography className="second-sub-title" sx={typographyGoogle}>
								Shopify
							</Typography>
						</Button>
					</Grid>

					{sourcePlatform !== "shopify" && (
						<>
							<Grid
								item
								xs={12}
								md={6}
								sx={{
									width: "100%",
								}}
							>
								<Button
									variant="outlined"
									fullWidth
									onClick={() => handleButtonClick("WordPress")}
									sx={{
										...buttonStyles(selectedCMS === "WordPress"),
										position: "relative",
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										padding: 2,
										"@media (max-width: 600px)": {
											width: "100%",
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
											justifyContent: "start",
											gap: 1,
										},
									}}
								>
									<Box
										sx={{
											position: "absolute",
											top: 8,
											right: 8,
										}}
									>
										<CustomTooltip
											title={
												"Quickly integrate using Wordpress for seamless setup."
											}
											linkText="Learn more"
											linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress"
										/>
									</Box>
									<Image
										src={"/install_cms2.svg"}
										alt="Install on WordPress"
										width={38}
										height={38}
									/>
									<Typography
										className="second-sub-title"
										sx={{ ...typographyStyles, pt: 1.75 }}
									>
										WordPress
									</Typography>
								</Button>
							</Grid>

							<Grid
								item
								xs={12}
								md={6}
								sx={{
									width: "100%",
								}}
							>
								<Button
									variant="outlined"
									fullWidth
									onClick={() => handleButtonClick("Bigcommerce")}
									sx={{
										...buttonStyles(selectedCMS === "Bigcommerce"),
										position: "relative",
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										padding: 2,
										"@media (max-width: 600px)": {
											width: "100%",
											display: "flex",
											flexDirection: "row",
											alignItems: "center",
											justifyContent: "start",
											gap: 1,
										},
									}}
								>
									<Box
										sx={{
											position: "absolute",
											top: 8,
											right: 8,
										}}
									>
										<CustomTooltip
											title={
												"Quickly integrate using Bigcommerce for seamless setup."
											}
											linkText="Learn more"
											linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-bigcommerce"
										/>
									</Box>
									<Image
										src={"/bigcommerce-icon.svg"}
										alt="Install on Bigcommerce"
										width={38}
										height={38}
									/>
									<Typography
										className="second-sub-title"
										sx={{ ...typographyStyles, pt: 1.75 }}
									>
										Bigcommerce
									</Typography>
								</Button>
							</Grid>
						</>
					)}
				</Box>
				{selectedCMS && (
					<>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "start",
								height: "100%",
							}}
						>
							{selectedCMS === "Shopify" ? (
								<>
									<Box
										ref={shopifyRef}
										sx={{
											flex: 1,
											paddingBottom: "1em",
											minHeight: "auto",
										}}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "start",
											}}
										>
											<Image src="/2.svg" alt="2" width={20} height={20} />
											{sourcePlatform !== "shopify" && (
												<Typography
													className="first-sub-title"
													sx={{
														...maintext,
														textAlign: "left",
														padding: "1em 0em 0.5em 1em",
														fontWeight: "500",
													}}
												>
													Enter your Shopify API access token. This token is
													necessary for secure communication between your
													Shopify store and our application.
												</Typography>
											)}
										</Box>
										<Box
											sx={{
												display: "flex",
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "start",
												pl: 3.5,
												mb: 1,
											}}
										>
											<Link
												href={
													"https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify"
												}
												target="_blank"
												underline="hover"
												sx={{
													display: "inline-flex",
													alignItems: "center",
													color: "#3898FC",
													fontSize: 14,
													fontFamily: "var(--font-nunito)",
													ml: 1,
												}}
											>
												How to create token&nbsp;
												<OpenInNewIcon sx={{ fontSize: 16 }} />
											</Link>
										</Box>

										<Box
											component="pre"
											sx={{
												display: "flex",
												width: "100%",
												justifyContent: "center",
												position: "relative",
												margin: 0,
												pl: 4.25,
											}}
										>
											<TextField
												InputProps={{ sx: styles.formInput }}
												fullWidth
												label="Access Token"
												variant="outlined"
												placeholder="Enter your Access Token"
												margin="normal"
												sx={styles.formField}
												value={access_token}
												onChange={(e) => setAccessToken(e.target.value)}
												InputLabelProps={{ sx: styles.inputLabel }}
												disabled={
													sourcePlatform === "shopify" && accessTokenExists
												}
											/>
											{cmsHints["enterShopifyAccessToken"]?.show && (
												<HintCard
													card={cmsHintCards["enterShopifyAccessToken"]}
													positionLeft={680}
													positionTop={0}
													isOpenBody={
														cmsHints["enterShopifyAccessToken"].showBody
													}
													toggleClick={() =>
														changeCMSHint(
															"enterShopifyAccessToken",
															"showBody",
															"toggle",
														)
													}
													closeClick={() =>
														changeCMSHint(
															"enterShopifyAccessToken",
															"showBody",
															"close",
														)
													}
												/>
											)}
										</Box>
										{sourcePlatform !== "shopify" && (
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center",
													justifyContent: "start",
												}}
											>
												<Image src="/3.svg" alt="3" width={20} height={20} />
												<Typography
													className="first-sub-title"
													sx={{
														...maintext,
														textAlign: "left",
														padding: "2em 1em 1em",
														fontWeight: "500",
														"@media (max-width: 600px)": { padding: "1em" },
													}}
												>
													Once you have submitted the required information, our
													system will automatically install the script on your
													Shopify store.
												</Typography>
											</Box>
										)}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												justifyContent: "flex-end",
												overflow: "visible",
											}}
										>
											{sourcePlatform === "shopify" && accessTokenExists ? (
												<Typography
													sx={{
														color: "#333",
														fontWeight: "500",
														fontSize: 16,
														textAlign: "center",
														padding: "0.5em",
														backgroundColor: "transparent",
														borderRadius: 2,
														marginTop: "auto",
													}}
												>
													Pixel Installed
												</Typography>
											) : (
												<Box
													position="relative"
													sx={{ display: "flex", justifyContent: "flex-end" }}
												>
													<CustomButton
														disabled={
															!isFormValid() || loading || shopifyInstalled
														}
														variant="contained"
														onClick={handleSubmit}
														sx={{ padding: "10px 47px" }}
													>
														{loading ? (
															<CircularProgress size={24} color="inherit" />
														) : (
															"Install"
														)}
													</CustomButton>
													{cmsHints["installScript"]?.show && (
														<HintCard
															card={cmsHintCards["installScript"]}
															positionLeft={560}
															positionTop={15}
															isOpenBody={cmsHints["installScript"].showBody}
															toggleClick={() =>
																changeCMSHint(
																	"installScript",
																	"showBody",
																	"toggle",
																)
															}
															closeClick={() =>
																changeCMSHint(
																	"installScript",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
												</Box>
											)}
										</Box>
									</Box>
								</>
							) : selectedCMS === "WordPress" ? (
								<>
									<Box
										ref={wordpressRef}
										sx={{
											flex: 1,
											overflowY: "auto",
											overflow: "visible",
											paddingBottom: "2em",
										}}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: "row",
												alignItems: "center",
												padding: "1em 0em 0em 0em",
												justifyContent: "start",
											}}
										>
											<Image src="/2.svg" alt="2" width={20} height={20} />
											<Typography
												className="first-sub-title"
												sx={{
													...maintext,
													textAlign: "center",
													padding: "1em 0em 1em 1em",
													fontWeight: "500",
													"@media (max-width: 600px)": { textAlign: "left" },
												}}
											>
												Add our offical {whitelabel.brand_name} pixel plugin to
												your Wordpress site.
											</Typography>
										</Box>
										<Box position="relative">
											<CustomButton
												variant="contained"
												sx={{ ml: 5 }}
												onClick={() => {
													onInstallStatusChange("success"),
														window.open(
															"https://wordpress.org/plugins/allsource",
															"_blank",
														);
												}}
											>
												Get plugin
											</CustomButton>
											{cmsHints["installPlugin"]?.show && (
												<HintCard
													card={cmsHintCards["installPlugin"]}
													positionLeft={190}
													positionTop={20}
													isOpenBody={cmsHints["installPlugin"].showBody}
													toggleClick={() =>
														changeCMSHint("installPlugin", "showBody", "toggle")
													}
													closeClick={() =>
														changeCMSHint("installPlugin", "showBody", "close")
													}
												/>
											)}
										</Box>
										<Box
											sx={{
												display: "flex",
												flexDirection: "row",
												alignItems: "center",
												padding: "1em 0em 0em 0em",
												justifyContent: "start",
												maxWidth: "100%",
												"@media (max-width: 600px)": { maxWidth: "95%" },
											}}
										>
											<Box sx={{ paddingBottom: 11.5 }}>
												<Image src="/3.svg" alt="3" width={20} height={20} />
											</Box>
											<Typography
												className="first-sub-title"
												sx={{
													...maintext,
													textAlign: "left",
													padding: "1em",
													fontWeight: "500",
													maxWidth: "95%",
													overflowWrap: "break-word",
													wordWrap: "break-word",
													whiteSpace: "normal",
												}}
											>
												Enter your site ID:{" "}
												<Box
													sx={{
														display: "flex",
														flexDirection: "row",
														alignItems: "center",
														position: "relative",
														overflow: "visible",
														gap: 1,
													}}
												>
													<Box
														component="pre"
														sx={{
															backgroundColor: "#ffffff",
															border: "1px solid rgba(228, 228, 228, 1)",
															borderRadius: "4px",
															maxHeight: "10em",
															overflowY: "auto",
															position: "relative",
															padding: "0.75em",
															maxWidth: "100%",
															"@media (max-width: 600px)": {
																maxHeight: "14em",
															},
														}}
													>
														<code
															style={{
																color: "#000000",
																fontSize: "12px",
																fontWeight: 600,
																fontFamily: "var(--font-nunito)",
																textWrap: "nowrap",
															}}
														>
															{pixel_client_id}
														</code>
													</Box>
													<Box
														sx={{
															display: "flex",
															padding: "0px",
															position: "relative",
														}}
													>
														<IconButton onClick={handleCopyToClipboard}>
															<ContentCopyIcon
																sx={{ width: "24px", height: "24px" }}
															/>
														</IconButton>
													</Box>
													{cmsHints["enterSiteID"]?.show && (
														<HintCard
															card={cmsHintCards["enterSiteID"]}
															positionLeft={540}
															positionTop={35}
															isOpenBody={cmsHints["enterSiteID"].showBody}
															toggleClick={() =>
																changeCMSHint(
																	"enterSiteID",
																	"showBody",
																	"toggle",
																)
															}
															closeClick={() =>
																changeCMSHint(
																	"enterSiteID",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
												</Box>
												during the checkout process
											</Typography>
										</Box>
									</Box>
								</>
							) : (
								<>
									<Box
										ref={bigcommerceRef}
										sx={{
											flex: 1,
											overflowY: "auto",
											paddingBottom: "1em",
											overflow: "visible",
											height: "100%",
										}}
									>
										{(sourcePlatform !== "big_commerce" ||
											!accessTokenExists) && (
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center",
													padding: 0,
													justifyContent: "start",
												}}
											>
												<Image src="/2.svg" alt="2" width={20} height={20} />
												<Typography
													className="first-sub-title"
													sx={{
														...maintext,
														textAlign: "left",
														padding: "1em 0em 1em 1em",
														fontWeight: "500",
													}}
												>
													Enter your Bigcommerce store hash in the designated
													field. This allows our system to identify your store.
												</Typography>
											</Box>
										)}

										<Box
											component="pre"
											position="relative"
											sx={{
												display: "flex",
												width: "100%",
												justifyContent: "center",
												overflow: "visible",
												margin: 0,
												pl: 4.25,
											}}
										>
											<TextField
												fullWidth
												label="Store Hash"
												variant="outlined"
												placeholder="Enter your Store Hash"
												margin="normal"
												value={storeHash}
												sx={styles.formField}
												onFocus={handleFocus}
												onBlur={handleBlur}
												disabled={
													sourcePlatform === "big_commerce" && accessTokenExists
												}
												InputProps={{ sx: styles.formInput }}
												onChange={handleStoreHashChange}
												InputLabelProps={{ sx: styles.inputLabel }}
											/>
											{cmsHints["enterStoreHash"]?.show && (
												<HintCard
													card={cmsHintCards["enterStoreHash"]}
													positionLeft={675}
													positionTop={5}
													isOpenBody={cmsHints["enterStoreHash"].showBody}
													toggleClick={() =>
														changeCMSHint(
															"enterStoreHash",
															"showBody",
															"toggle",
														)
													}
													closeClick={() =>
														changeCMSHint("enterStoreHash", "showBody", "close")
													}
												/>
											)}
										</Box>
										{(sourcePlatform !== "big_commerce" ||
											!accessTokenExists) && (
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center",
													justifyContent: "start",
												}}
											>
												<Image src="/3.svg" alt="3" width={20} height={20} />
												<Typography
													className="first-sub-title"
													sx={{
														...maintext,
														textAlign: "left",
														padding: "2em 1em 1em",
														fontWeight: "500",
														"@media (max-width: 600px)": { padding: "1em" },
													}}
												>
													Once you have submitted the required information, our
													system will automatically install the script on your
													Bigcommerce store.
												</Typography>
											</Box>
										)}
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												justifyContent: "flex-end",
												maxHeight: "100%",
												pl: 4.25,
											}}
										>
											{sourcePlatform === "big_commerce" &&
											accessTokenExists ? (
												<Typography
													sx={{
														color: "#333",
														fontWeight: "500",
														fontSize: 16,
														textAlign: "center",
														padding: "0.5em",
														backgroundColor: "transparent",
														borderRadius: 2,
														marginTop: "auto",
													}}
												>
													Pixel Installed
												</Typography>
											) : (
												<Box
													position="relative"
													sx={{ display: "flex", justifyContent: "flex-end" }}
												>
													<Button
														fullWidth
														variant="contained"
														sx={{
															...styles.submitButton,
															marginTop: "auto",
															maxWidth: "88px",
															minHeight: "40px",
															pointerEvents: !!storeHash ? "auto" : "none",
															backgroundColor: "rgba(56, 152, 252, 1)",
															"&.Mui-disabled": {
																backgroundColor: "rgba(56, 152, 252, 0.3)",
																color: "#fff",
															},
														}}
														onClick={handleSubmitBigcommerce}
														disabled={!storeHash}
													>
														Install
													</Button>
													{cmsHints["scriptInstallation"]?.show && (
														<HintCard
															card={cmsHintCards["scriptInstallation"]}
															positionLeft={525}
															positionTop={15}
															isOpenBody={
																cmsHints["scriptInstallation"].showBody
															}
															toggleClick={() =>
																changeCMSHint(
																	"scriptInstallation",
																	"showBody",
																	"toggle",
																)
															}
															closeClick={() =>
																changeCMSHint(
																	"scriptInstallation",
																	"showBody",
																	"close",
																)
															}
														/>
													)}
												</Box>
											)}
										</Box>
									</Box>
								</>
							)}
						</Box>
					</>
				)}
			</Box>
		</Box>
	);
};

export default Popup;
