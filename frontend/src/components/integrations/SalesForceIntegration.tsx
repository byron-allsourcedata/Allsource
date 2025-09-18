import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import {
	Box,
	Typography,
	Drawer,
	IconButton,
	Button,
	Link,
	Tab,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { useAxiosHook } from "@/hooks/AxiosHooks";
import { useIntegrationContext } from "@/context/IntegrationContext";
import TabList from "@mui/lab/TabList";
import { CustomButton } from "@/components/ui";

interface CreateSalesForceProps {
	handleClose: () => void;
	onSave?: (integration: IntegrationsCredentials) => void;
	open: boolean;
	initApiKey?: string;
	boxShadow?: string;
	isEdit?: boolean;
	invalid_api_key?: boolean;
}

interface IntegrationsCredentials {
	id?: number;
	access_token: string;
	ad_account_id?: string;
	shop_domain?: string;
	data_center?: string;
	service_name: string;
	is_with_suppression?: boolean;
}

const metaStyles = {
	tabHeading: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		color: "#707071",
		fontWeight: "500",
		lineHeight: "20px",
		textTransform: "none",
		cursor: "pointer",
		padding: 0,
		minWidth: "auto",
		px: 2,
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
		fontSize: "12px",
		lineHeight: "16px",
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
		},
		"&+.MuiFormHelperText-root": {
			marginLeft: "0",
		},
	},
};

const SalesForceIntegrationPopup = ({
	handleClose,
	open,
	onSave,
	initApiKey,
	boxShadow,
	invalid_api_key,
}: CreateSalesForceProps) => {
	const [apiKey, setApiKey] = useState("");

	const [value, setValue] = useState("1");

	const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	useEffect(() => {
		setApiKey(initApiKey || "");
	}, [initApiKey]);

	const handleLogin = async () => {
		const client_id = process.env.NEXT_PUBLIC_SALES_FORCE_TOKEN;
		const redirect_uri = `${process.env.NEXT_PUBLIC_BASE_URL}/sales-force-landing`;
		const auth_url = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
		window.open(auth_url, "_blank");
	};

	return (
		<>
			<Drawer
				anchor="right"
				open={open}
				onClose={handleClose}
				PaperProps={{
					sx: {
						width: "40%",
						position: "fixed",
						top: 0,
						bottom: 0,
						boxShadow: boxShadow
							? "0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)"
							: "none",
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
						Connect to Sales Force
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: "32px",
							"@media (max-width: 600px)": { gap: "8px" },
						}}
					>
						<Link
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/pixel-sync-to-salesforce"
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
						<IconButton onClick={handleClose} sx={{ p: 0 }}>
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
									aria-label="Connect to Slack Tabs"
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
										sx={metaStyles.tabHeading}
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
											src="/salesforce-icon.svg"
											alt="salesforce"
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
											Login to your Sales Force
										</Typography>
									</Box>
									<Box>
										<CustomButton
											onClick={handleLogin}
											variant="contained"
											fullWidth
											startIcon={
												<Image
													src="/salesforce-icon.svg"
													alt="salesforce"
													height={24}
													width={24}
												/>
											}
										>
											Connect to Sales Force
										</CustomButton>
										{invalid_api_key && (
											<Typography
												color="error"
												sx={{
													fontFamily: "var(--font-nunito)",
													fontSize: "14px",
													fontWeight: "600",
													lineHeight: "21.82px",
													marginTop: "10px",
												}}
											>
												Invalid API Key detected. Please reconnect to Salesforce
												and try again
											</Typography>
										)}
									</Box>
								</Box>
							</TabPanel>
						</TabContext>
					</Box>
				</Box>
			</Drawer>
		</>
	);
};

export default SalesForceIntegrationPopup;
