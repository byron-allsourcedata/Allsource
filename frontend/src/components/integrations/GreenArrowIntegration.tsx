import React from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {
	Box,
	List,
	ListItem,
	TextField,
	Tooltip,
	Typography,
	Drawer,
	Backdrop,
	Link,
	IconButton,
	Button,
	RadioGroup,
	FormControl,
	FormControlLabel,
	Radio,
	FormLabel,
	Divider,
	Tab,
	Switch,
	LinearProgress,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";
import axios, { AxiosError } from "axios";
import { IntegrationConnectStyles } from "@/app/(client)/integrations/styles";
import CustomButton from "@/components/ui/CustomButton";
import type { InstructionInstallInterface } from "@/components/ui/integrations/IntegrationInstruction";
import { IntegrationInstruction } from "@/components/ui/integrations/IntegrationInstruction";
import { SuppressionSyncTab } from "@/components/ui/integrations/SuppressionSyncTab";
import { CloseIcon } from "@/icon";

interface CreateOmnisendProps {
	fromAudience?: boolean;
	handleClose: () => void;
	onSave?: (new_integration: any) => void;
	open: boolean;
	initApiKey?: string;
	boxShadow?: string;
	invalid_api_key?: boolean;
}

interface IntegrationsCredentials {
	id: number;
	access_token: string;
	ad_account_id: string;
	shop_domain: string;
	data_center: string;
	service_name: string;
	is_with_suppression: boolean;
}

const instructions: InstructionInstallInterface[] = [
	// { id: 'unique-id-1', text: 'Go to the Klaviyo website and log into your account.' },
	// { id: 'unique-id-2', text: 'Click on the Settings option located in your Klaviyo account options.' },
	// { id: 'unique-id-3', text: 'Click Create Private API Key Name to Allsource.' },
	// { id: 'unique-id-4', text: 'Assign full access permissions to Lists and Profiles, and read access permissions to Metrics, Events, and Templates for your Klaviyo key.' },
	// { id: 'unique-id-5', text: 'Click Create.' },
	// { id: 'unique-id-6', text: 'Copy the API key in the next screen and paste to API Key field located in Allsource Klaviyo section.' },
	// { id: 'unique-id-7', text: 'Click Connect.' },
];

const GreenArrowIntegrationDrawer = ({
	fromAudience,
	handleClose,
	open,
	onSave,
	initApiKey,
	boxShadow,
	invalid_api_key,
}: CreateOmnisendProps) => {
	const { triggerSync, setNeedsSync } = useIntegrationContext();
	const [apiKey, setApiKey] = useState("");
	const [apiKeyError, setApiKeyError] = useState(false);
	const [loading, setLoading] = useState(false);
	const [value, setValue] = useState<string>("1");
	const [disableButton, setDisableButton] = useState(false);
	const [selectedRadioValue, setSelectedRadioValue] = useState("");
	const [isDropdownValid, setIsDropdownValid] = useState(false);

	useEffect(() => {
		setApiKey(initApiKey || "");
	}, [initApiKey]);

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedRadioValue(event.target.value);
	};

	const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setApiKey(value);
		setApiKeyError(!value.trim());
	};

	const handleApiKeySave = async () => {
		try {
			setDisableButton(true);
			setLoading(true);
			const response = await axiosInstance.post(
				"/integrations/",
				{
					green_arrow: {
						api_key: apiKey,
					},
				},
				{ params: { service_name: "green_arrow" } },
			);
			if (
				response.status === 200 &&
				response.data.status !== "CREDENTIALS_INVALID"
			) {
				showToast("Integration GreenArrow Successfully");
				if (onSave) {
					onSave({
						service_name: "green_arrow",
						is_failed: false,
						access_token: apiKey,
					});
				}
				await triggerSync();
				setNeedsSync(false);
				handleClose();
			} else {
				showErrorToast("Invalid API Key");
			}
		} catch (error) {
			if (axios.isAxiosError(error) && error.response) {
				showErrorToast(error.response.data.status);
			}
		} finally {
			setDisableButton(false);
			setLoading(false);
		}
	};

	const handleNextTab = async () => {
		if (value === "1") {
			setValue((prevValue) => {
				const nextValue = String(Number(prevValue) + 1);
				return nextValue;
			});
		}
	};

	const handleSave = async () => {
		handleClose();
	};

	const getButton = (tabValue: string) => {
		switch (tabValue) {
			case "1":
				return (
					<CustomButton
						variant="contained"
						onClick={handleApiKeySave}
						disabled={!apiKey || disableButton || apiKeyError}
					>
						Connect
					</CustomButton>
				);
			case "2":
				return (
					<CustomButton variant="contained" onClick={handleSave}>
						Save
					</CustomButton>
				);
			default:
				return null;
		}
	};

	return (
		<>
			{loading && (
				<Box
					sx={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: "rgba(0, 0, 0, 0.2)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1400,
						overflow: "hidden",
					}}
				>
					<Box sx={{ width: "100%", top: 0, height: "100vh" }}>
						<LinearProgress />
					</Box>
				</Box>
			)}
			<Drawer anchor="right" open={open} onClose={handleClose}>
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
						Connect to GreenArrow
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: "32px",
							"@media (max-width: 600px)": { gap: "8px" },
						}}
					>
						<Link
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/connect-to-green-arrow"
							target="_blank"
							rel="noopener refferer"
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
									aria-label="Connect to GreenArrow Tabs"
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
								>
									<Tab
										label="API Key"
										value="1"
										sx={{
											...IntegrationConnectStyles.tabHeading,
											cursor: "pointer",
										}}
									/>
									{/* {!fromAudience && (
										<Tab
											label="Suppression Sync"
											value="2"
											sx={klaviyoStyles.tabHeading}
										/>
									)} */}
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
									>
										<Image
											src="/green_arrow-icon.svg"
											alt="green_arrow"
											height={26}
											width={32}
										/>
										<Typography
											variant="h6"
											sx={{
												fontFamily: "var(--font-nunito)",
												fontSize: "16px",
												fontWeight: "600",
												color: "#202124",
											}}
										>
											API Key
										</Typography>
										<Tooltip
											title="Enter the API key provided by GreenArrow"
											placement="right"
										>
											<Image
												src="/baseline-info-icon.svg"
												alt="baseline-info-icon"
												height={16}
												width={16}
											/>
										</Tooltip>
									</Box>
									<TextField
										label="Enter API Key"
										variant="outlined"
										fullWidth
										margin="normal"
										error={apiKeyError || invalid_api_key}
										helperText={apiKeyError ? "API Key is required" : ""}
										value={apiKey}
										onChange={handleApiKeyChange}
										InputLabelProps={{
											sx: IntegrationConnectStyles.inputLabel,
										}}
										InputProps={{ sx: IntegrationConnectStyles.formInput }}
									/>
								</Box>
								<IntegrationInstruction
									serviceName={"GreenArrow"}
									instructions={instructions}
								/>
							</TabPanel>
							<TabPanel value="2" sx={{ p: 0 }}>
								<SuppressionSyncTab
									image="/green_arrow-icon.svg"
									serviceName="green_arrow"
								/>
							</TabPanel>
						</TabContext>
					</Box>
					<Box
						sx={{ px: 2, py: 2, width: "100%", borderTop: "1px solid #e4e4e4" }}
					>
						<Box
							sx={{
								width: "100%",
								display: "flex",
								justifyContent: "flex-end",
							}}
						>
							{getButton(value)}
						</Box>
					</Box>
				</Box>
			</Drawer>
		</>
	);
};

export default GreenArrowIntegrationDrawer;
