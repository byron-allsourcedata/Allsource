"use client";

import { Box, Typography, Button, BoxClassKey, Link } from "@mui/material";
import React, { useState, useEffect } from "react";
import HintCard from "@/app/(client)/components/HintCard";
import { verifyPixelIntegrationHintCards } from "@/app/(client)/analytics/components/context/hintsCardsContent";
import { useGetStartedHints } from "@/app/(client)/analytics/components/context/PixelInstallHintsContext";
import Image from "next/image";
import InfoIcon from "@mui/icons-material/Info";
import { OpenInNewIcon } from "@/icon";
import CustomButton from "@/components/ui/CustomButton";

type VerifyPixelIntegrationProps = {
	domain: string;
	showHint: boolean;
	step?: number;
};
interface HintCardInterface {
	description: string;
	title: string;
	linkToLoadMore: string;
}

const VerifyPixelIntegration: React.FC<VerifyPixelIntegrationProps> = ({
	domain,
	showHint,
	step,
}) => {
	const {
		verifyPixelIntegrationHints,
		resetVerifyPixelIntegrationHints,
		changeVerifyPixelIntegrationHint,
	} = useGetStartedHints();
	const [inputValue, setInputValue] = useState<string>("");

	const apiUrl = process.env.NEXT_PUBLIC_API_DOMAIN;

	useEffect(() => {
		if (domain) {
			setInputValue(domain);
		} else {
			const storedValue = sessionStorage.getItem("current_domain");
			if (storedValue !== null) {
				setInputValue(storedValue);
			}
		}
	}, [domain]);

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
		<Box
			sx={{
				padding: "1rem",
				mb: 5,
				border: "1px solid #e4e4e4",
				borderRadius: "4px",
				position: "relative",
				backgroundColor: "rgba(255, 255, 255, 1)",
				boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
				"@media (max-width: 900px)": {
					marginBottom: "1.5rem",
					padding: "1rem",
				},
			}}
		>
			<Typography
				variant="h6"
				component="div"
				mb={2}
				className="first-sub-title"
				sx={{
					fontFamily: "var(--font-nunito)",
					fontWeight: "700",
					lineHeight: "normal",
					textAlign: "left",
					color: "#1c1c1c",
					fontSize: "16px",
					marginBottom: "1.5rem",
					"@media (max-width: 900px)": {
						fontSize: "16px",
						lineHeight: "normal",
						marginBottom: "24px",
					},
				}}
			>
				{step ? step : 3}. Verify pixel integration on your website
			</Typography>
			<Typography className="paragraph">
				When you click &quot;Verify Installation,&quot; a new tab will open your
				website. Status will display top-right after 5-60 seconds - keep tab
				open.
			</Typography>
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
						If the pixel is installed correctly, a confirmation popup will
						appear in the top right corner.
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
					<Image src="/close.svg" width={16} height={16} alt="fail-icon" />
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
					<InfoIcon sx={{ color: "rgba(235, 193, 46, 1)", fontSize: "20px" }} />
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
								Learn more <OpenInNewIcon sx={{ fontSize: 14 }} />
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
						<Typography component="li" className="paragraph-description">
							<b>Incorrect code placement</b> – Pixel not installed in website
							header/footer.
						</Typography>
						<Typography component="li" className="paragraph-description">
							<b>Ad blockers or privacy extensions</b> – Browser plugins
							blocking tracking scripts.
						</Typography>
						<Typography component="li" className="paragraph-description">
							<b>Multiple conflicting pixels</b> – Other tracking codes
							interfering with installation.
						</Typography>
					</Box>
				</Box>
			</Box>

			<Box
				display="flex"
				alignItems="center"
				justifyContent="end"
				position="relative"
				sx={{
					pt: 2,
					"@media (max-width: 600px)": {
						alignItems: "flex-start",
						gap: "16px",
						flexDirection: "column",
					},
				}}
			>
				<CustomButton onClick={handleButtonClick} variant="contained">
					Verify Installation
				</CustomButton>
				{verifyPixelIntegrationHints["verifyPixelIntegration"]?.show &&
					showHint && (
						<HintCard
							card={verifyPixelIntegrationHintCards["verifyPixelIntegration"]}
							positionLeft={710}
							positionTop={-25}
							isOpenBody={
								verifyPixelIntegrationHints["verifyPixelIntegration"].showBody
							}
							toggleClick={() =>
								changeVerifyPixelIntegrationHint(
									"verifyPixelIntegration",
									"showBody",
									"toggle",
								)
							}
							closeClick={() =>
								changeVerifyPixelIntegrationHint(
									"verifyPixelIntegration",
									"showBody",
									"close",
								)
							}
						/>
					)}
			</Box>
		</Box>
	);
};

export default VerifyPixelIntegration;
