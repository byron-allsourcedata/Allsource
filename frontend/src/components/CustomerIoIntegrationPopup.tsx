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
	Link,
	IconButton,
	Button,
	Tab,
	Switch,
	LinearProgress,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "./ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";

interface CreateCustomerIoProps {
	fromAudience?: boolean;
	handleClose: () => void;
	onSave?: (new_integration: any) => void;
	open: boolean;
	initApiKey?: string;
	boxShadow?: string;
	invalid_api_key?: boolean;
}

const klaviyoStyles = {
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

const CustomerIoConnect = ({
	fromAudience,
	handleClose,
	open,
	onSave,
	initApiKey,
	boxShadow,
	invalid_api_key,
}: CreateCustomerIoProps) => {
	const { triggerSync, setNeedsSync } = useIntegrationContext();
	const [apiKey, setApiKey] = useState("");
	const [apiKeyError, setApiKeyError] = useState(false);
	const [loading, setLoading] = useState(false);
	const [value, setValue] = useState<string>("1");
	const [checked, setChecked] = useState(false);
	const label = { inputProps: { "aria-label": "Switch demo" } };
	const [disableButton, setDisableButton] = useState(false);

	useEffect(() => {
		setApiKey(initApiKey || "");
	}, [initApiKey]);

	const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setChecked(event.target.checked);
	};

	const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setApiKey(value);
		setApiKeyError(!value.trim());
	};

	interface Instruction {
		text: string;
	}

	const instructions: Instruction[] = [
		{ text: "Go to your Customer.io account → People → Customer.io API" },
		{ text: "Copy the API token provided in Customer.io API" },
		{ text: "Go to Allsource" },
		{ text: "Paste it into the API field in the Allsource integration popup" },
		{ text: "Click the Test connection button" },
		{ text: "Go back to the Customer.io connection page" },
		{
			text: "Click the Complete Setup button if the source was connected successfully; otherwise, check that you pasted the correct token",
		},
		{ text: "Go to Allsource and click the Connect button" },
		{ text: "You're good to go!" },
	];

	type HighlightConfig = {
		[keyword: string]: { color?: string; fontWeight?: string };
	};

	const highlightText = (text: string, highlightConfig: HighlightConfig) => {
		let parts: (string | JSX.Element)[] = [text];

		Object.keys(highlightConfig).forEach((keyword, keywordIndex) => {
			const { color, fontWeight } = highlightConfig[keyword];
			parts = parts.flatMap((part, partIndex) =>
				typeof part === "string" && part.includes(keyword)
					? part.split(keyword).flatMap((segment, index, array) =>
							index < array.length - 1
								? [
										segment,
										<span
											style={{
												color: color || "inherit",
												fontWeight: fontWeight || "normal",
											}}
											key={`highlight-${keywordIndex}-${partIndex}-${index}`}
										>
											{keyword}
										</span>,
									]
								: [segment],
						)
					: [part],
			);
		});

		return <>{parts}</>;
	};

	const handleTestApiKey = async () => {
		// Send test api request to Customer.io
		axiosInstance.get(`/integrations/customer-io?api_token=${apiKey}`);
	};

	const handleApiKeySave = async () => {
		try {
			setDisableButton(true);
			setLoading(true);

			const response = await axiosInstance.post(
				"/integrations/",
				{
					customer_io: {
						api_key: apiKey,
					},
				},
				{ params: { service_name: "customer_io" } },
			);
			if (
				response.status === 200 &&
				response.data.status !== "CREDENTIALS_INVALID"
			) {
				showToast("Integration Customer.io Successfully");
				if (onSave) {
					onSave({
						service_name: "customer_io",
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
		} finally {
			setDisableButton(false);
			setLoading(false);
		}
	};

	const highlightConfig: HighlightConfig = {
		"Customer.io": { color: "rgba(56, 152, 252, 1)", fontWeight: "500" },
		Allsource: { color: "rgba(56, 152, 252, 1)", fontWeight: "500" },
		Settings: { color: "#707071", fontWeight: "500" },
		"Create Private API Key": { color: "#707071", fontWeight: "500" },
		Lists: { color: "#707071", fontWeight: "500" },
		Profiles: { color: "#707071", fontWeight: "500" },
		Metrics: { color: "#707071", fontWeight: "500" },
		Events: { color: "#707071", fontWeight: "500" },
		Templates: { color: "#707071", fontWeight: "500" },
		Create: { color: "#707071", fontWeight: "500" },
		"API token": { color: "#707071", fontWeight: "500" },
		Connect: { color: "#707071", fontWeight: "500" },
		"Test connection": { color: "#707071", fontWeight: "500" },
		"Complete Setup": { color: "#707071", fontWeight: "500" },
		Export: { color: "#707071", fontWeight: "500" },
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
			<Drawer
				anchor="right"
				open={open}
				onClose={handleClose}
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
						Connect to Customer.io
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: "32px",
							"@media (max-width: 600px)": { gap: "8px" },
						}}
					>
						<Link
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/connect-to-customer-io"
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
									aria-label="Connect to Customer.io Tabs"
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
										sx={{ ...klaviyoStyles.tabHeading, cursor: "pointer" }}
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
									>
										<Image
											color="black"
											src="/customer-io-icon.svg"
											alt="customer_io"
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
											title="Enter the API key provided by Customer.io"
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
										InputLabelProps={{ sx: klaviyoStyles.inputLabel }}
										InputProps={{ sx: klaviyoStyles.formInput }}
									/>
								</Box>
								{instructions.length > 0 && (
									<Box
										sx={{
											mt: 2,
											background: "#f0f0f0",
											border: "1px solid #efefef",
											borderRadius: "4px",
											p: 2,
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												mb: 2,
											}}
										>
											<Image
												src="/info-circle.svg"
												alt="info-circle"
												height={20}
												width={20}
											/>
											<Typography
												variant="subtitle1"
												sx={{
													fontFamily: "var(--font-nunito)",
													fontSize: "16px",
													fontWeight: "600",
													color: "#202124",
													lineHeight: "normal",
												}}
											>
												How to integrate Customer.io
											</Typography>
										</Box>
										<List dense sx={{ p: 0 }}>
											{instructions.map((instruction, index) => (
												<ListItem
													key={index}
													sx={{ p: 0, alignItems: "flex-start" }}
												>
													<Typography
														variant="body1"
														sx={{
															display: "inline-block",
															marginRight: "4px",
															fontFamily: "var(--font-roboto)",
															fontSize: "12px",
															fontWeight: "400",
															color: "#808080",
															lineHeight: "24px",
														}}
													>
														{index + 1}.
													</Typography>
													<Typography
														variant="body1"
														sx={{
															display: "inline",
															fontFamily: "var(--font-roboto)",
															fontSize: "12px",
															fontWeight: "400",
															color: "#808080",
															lineHeight: "24px",
														}}
													>
														{highlightText(instruction.text, highlightConfig)}
													</Typography>
												</ListItem>
											))}
										</List>
									</Box>
								)}
							</TabPanel>
							<TabPanel value="2" sx={{ p: 0 }}>
								<Box
									sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
								>
									<Box
										sx={{
											p: 2,
											border: "1px solid #f0f0f0",
											borderRadius: "4px",
											boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
											display: "flex",
											flexDirection: "column",
											gap: "16px",
										}}
									>
										<Box
											sx={{ display: "flex", alignItems: "center", gap: "8px" }}
										>
											<Image
												src="/mailchimp-icon.svg"
												alt="mailchimp"
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
													lineHeight: "normal",
												}}
											>
												Eliminate Redundancy: Stop Paying for Contacts You
												Already Own
											</Typography>
										</Box>
										<Typography
											variant="subtitle1"
											sx={{
												fontFamily: "var(--font-roboto)",
												fontSize: "12px",
												fontWeight: "400",
												color: "#808080",
												lineHeight: "20px",
												letterSpacing: "0.06px",
											}}
										>
											Sync your current list to avoid collecting contacts you
											already possess. Newly added contacts in Mailchimp will be
											automatically suppressed each day.
										</Typography>

										<Box
											sx={{
												display: "flex",
												gap: "32px",
												alignItems: "center",
											}}
										>
											<Typography
												variant="subtitle1"
												sx={{
													fontFamily: "var(--font-roboto)",
													fontSize: "12px",
													fontWeight: "400",
													color: "#808080",
													lineHeight: "normal",
													letterSpacing: "0.06px",
												}}
											>
												Enable Automatic Contact Suppression
											</Typography>

											{/* Switch Control with Yes/No Labels */}
											<Box position="relative" display="inline-block">
												<Switch
													{...label}
													checked={checked}
													onChange={handleSwitchChange}
													sx={{
														width: 54, // Increase width to fit "Yes" and "No"
														height: 24,
														padding: 0,
														"& .MuiSwitch-switchBase": {
															padding: 0,
															top: "2px",
															left: "3px",
															"&.Mui-checked": {
																left: 0,
																transform: "translateX(32px)", // Adjust for larger width
																color: "#fff",
																"&+.MuiSwitch-track": {
																	backgroundColor: checked
																		? "rgba(56, 152, 252, 1)"
																		: "#7b7b7b",
																	opacity: checked ? "1" : "1",
																},
															},
														},
														"& .MuiSwitch-thumb": {
															width: 20,
															height: 20,
														},
														"& .MuiSwitch-track": {
															borderRadius: 20 / 2,
															backgroundColor: checked
																? "rgba(56, 152, 252, 1)"
																: "#7b7b7b",
															opacity: checked ? "1" : "1",
															"& .MuiSwitch-track.Mui-checked": {
																backgroundColor: checked
																	? "rgba(56, 152, 252, 1)"
																	: "#7b7b7b",
																opacity: checked ? "1" : "1",
															},
														},
													}}
												/>
												<Box
													sx={{
														position: "absolute",
														top: "50%",
														left: "0px",
														width: "100%",
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
														transform: "translateY(-50%)",
														pointerEvents: "none",
													}}
												>
													{/* Conditional Rendering of Text */}
													{!checked && (
														<Typography
															variant="caption"
															sx={{
																fontFamily: "var(--font-roboto)",
																fontSize: "12px",
																color: "#fff",
																fontWeight: "400",
																marginRight: "8px",
																lineHeight: "normal",
																width: "100%",
																textAlign: "right",
															}}
														>
															No
														</Typography>
													)}

													{checked && (
														<Typography
															variant="caption"
															sx={{
																fontFamily: "var(--font-roboto)",
																fontSize: "12px",
																color: "#fff",
																fontWeight: "400",
																marginLeft: "6px",
																lineHeight: "normal",
															}}
														>
															Yes
														</Typography>
													)}
												</Box>
											</Box>
										</Box>
									</Box>
									<Box
										sx={{
											background: "#efefef",
											borderRadius: "4px",
											px: 1.5,
											py: 1,
										}}
									>
										<Box
											sx={{ display: "flex", alignItems: "center", gap: "8px" }}
										>
											<Image
												src="/info-circle.svg"
												alt="info-circle"
												height={20}
												width={20}
											/>
											<Typography
												variant="subtitle1"
												sx={{
													fontFamily: "var(--font-roboto)",
													fontSize: "12px",
													fontWeight: "400",
													color: "#808080",
													lineHeight: "20px",
													letterSpacing: "0.06px",
												}}
											>
												By performing this action, all your Customer.io contacts
												will be added to your Grow suppression list, and new
												contacts will be imported daily around 6pm EST.
											</Typography>
										</Box>
									</Box>
								</Box>
							</TabPanel>
						</TabContext>
					</Box>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "right",
							px: 2,
							py: 2,
							width: "100%",
							borderTop: "1px solid #e4e4e4",
						}}
					>
						<Box
							sx={{
								mr: 2,
							}}
						>
							<Button
								variant="outlined"
								onClick={handleTestApiKey}
								disabled={!apiKey}
								sx={{
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: "600",
									lineHeight: "20px",
									letterSpacing: "normal",
									textTransform: "none",
									padding: "10px 24px",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									borderRadius: "4px",
								}}
							>
								Test connection
							</Button>
						</Box>

						<Box>
							<Button
								variant="contained"
								onClick={handleApiKeySave}
								disabled={!apiKey || disableButton || apiKeyError}
								sx={{
									backgroundColor: "rgba(56, 152, 252, 1)",
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: "600",
									lineHeight: "20px",
									letterSpacing: "normal",
									color: "#fff",
									textTransform: "none",
									padding: "10px 24px",
									boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
									":hover": {
										backgroundColor: "rgba(30, 136, 229, 1)",
									},
									":active": {
										backgroundColor: "rgba(56, 152, 252, 1)",
									},
									":disabled": {
										backgroundColor: "rgba(56, 152, 252, 1)",
										color: "#fff",
										opacity: 0.6,
									},
									borderRadius: "4px",
									border: "1px solid rgba(56, 152, 252, 1)",
								}}
							>
								Connect
							</Button>
						</Box>
					</Box>
				</Box>
			</Drawer>
		</>
	);
};

export default CustomerIoConnect;
