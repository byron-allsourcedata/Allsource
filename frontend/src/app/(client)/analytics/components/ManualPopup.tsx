"use client";
import React, { useRef, useState } from "react";
import {
	Box,
	Button,
	Typography,
	IconButton,
	FormControl,
	FormHelperText,
	InputBase,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Image from "next/image";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
	showErrorToast,
	showToast,
} from "../../../../components/ToastNotification";
import { useHints } from "@/context/HintsContext";
import HintCard from "@/app/(client)/components/HintCard";
import { useGetStartedHints } from "./context/PixelInstallHintsContext";
import { ManualInstallHintCards } from "./context/hintsCardsContent";
import { AxiosError } from "axios";

interface HintCardInterface {
	description: string;
	title: string;
	linkToLoadMore: string;
}

const maintext = {
	textAlign: "left",
	color: "rgba(32,33, 36, 1) !important",
	padding: "0em 0em 0em 1em",
};

const subtext = {
	fontFamily: "var(--font-nunito)",
	fontSize: "14px",
	fontWeight: "400",
	lineHeight: "16.8px",
	textAlign: "left",
	color: "rgba(0, 0, 0, 1)",
	paddingTop: "0.25em",
	paddingLeft: "3.7em",
};

interface PopupProps {
	open: boolean;
	handleClose: () => void;
	pixelCode: string;
	onInstallStatusChange: (status: "success" | "failed") => void;
}

const Popup: React.FC<PopupProps> = ({
	open,
	handleClose,
	pixelCode,
	onInstallStatusChange,
}) => {
	const { manualInstallHints, resetManualInstall, changeManualInstallHint } =
		useGetStartedHints();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const verifyRef = useRef<HTMLDivElement | null>(null);

	const handleCopy = () => {
		navigator.clipboard.writeText(pixelCode);
		showToast("Copied to clipboard");
		onInstallStatusChange("success");
		scrollToBottom();
	};

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setEmail(value);
		if (!emailRegex.test(value)) {
			setError("Invalid email address");
		} else {
			setError("");
		}
	};

	const handleButtonClick = () => {
		axiosInstance
			.post("/install-pixel/send-pixel-code", { email })
			.then((response) => {
				showToast("Successfully send email");
			})
			.catch((error) => {
				if (error instanceof AxiosError) {
					if (error?.status === 429) {
						showErrorToast(
							"Email was already sent. Please wait a few minutes and try again.",
						);
					}
				}
			});
		onInstallStatusChange("success");
		scrollToBottom();
	};

	const scrollToBottom = () => {
		setTimeout(() => {
			verifyRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 1000);
	};

	return (
		<>
			<Box
				sx={{
					bgcolor: "background.paper",
					p: 4,
					mt: 2,
					borderRadius: 2,
					border: "1px solid rgba(231, 231, 233, 1)",
					width: "100%",
					boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.08)",
				}}
			>
				<Typography
					className="first-sub-title"
					sx={{
						textAlign: "left",
						"@media (max-width: 600px)": { pt: 2, pl: 2 },
					}}
				>
					Install Manually
				</Typography>
				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						paddingBottom: "10px",
						"@media (max-width: 600px)": { p: 2 },
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
						<Image src="/1.svg" alt="1" width={28} height={28} />
						<Typography className="first-sub-title" sx={maintext}>
							Copy the pixel code
						</Typography>
					</Box>
					<Box
						component="pre"
						sx={{
							backgroundColor: "#ffffff",
							gap: 2,
							position: "relative",
							wordWrap: "break-word",
							whiteSpace: "pre-wrap",
							border: "1px solid rgba(228, 228, 228, 1)",
							borderRadius: "10px",
							marginLeft: "3em",
							maxHeight: "14em",
							overflowY: "auto",
							overflowX: "hidden",
							"@media (max-width: 600px)": {
								maxHeight: "14em",
							},
						}}
					>
						<IconButton
							onClick={handleCopy}
							sx={{ position: "absolute", right: "10px", top: "10px" }}
						>
							<ContentCopyIcon />
						</IconButton>
						<code
							style={{
								color: "rgba(95, 99, 104, 1)",
								fontSize: "12px",
								margin: 0,
								fontWeight: 400,
								fontFamily: "var(--font-nunito)",
								textWrap: "nowrap",
							}}
						>
							{pixelCode?.trim()}
						</code>
					</Box>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							padding: "0.5em 0em 0em 0em",
							justifyContent: "start",
						}}
					>
						<Image src="/2.svg" alt="2" width={28} height={28} />
						<Typography className="first-sub-title" sx={maintext}>
							Paste the pixel in your website
						</Typography>
					</Box>
					<Typography className="paragraph" sx={subtext}>
						Paste the above pixel in the header of your website. The header
						script starts with &lt;head&gt; and ends with &lt;/head&gt;.
					</Typography>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							padding: "1.25em 0em 0em 0em",
							justifyContent: "start",
						}}
					>
						<Image src="/3.svg" alt="3" width={28} height={28} />
						<Typography className="first-sub-title" sx={maintext}>
							Verify Your Pixel
						</Typography>
					</Box>
					<Typography className="paragraph" sx={subtext}>
						Once the pixel is pasted in your website, wait for 10-15 mins and
						verify your pixel.
					</Typography>
				</Box>
			</Box>
			<Box
				sx={{
					position: "relative",
					width: "100%",
					pt: 2,
					"@media (max-width: 600px)": { pt: 2 },
				}}
			>
				<Box
					sx={{
						padding: "1.1em",
						border: "1px solid #e4e4e4",
						borderRadius: "8px",
						backgroundColor: "rgba(255, 255, 255, 1)",
						boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
						"@media (max-width: 600px)": { m: 2 },
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
						<Typography
							className="first-sub-title"
							sx={{
								textAlign: "left",
							}}
						>
							*Send this to my developer
						</Typography>
						<Typography
							className="paragraph"
							sx={{
								backgroundColor: "rgba(254, 243, 205, 1)",
								color: "rgba(179, 151, 9, 1) !important",
								padding: ".1563rem 1rem",
							}}
						>
							Optional
						</Typography>
					</Box>
					<Typography
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							fontWeight: "400",
							lineHeight: "16.8px",
							textAlign: "left",
							color: "rgba(0, 0, 0, 1)",
							paddingTop: "0.25em",
							pt: 2,
							pb: 1,
						}}
					>
						Send install instructions to this email:
					</Typography>
					<Box
						ref={verifyRef}
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						position="relative"
						flexDirection="row"
						sx={{
							"@media (max-width: 600px)": {
								flexDirection: "column",
								display: "flex",
								alignContent: "flex-start",
								alignItems: "flex-start",
								gap: 1,
							},
						}}
					>
						<FormControl
							error={!!error}
							sx={{ width: "100%", maxWidth: "500px", marginTop: "1rem" }}
						>
							<InputBase
								id="email_send"
								type="text"
								placeholder="Enter Email ID"
								value={email}
								onChange={handleChange}
								className="paragraph"
								sx={{
									padding: "0.5rem 2em 0.5em 1em",
									width: "100%",
									border: "1px solid #e4e4e4",
									borderRadius: "4px",
									maxHeight: "2.5em",
									fontSize: "14px !important",
									textAlign: "left",
									backgroundColor: "rgba(255, 255, 255, 1)",
									boxShadow: "none",
									outline: "none",
									"&:focus": {
										borderColor: "#3f51b5",
									},
								}}
							/>
							{error && <FormHelperText>{error}</FormHelperText>}
						</FormControl>

						<Button
							onClick={handleButtonClick}
							disabled={!!error}
							sx={{
								ml: 2,
								border: "1px solid rgba(56, 152, 252, 1)",
								textTransform: "none",
								background: !!error ? "#e0e0e0" : "#fff",
								color: !!error ? "#9e9e9e" : "rgba(56, 152, 252, 1)",
								borderColor: !!error ? "#c7c7c7" : "rgba(56, 152, 252, 1)",
								fontFamily: "var(--font-nunito)",
								padding: "0.65em 2em",
								mr: 1,
								"@media (max-width: 600px)": {
									padding: "0.5em 1.5em",
									mr: 0,
									ml: 0,
									left: 0,
								},
							}}
						>
							<Typography
								className="second-sub-title"
								sx={{
									color: "rgba(56, 152, 252, 1) !important",
									textAlign: "left",
								}}
							>
								Send
							</Typography>
						</Button>
						{manualInstallHints["SendButton"]?.show && (
							<HintCard
								card={ManualInstallHintCards["SendButton"]}
								positionLeft={670}
								positionTop={-30}
								isOpenBody={manualInstallHints["SendButton"].showBody}
								toggleClick={() =>
									changeManualInstallHint("SendButton", "showBody", "toggle")
								}
								closeClick={() =>
									changeManualInstallHint("SendButton", "showBody", "close")
								}
							/>
						)}
					</Box>
				</Box>
			</Box>
		</>
	);
};

export default Popup;
