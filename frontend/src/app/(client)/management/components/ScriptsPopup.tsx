"use client";
import React, { useEffect, useState } from "react";
import {
	Box,
	Button,
	Typography,
	Modal,
	IconButton,
	Divider,
	Input,
	InputBase,
	Tab,
	Tabs,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { InfoIcon } from "@/icon";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Image from "next/image";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showToast } from "../../../../components/ToastNotification";

const style = {
	position: "fixed" as "fixed",
	top: 0,
	right: 0,
	width: "45%",
	height: "100%",
	bgcolor: "background.paper",
	boxShadow: 24,
	display: "flex",
	outline: "none",
	flexDirection: "column",
	transition: "transform 0.3s ease-in-out",
	transform: "translateX(100%)",
	"@media (max-width: 600px)": {
		width: "100%",
		height: "100%",
		p: 0,
	},
};

const openStyle = {
	transform: "translateX(0%)",
	right: 0,
};

const maintext = {
	textAlign: "left",
	color: "rgba(32,33, 36, 1) !important",
	padding: "0em 0em 0em 1em",
};

const subtext = {
	fontFamily: "Nunito Sans",
	fontSize: "14px",
	fontWeight: "400",
	lineHeight: "16.8px",
	textAlign: "left",
	color: "rgba(0, 0, 0, 1)",
	paddingTop: "0.25em",
};

interface PopupProps {
	open: boolean;
	handleClose: () => void;
	pixelCode: string;
	secondPixelCode?: string;
	title: string;
	secondStepText: {
		button: string;
		default: string;
	};
	thirdStepText: string;
}

const ScriptsPopup: React.FC<PopupProps> = ({
	open,
	handleClose,
	pixelCode,
	secondPixelCode,
	title,
	secondStepText,
	thirdStepText,
}) => {
	const [tabIndex, setTabIndex] = useState(0);
	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
	};

	const tabToKeyMap: { [key: number]: "button" | "default" } = {
		0: "button",
		1: "default",
	};

	const displayedCode = tabIndex === 0 ? pixelCode : (secondPixelCode ?? "");

	const [email, setEmail] = useState("");

	const handleButtonClick = () => {
		axiosInstance
			.post("/install-pixel/send-pixel-code", { email })
			.then((response) => {
				showToast("Successfully send email");
			})
			.catch((error) => {});
	};

	useEffect(() => {
		if (open) {
			setTabIndex(0);
		}
	}, [open]);

	return (
		<Modal
			open={open}
			onClose={handleClose}
			sx={{
				overflow: "hidden",
				outline: "none",
				"&:focus": { outline: "none" },
			}}
		>
			<Box sx={{ ...style, ...(open ? openStyle : {}) }}>
				<Box
					display="flex"
					justifyContent="space-between"
					sx={{
						width: "100%",
						alignItems: "center",
						padding: 3,
						pt: 2,
						pb: 1.35,
					}}
				>
					<Typography
						className="first-sub-title"
						sx={{
							textAlign: "left",
							"@media (max-width: 600px)": { pt: 2, pl: 2 },
						}}
					>
						{title}
					</Typography>
					<IconButton onClick={handleClose}>
						<CloseIcon />
					</IconButton>
				</Box>
				<Divider />
				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						padding: 2,
						paddingBottom: "10px",
						"@media (max-width: 600px)": { p: 2 },
					}}
				>
					{secondPixelCode && (
						<Box sx={{ mb: 2 }}>
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									padding: "1em 0em 0em 0em",
									justifyContent: "start",
								}}
							>
								<InfoIcon sx={{ color: "rgba(235,193,46,1)" }} />
								<Typography className="first-sub-title" sx={maintext}>
									You can install the pixel using one of the two methods below.
								</Typography>
							</Box>

							<Box
								sx={{
									display: "flex",
									width: "100%",
									flexDirection: "column",
									pt: 2,
									pl: 1.5,
									gap: 2,
								}}
							>
								<Typography
									className="paragraph"
									sx={{ paddingLeft: "2.75em", textAlign: "left" }}
								>
									Use the tab to switch between installation options: on click
									or on page load.
								</Typography>

								<Box sx={{ alignSelf: "center" }}>
									<Tabs
										value={tabIndex}
										onChange={handleTabChange}
										sx={{
											minHeight: 0,
											"& .MuiTabs-flexContainer": {
												gap: 2,
											},
											"& .MuiTabs-indicator": {
												backgroundColor: "rgba(56, 152, 252, 1)",
												height: "1.4px",
											},
											"@media (max-width: 600px)": {
												border: "1px solid rgba(228, 228, 228, 1)",
												borderRadius: "4px",
												width: "100%",
												"& .MuiTabs-indicator": {
													height: "0",
												},
											},
										}}
										aria-label="pixel installation method"
									>
										<Tab
											className="main-text"
											label="On Click"
											sx={{
												textTransform: "none",
												fontSize: "13px",
												fontWeight: 600,
												minHeight: "28px",
												minWidth: "120px",
												padding: "4px 10px",
												borderRadius: "4px",
												color: "rgba(95, 99, 104, 1)",
												"&.Mui-selected": {
													color: "rgba(56, 152, 252, 1)",
												},
											}}
										/>
										<Tab
											className="main-text"
											label="On Page Load"
											sx={{
												textTransform: "none",
												fontSize: "13px",
												fontWeight: 600,
												minHeight: "28px",
												minWidth: "120px",
												padding: "4px 10px",
												borderRadius: "4px",
												color: "rgba(95, 99, 104, 1)",
												"&.Mui-selected": {
													color: "rgba(56, 152, 252, 1)",
												},
											}}
										/>
									</Tabs>
								</Box>
							</Box>
						</Box>
					)}

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
						}}
					>
						<IconButton
							onClick={() => {
								navigator.clipboard.writeText(displayedCode ?? "");
								alert("Copied to clipboard");
							}}
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
								fontFamily: "Nunito Sans",
							}}
						>
							{displayedCode?.trim()}
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

					<Box
						sx={{
							position: "relative",
							width: "100%",
							paddingLeft: "2.75em",
							pt: 1,
							"@media (max-width: 600px)": { pt: 2 },
						}}
					>
						<Typography
							className="paragraph"
							sx={{ ...subtext, fontSize: "13px !important" }}
						>
							{secondStepText[tabToKeyMap[tabIndex]]}
						</Typography>
						<Box
							sx={{
								padding: "1.1em",
								mt: 3,
								border: "1px solid #e4e4e4",
								borderRadius: "8px",
								backgroundColor: "rgba(247, 247, 247, 1)",
								boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
								"@media (max-width: 600px)": { m: 2 },
							}}
						>
							<Typography
								variant="h6"
								component="div"
								mb={2}
								className="first-sub-title"
								sx={{
									textAlign: "left",
								}}
							>
								Send this to my developer
							</Typography>
							<Typography sx={{ ...subtext, pt: 2, pb: 1 }}>
								Enter your email to receive the script by email:
							</Typography>
							<Box
								display="flex"
								alignItems="center"
								justifyContent="space-between"
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
								<InputBase
									id="email_send"
									type="text"
									placeholder="Enter Email ID"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="paragraph"
									sx={{
										padding: "0.5rem 2em 0.5em 1em",
										width: "65%",
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
										"@media (max-width: 600px)": {
											width: "100%",
										},
									}}
								/>

								<Button
									onClick={handleButtonClick}
									sx={{
										ml: 2,
										border: "1px solid rgba(56, 152, 252, 1)",
										textTransform: "none",
										background: "#fff",
										color: "rgba(56, 152, 252, 1)",
										fontFamily: "Nunito Sans",
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
							</Box>
						</Box>
					</Box>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							padding: "1.25em 0 0 0",
							justifyContent: "start",
						}}
					>
						<Image src="/3.svg" alt="3" width={28} height={28} />
						<Typography className="first-sub-title" sx={maintext}>
							Verify Your Pixel
						</Typography>
					</Box>

					<Typography
						className="paragraph"
						sx={{
							...subtext,
							paddingLeft: "3.75em",
							fontSize: "13px !important",
						}}
					>
						{thirdStepText}
					</Typography>
				</Box>
			</Box>
		</Modal>
	);
};

export default ScriptsPopup;
