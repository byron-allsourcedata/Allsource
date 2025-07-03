"use client";
import { Box, Typography, IconButton, Link } from "@mui/material";
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
import Image from "next/image";
import InfoIcon from "@mui/icons-material/Info";
import { OpenInNewIcon } from "@/icon";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PixelManagementItem } from "../page";
import FeatureCardWithButton from "@/components/first-time-screens/FeatureCardWithButton";

const Management: React.FC = () => {
	const [pixelData, setPixelData] = useState<PixelManagementItem[]>([]);
	const router = useRouter();
	const [status, setStatus] = useState("");
	const [popupOpen, setPopupOpen] = useState(false);
	const [inputValue, setInputValue] = useState<string>("");
	const apiUrl = process.env.NEXT_PUBLIC_API_DOMAIN;

	useEffect(() => {
		const storedValue = sessionStorage.getItem("current_domain");
		if (storedValue !== null) {
			setInputValue(storedValue);
		}
	}, []);

	const onBack = () => {
		router.push("/management");
	};

	const handleButtonClick = () => {
		let url = inputValue.trim();

		if (url) {
			if (!/^https?:\/\//i.test(url)) {
				url = "http://" + url;
			}

			const hasQuery = url.includes("?");
			const newUrl =
				url +
				(hasQuery ? "&" : "?") +
				"mff=true" +
				`&api=${apiUrl}` +
				`&domain_url=${process.env.NEXT_PUBLIC_BASE_URL}/leads`;
			window.open(newUrl, "_blank");
		}
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
							<>
								<FeatureCardWithButton
									title={"Check Pixel Health "}
									subtitle={
										'When you click "Verify Installation," a new tab will open your website. Status will display top-right after 5-60 seconds - keep tab open.'
									}
									imageSrc={"/check-pixel-health.svg"}
									img_height={203}
									img_width={373}
									onClick={() => {
										handleButtonClick();
									}}
									buttonLabel={"Test"}
									showRecommended={false}
									mainContent={
										<>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													textAlign: "center",
													justifyContent: "center",
													gap: 1,
													mt: 3,
													mb: 3,
													pl: 3,
													position: "relative",
													flexDirection: "column",
													width: "100%",
												}}
											>
												<Box
													sx={{
														display: "flex",
														flexDirection: "row",
														width: "100%",
														alignItems: "center",
														gap: 1,
													}}
												>
													<Image
														src="/confirm-icon.svg"
														width={16}
														height={16}
														alt="confirm-icon"
													/>
													<Typography className="second-sub-title">
														If the pixel is installed correctly, a confirmation
														popup will appear in the top right corner.
													</Typography>
												</Box>

												<Box
													sx={{
														display: "flex",
														flexDirection: "row",
														width: "100%",
														alignItems: "center",
														gap: 1,
													}}
												>
													<Image
														src="/close.svg"
														width={16}
														height={16}
														alt="fail-icon"
													/>
													<Typography className="second-sub-title">
														If the pixel is not installed, nothing will happen.
													</Typography>
												</Box>
											</Box>
											<Box
												sx={{
													backgroundColor: "rgba(254, 247, 223, 1)",
													border: "1px solid rgba(250, 202, 106, 0.5)",
													borderRadius: "6px",
													padding: "16px",
													display: "flex",
													gap: 2,
													position: "relative",
												}}
											>
												<Box sx={{ mt: "2px" }}>
													<InfoIcon
														sx={{
															color: "rgba(235, 193, 46, 1)",
															fontSize: "20px",
														}}
													/>
												</Box>

												<Box sx={{ flex: 1 }}>
													<Box
														sx={{
															display: "flex",
															justifyContent: "space-between",
															width: "100%",
														}}
													>
														<Typography className="first-subtitle">
															Concise reasons for pixel installation failure:
														</Typography>

														<Box>
															<Link
																href="https://allsourceio.zohodesk.com/portal/en/kb/articles/verify-pixel"
																underline="hover"
																target="_blank"
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 0.5,
																	fontWeight: 300,
																	fontSize: "14px",
																	fontFamily: "var(--font-nunito)",
																	color: "rgba(56, 152, 252, 1)",
																}}
															>
																Learn more
																<OpenInNewIcon sx={{ fontSize: 14 }} />
															</Link>
														</Box>
													</Box>

													<Box
														component="ul"
														sx={{
															pl: 2,
															mb: 0,
															display: "flex",
															flexDirection: "column",
															gap: 1,
														}}
													>
														<Typography
															component="li"
															className="paragraph-description"
														>
															<b>Incorrect code placement</b> – Pixel not
															installed in website header/footer.
														</Typography>
														<Typography
															component="li"
															className="paragraph-description"
														>
															<b>Ad blockers or privacy extensions</b> – Browser
															plugins blocking tracking scripts.
														</Typography>
														<Typography
															component="li"
															className="paragraph-description"
														>
															<b>Multiple conflicting pixels</b> – Other
															tracking codes interfering with installation.
														</Typography>
													</Box>
												</Box>
											</Box>{" "}
										</>
									}
								/>
							</>
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
