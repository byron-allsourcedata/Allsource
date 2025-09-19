import { Box, Drawer, IconButton, Link, Tab, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import TabPanel from "@mui/lab/TabPanel";
import TabList from "@mui/lab/TabList";
import TabContext from "@mui/lab/TabContext";
import { useState } from "react";
import { CustomButton } from "@/components/ui";

const GoHighLevelStyles = {
	tabHeading: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		color: "#707071",
		fontWeight: "500",
		lineHeight: "20px",
		textTransform: "none",
		padding: 0,
		minWidth: "auto",
		px: 2,
		pointerEvents: "none",
		"@media (max-width: 600px)": {
			alignItems: "flex-start",
			p: 0,
		},
		"&.Mui-selected": {
			color: "rgba(56, 152, 252, 1)",
			fontWeight: "700",
		},
	},
	inputLabel: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		lineHeight: "16px",
		left: "2px",
		color: "rgba(17, 17, 19, 0.60)",
		"&.Mui-focused": {
			color: "rgba(56, 152, 252, 1)",
		},
	},
	formInput: {
		"&.MuiOutlinedInput-root": {
			height: "48px",
			"& .MuiOutlinedInput-input": {
				padding: "12px 16px 13px 16px",
				fontFamily: "var(--font-roboto)",
				color: "#202124",
				fontSize: "14px",
				lineHeight: "20px",
				fontWeight: "400",
			},
			"& .MuiOutlinedInput-notchedOutline": {
				borderColor: "#A3B0C2",
			},
			"&:hover .MuiOutlinedInput-notchedOutline": {
				borderColor: "#A3B0C2",
			},
			"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(56, 152, 252, 1)",
			},
			"&.Mui-error .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(224, 49, 48, 1)",
			},
		},
		"&+.MuiFormHelperText-root": {
			marginLeft: "0",
		},
	},
};

interface GoHighLevelConnectProps {
	handlePopupClose: () => void;
	onCloseCreateSync?: () => void;
	open: boolean;
	boxShadow?: string;
}

const GoHighLevelConnectPopup = ({
	open,
	handlePopupClose,
	boxShadow,
}: GoHighLevelConnectProps) => {
	const [value, setValue] = useState("1");

	const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	const handleLogin = async () => {
		const clientId = process.env.NEXT_PUBLIC_GO_HIGH_LEVEL_CLIENT_ID;
		const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/high-landing`;
		const scopes = [
			"contacts.readonly",
			"contacts.write",
			"locations/customFields.readonly",
			"locations/customFields.write",
		].join("%20");
		const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;
		window.open(authUrl, "_blank", "noopener,noreferrer");
	};

	if (!open) {
		return;
	}

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={handlePopupClose}
			PaperProps={{
				sx: {
					width: "40%",
					position: "fixed",
					top: 0,
					boxShadow: boxShadow
						? "0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)"
						: "none",
					bottom: 0,
					msOverflowStyle: "none",
					scrollbarWidth: "none",
					"&::-webkit-scrollbar": {
						display: "none",
					},
					"@media (max-width: 900px)": {
						width: "100%",
					},
				},
			}}
			slotProps={{
				backdrop: {
					sx: {
						backgroundColor: boxShadow ? boxShadow : "rgba(0, 0, 0, 0.01)",
					},
				},
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					py: 2.85,
					px: 2,
					borderBottom: "1px solid #e4e4e4",
					position: "sticky",
					top: 0,
					zIndex: "9",
					backgroundColor: "#fff",
				}}
			>
				<Typography
					variant="h6"
					sx={{
						textAlign: "center",
						color: "#202124",
						fontFamily: "var(--font-nunito)",
						fontWeight: "600",
						fontSize: "16px",
						lineHeight: "normal",
					}}
				>
					Connect to Go High Level
				</Typography>
				<Box
					sx={{
						display: "flex",
						gap: "32px",
						"@media (max-width: 600px)": { gap: "8px" },
					}}
				>
					<Link
						href="https://allsourceio.zohodesk.com/portal/en/kb/articles/connect-to-gohighlevel"
						target="_blank"
						rel="noopener noreferrer"
						sx={{
							fontFamily: "var(--font-nunito)",
							fontSize: "14px",
							fontWeight: "600",
							lineHeight: "20px",
							color: "rgba(56, 152, 252, 1)",
							textDecorationColor: "rgba(56, 152, 252, 1)",
						}}
					>
						Tutorial
					</Link>
					<IconButton onClick={handlePopupClose} sx={{ p: 0 }}>
						<CloseIcon sx={{ width: "20px", height: "20px" }} />
					</IconButton>
				</Box>
			</Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					alignItems: "center",
					height: "100%",
				}}
			>
				<Box
					sx={{
						width: "100%",
						padding: "16px 24px 24px 24px",
						position: "relative",
					}}
				>
					<TabContext value={value}>
						<Box sx={{ pb: 4 }}>
							<TabList
								centered
								aria-label="Connect to GoHighlevel Tabs"
								TabIndicatorProps={{
									sx: { backgroundColor: "rgba(56, 152, 252, 1)" },
								}}
								sx={{
									"& .MuiTabs-scroller": {
										overflowX: "auto !important",
									},
									"& .MuiTabs-flexContainer": {
										justifyContent: "center",
										"@media (max-width: 600px)": {
											gap: "16px",
											justifyContent: "flex-start",
										},
									},
								}}
								onChange={handleChangeTab}
							>
								<Tab
									label="Connection"
									value="1"
									className="tab-heading"
									sx={GoHighLevelStyles.tabHeading}
									onClick={() => setValue("1")}
								/>
							</TabList>
						</Box>
						<TabPanel value="1" sx={{ p: 0 }}>
							<Box
								sx={{
									p: 2,
									border: "1px solid #f0f0f0",
									borderRadius: "4px",
									boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
								}}
							>
								<Box
									sx={{ display: "flex", alignItems: "center", gap: "8px" }}
									mt={2}
									mb={2}
								>
									<Image
										src="/go-high-level-icon.svg"
										alt="gohighlevel"
										height={24}
										width={24}
									/>
									<Typography
										variant="h6"
										sx={{
											fontFamily: "var(--font-nunito)",
											fontSize: "16px",
											fontWeight: "600",
											color: "#202124",
											lineHeight: "normal",
										}}
									>
										Login to your Go High Level account
									</Typography>
								</Box>
								<Box>
									<CustomButton
										onClick={handleLogin}
										variant="contained"
										fullWidth
										startIcon={
											<Image
												src="/go-high-level-icon.svg"
												alt="gohighlevel"
												height={24}
												width={24}
											/>
										}
									>
										Connect to Go High Level
									</CustomButton>
								</Box>
							</Box>
						</TabPanel>
					</TabContext>
				</Box>
			</Box>
		</Drawer>
	);
};

export default GoHighLevelConnectPopup;
