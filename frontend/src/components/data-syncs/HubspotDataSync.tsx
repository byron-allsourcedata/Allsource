import React, { useState, useRef, useEffect } from "react";
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	TextField,
	Divider,
	FormControlLabel,
	FormControl,
	FormLabel,
	Radio,
	Button,
	Link,
	Tab,
	RadioGroup,
	MenuItem,
	Popover,
	Grid,
	LinearProgress,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showToast } from "@/components/ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";
import { InfoIcon } from "@/icon";
import UserTip from "@/components/UserTip";
import { LogoSmall } from "@/components/ui/Logo";

interface OnmisendDataSyncProps {
	open: boolean;
	onClose: () => void;
	onCloseCreateSync?: () => void;
	data?: any;
	isEdit?: boolean;
	boxShadow?: string;
}

interface CustomRow {
	type: string;
	value: string;
	is_constant?: boolean;
}

const HubspotDataSync: React.FC<OnmisendDataSyncProps> = ({
	open,
	onClose,
	onCloseCreateSync,
	data = null,
	isEdit,
	boxShadow,
}) => {
	const { triggerSync } = useIntegrationContext();
	const [loading, setLoading] = useState(false);
	const [value, setValue] = React.useState("1");
	const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
	const [newListName, setNewListName] = useState<string>("");
	const [tagName, setTagName] = useState<string>("");
	const textFieldRef = useRef<HTMLDivElement>(null);
	const [tab2Error, setTab2Error] = useState(false);
	const [isDropdownValid, setIsDropdownValid] = useState(false);
	const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
	const [customFieldsList, setCustomFieldsList] = useState([
		{ type: "company", value: "company_name" },
		{ type: "website", value: "company_domain" },
		{ type: "lifecyclestage", value: "lifecyclestage" },
		{ type: "jobtitle", value: "job_title" },
		{ type: "industry", value: "primary_industry" },
		{ type: "annualrevenue", value: "company_revenue" },
		{ type: "hs_linkedin_url", value: "linkedin_url" },
		{ type: "address", value: "personal_address" },
		{ type: "state", value: "personal_state" },
		{ type: "zip", value: "personal_zip" },
	]);
	const [customFields, setCustomFields] = useState<
		{ type: string; value: string; is_constant?: boolean }[]
	>([]);
	const extendedCustomFieldsList = [
		{ value: "__constant__", type: "Constant field" },
		...customFieldsList,
	];

	useEffect(() => {
		if (data?.data_map) {
			setCustomFields(data?.data_map);
		} else {
			setCustomFields(
				customFieldsList.map((field) => ({
					type: field.value,
					value: field.type,
				})),
			);
		}
	}, [open]);

	const handleAddField = () => {
		setCustomFields([...customFields, { type: "", value: "" }]);
	};

	const handleDeleteField = (index: number) => {
		setCustomFields(customFields.filter((_, i) => i !== index));
	};

	const handleChangeField = (
		index: number,
		key: keyof CustomRow,
		value: string | boolean | undefined,
	) => {
		setCustomFields((prev) => {
			const updated = [...prev];
			updated[index] = {
				...updated[index],
				[key]: value,
			};
			return updated;
		});
	};

	const resetToDefaultValues = () => {
		setLoading(false);
		setValue("1");
		setSelectedRadioValue("");
		setNewListName("");
		setTagName("");
		setTab2Error(false);
		setIsDropdownValid(false);
		setDeleteAnchorEl(null);
		setSelectedRowId(null);
	};

	useEffect(() => {
		setLoading(false);
	}, [open]);

	const handleSaveSync = async () => {
		setLoading(true);
		try {
			if (isEdit) {
				const response = await axiosInstance.put(
					`/data-sync/sync`,
					{
						integrations_users_sync_id: data.id,
						leads_type: selectedRadioValue,
						data_map: customFields,
					},
					{
						params: {
							service_name: "hubspot",
						},
					},
				);
				if (response.status === 201 || response.status === 200) {
					resetToDefaultValues();
					onClose();
					showToast("Data sync updated successfully");
					triggerSync();
				}
			} else {
				const response = await axiosInstance.post(
					"/data-sync/sync",
					{
						leads_type: selectedRadioValue,
						data_map: customFields,
					},
					{
						params: {
							service_name: "hubspot",
						},
					},
				);
				if (response.status === 201 || response.status === 200) {
					resetToDefaultValues();
					onClose();
					showToast("Data sync created successfully");
					triggerSync();
				}
			}
			handlePopupClose();
			if (onCloseCreateSync) {
				onCloseCreateSync();
			}
		} finally {
			setLoading(false);
		}
	};

	const isDuplicate = (value: string, currentIndex: number) => {
		return (
			customFields.filter((f, idx) => f.type === value && idx !== currentIndex)
				.length > 0
		);
	};

	const hubspotStyles = {
		tabHeading: {
			textTransform: "none",
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

	type HighlightConfig = {
		[keyword: string]: { color?: string; fontWeight?: string }; // keyword as the key, style options as the value
	};

	// Define buttons for each tab
	const getButton = (tabValue: string) => {
		switch (tabValue) {
			case "1":
				return (
					<Button
						variant="contained"
						onClick={handleNextTab}
						disabled={!selectedRadioValue}
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
						}}
					>
						Next
					</Button>
				);
			case "2":
				return (
					<Button
						variant="contained"
						onClick={handleSaveSync}
						disabled={!selectedRadioValue || hasErrors()}
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
						}}
					>
						Export
					</Button>
				);
			default:
				return null;
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedRadioValue(event.target.value);
	};

	interface Row {
		id: number;
		type: string;
		value: string;
		selectValue?: string;
		canDelete?: boolean;
	}

	const defaultRows: Row[] = [
		{ id: 1, type: "email", value: "email" },
		{ id: 3, type: "firstname", value: "firstname" },
		{ id: 4, type: "lastname", value: "lastname" },
		{ id: 5, type: "phone", value: "phone" },
		{ id: 6, type: "city", value: "city" },
		{ id: 7, type: "gender", value: "gender" },
	];

	const [rows, setRows] = useState<Row[]>(defaultRows);

	const handleMapListChange = (
		id: number,
		field: "value" | "type",
		value: string,
	) => {
		setRows(
			rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
		);
	};

	const handleClickOpen = (
		event: React.MouseEvent<HTMLElement>,
		id: number,
	) => {
		setDeleteAnchorEl(event.currentTarget);
		setSelectedRowId(id);
	};

	const handleDeleteClose = () => {
		setDeleteAnchorEl(null);
		setSelectedRowId(null);
	};

	const handleDelete = () => {
		if (selectedRowId !== null) {
			setRows(rows.filter((row) => row.id !== selectedRowId));
			handleDeleteClose();
		}
	};

	// Add row function
	const handleAddRow = () => {
		const newRow: Row = {
			id: Date.now(), // Unique ID for each new row
			type: "",
			value: "",
			canDelete: true, // This new row can be deleted
		};
		setRows([...rows, newRow]);
	};

	const validateTab2 = () => {
		if (selectedRadioValue === null) {
			setTab2Error(true);
			return false;
		}
		setTab2Error(false);
		return true;
	};

	const handleNextTab = async () => {
		if (value === "1") {
			setValue((prevValue) => {
				const nextValue = String(Number(prevValue) + 1);
				return nextValue;
			});
		} else if (value === "2") {
			if (validateTab2()) {
				setValue((prevValue) => String(Number(prevValue) + 1));
			}
		} else if (value === "3") {
			if (isDropdownValid) {
				// Proceed to next tab
				setValue((prevValue) => String(Number(prevValue) + 1));
			}
		}
	};

	const deleteOpen = Boolean(deleteAnchorEl);
	const deleteId = deleteOpen ? "delete-popover" : undefined;

	const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	const handlePopupClose = () => {
		resetToDefaultValues();
		onClose();
	};

	const isSnakeCase = (str: string): boolean => {
		return /^[a-z][a-z0-9_]*$/.test(str);
	};

	const hasErrors = (): boolean => {
		return customFields.some((field, index) => {
			if (field.is_constant && field.type && !isSnakeCase(field.type)) {
				return true;
			}
			if (isDuplicate(field.type, index)) {
				return true;
			}
			return false;
		});
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
				onClose={handlePopupClose}
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
						"@media (max-width: 600px)": {
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
						className="first-sub-title"
						sx={{ textAlign: "center" }}
					>
						Connect to Hubspot
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: "32px",
							"@media (max-width: 600px)": { gap: "8px" },
						}}
					>
						<Link
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/pixel-sync-to-hubspot"
							className="main-text"
							target="_blank"
							rel="noopener referrer"
							sx={{
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
						alignItems: "center",
						height: "100%",
					}}
				>
					<UserTip
						limit={100}
						service="Hubspot"
						sx={{
							width: "100%",
							padding: "16px 24px 0px 24px",
						}}
					/>
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
									aria-label="Connect to Hubspot Tabs"
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
										label="Sync Filter"
										value="1"
										className="tab-heading"
										sx={hubspotStyles.tabHeading}
									/>
									{/* <Tab label="Contact Sync" value="2" className='tab-heading' sx={hubspotStyles.tabHeading} /> */}
									<Tab
										label="Map data"
										value="2"
										className="tab-heading"
										sx={hubspotStyles.tabHeading}
									/>
								</TabList>
							</Box>
							<TabPanel value="1" sx={{ p: 0 }}>
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
										<Typography variant="subtitle1" className="paragraph">
											Synchronize all data in real-time from this moment forward
											for seamless integration and continuous updates.
										</Typography>
										<FormControl sx={{ gap: "16px" }} error={tab2Error}>
											<FormLabel
												id="contact-type-radio-buttons-group-label"
												className="first-sub-title"
												sx={{
													"&.Mui-focused": {
														color: "#000",
														transform: "none !important",
													},
												}}
											>
												Filter by Contact type
											</FormLabel>
											<RadioGroup
												aria-labelledby="contact-type-radio-buttons-group-label"
												name="contact-type-row-radio-buttons-group"
												value={selectedRadioValue}
												onChange={handleRadioChange}
											>
												<FormControlLabel
													value="allContacts"
													control={
														<Radio
															sx={{
																color: "#e4e4e4",
																"&.Mui-checked": {
																	color: "rgba(56, 152, 252, 1)", // checked color
																},
															}}
														/>
													}
													label="All Contacts"
													componentsProps={{
														typography: {
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "14px",
																fontWeight: "500",
																color: "#000",
																lineHeight: "normal",
																opacity:
																	selectedRadioValue === "allContacts"
																		? 1
																		: 0.43,
																"@media (max-width:440px)": {
																	fontSize: "12px",
																},
															},
														},
													}}
													sx={{
														"@media (max-width:600px)": {
															flexBasis: "calc(50% - 8px)",
														},
													}}
												/>
												<FormControlLabel
													value="visitor"
													control={
														<Radio
															sx={{
																color: "#e4e4e4",
																"&.Mui-checked": {
																	color: "rgba(56, 152, 252, 1)", // checked color
																},
															}}
														/>
													}
													label="Visitors"
													componentsProps={{
														typography: {
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "14px",
																fontWeight: "500",
																color: "#000",
																lineHeight: "normal",
																opacity:
																	selectedRadioValue === "visitors" ? 1 : 0.43,
																"@media (max-width:440px)": {
																	fontSize: "12px",
																},
															},
														},
													}}
													sx={{
														"@media (max-width:600px)": {
															flexBasis: "calc(50% - 8px)",
														},
													}}
												/>
												<FormControlLabel
													value="viewed_product"
													control={
														<Radio
															sx={{
																color: "#e4e4e4",
																"&.Mui-checked": {
																	color: "rgba(56, 152, 252, 1)", // checked color
																},
															}}
														/>
													}
													label="View Product"
													componentsProps={{
														typography: {
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "14px",
																fontWeight: "500",
																color: "#000",
																lineHeight: "normal",
																opacity:
																	selectedRadioValue === "viewProduct"
																		? 1
																		: 0.43,
																"@media (max-width:440px)": {
																	fontSize: "12px",
																},
															},
														},
													}}
													sx={{
														"@media (max-width:600px)": {
															flexBasis: "calc(50% - 8px)",
														},
													}}
												/>
												<FormControlLabel
													value="abandoned_cart"
													control={
														<Radio
															sx={{
																color: "#e4e4e4",
																"&.Mui-checked": {
																	color: "rgba(56, 152, 252, 1)", // checked color
																},
															}}
														/>
													}
													label="Abandoned cart"
													componentsProps={{
														typography: {
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "14px",
																fontWeight: "500",
																color: "#000",
																lineHeight: "normal",
																opacity:
																	selectedRadioValue === "addToCart" ? 1 : 0.43,
																"@media (max-width:440px)": {
																	fontSize: "12px",
																},
															},
														},
													}}
													sx={{
														"@media (max-width:600px)": {
															flexBasis: "calc(50% - 8px)",
														},
													}}
												/>
												<FormControlLabel
													value="converted_sales"
													control={
														<Radio
															sx={{
																color: "#e4e4e4",
																"&.Mui-checked": {
																	color: "rgba(56, 152, 252, 1)", // checked color
																},
															}}
														/>
													}
													label="Converted Sales"
													componentsProps={{
														typography: {
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "14px",
																fontWeight: "500",
																color: "#000",
																lineHeight: "normal",
																opacity:
																	selectedRadioValue === "addToCart" ? 1 : 0.43,
																"@media (max-width:440px)": {
																	fontSize: "12px",
																},
															},
														},
													}}
													sx={{
														"@media (max-width:600px)": {
															flexBasis: "calc(50% - 8px)",
														},
													}}
												/>
											</RadioGroup>
										</FormControl>
									</Box>
								</Box>
							</TabPanel>
							<TabPanel value="2" sx={{ p: 0 }}>
								<Box
									sx={{
										borderRadius: "4px",
										border: "1px solid #f0f0f0",
										boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
										padding: "16px 24px",
										overflowX: "auto",
									}}
								>
									<Box
										sx={{ display: "flex", gap: "8px", marginBottom: "20px" }}
									>
										<Typography variant="h6" className="first-sub-title">
											Map list
										</Typography>
									</Box>

									<Grid
										container
										alignItems="center"
										sx={{
											flexWrap: { xs: "nowrap", sm: "wrap" },
											marginBottom: "14px",
										}}
									>
										<Grid
											item
											xs="auto"
											sm={5}
											sx={{
												textAlign: "center",
												"@media (max-width:599px)": {
													minWidth: "196px",
												},
											}}
										>
											<LogoSmall alt="logo" height={22} width={34} />
										</Grid>
										<Grid
											item
											xs="auto"
											sm={7}
											sx={{
												textAlign: "center",
												"@media (max-width:599px)": {
													minWidth: "196px",
												},
											}}
										>
											<Image
												src="/hubspot.svg"
												alt="hubspot"
												height={20}
												width={24}
											/>
										</Grid>
									</Grid>

									{defaultRows.map((row, index) => (
										<Box key={row.id} sx={{ mb: 2 }}>
											{" "}
											{/* Add margin between rows */}
											<Grid
												container
												spacing={2}
												alignItems="center"
												sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
											>
												{/* Left Input Field */}
												<Grid item xs="auto" sm={5}>
													<TextField
														fullWidth
														variant="outlined"
														disabled={true}
														value={row.value}
														onChange={(e) =>
															handleMapListChange(
																row.id,
																"value",
																e.target.value,
															)
														}
														InputLabelProps={{
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "12px",
																lineHeight: "16px",
																color: "rgba(17, 17, 19, 0.60)",
																top: "-5px",
																"&.Mui-focused": {
																	color: "rgba(56, 152, 252, 1)",
																	top: 0,
																},
																"&.MuiInputLabel-shrink": {
																	top: 0,
																},
															},
														}}
														InputProps={{
															sx: {
																"&.MuiOutlinedInput-root": {
																	height: "36px",
																	"& .MuiOutlinedInput-input": {
																		padding: "6.5px 8px",
																		fontFamily: "var(--font-roboto)",
																		color: "#202124",
																		fontSize: "12px",
																		fontWeight: "400",
																		lineHeight: "20px",
																	},
																	"& .MuiOutlinedInput-notchedOutline": {
																		borderColor: "#A3B0C2",
																	},
																	"&:hover .MuiOutlinedInput-notchedOutline": {
																		borderColor: "#A3B0C2",
																	},
																	"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																		{
																			borderColor: "rgba(56, 152, 252, 1)",
																		},
																},
																"&+.MuiFormHelperText-root": {
																	marginLeft: "0",
																},
															},
														}}
													/>
												</Grid>
												{/* Middle Icon Toggle (Right Arrow or Close Icon) */}
												<Grid
													item
													xs="auto"
													sm={1}
													container
													justifyContent="center"
												>
													{row.selectValue !== undefined ? (
														row.selectValue ? (
															<Image
																src="/chevron-right-purple.svg"
																alt="chevron-right-purple"
																height={18}
																width={18} // Adjust the size as needed
															/>
														) : (
															<Image
																src="/close-circle.svg"
																alt="close-circle"
																height={18}
																width={18} // Adjust the size as needed
															/>
														)
													) : (
														<Image
															src="/chevron-right-purple.svg"
															alt="chevron-right-purple"
															height={18}
															width={18} // Adjust the size as needed
														/> // For the first two rows, always show the right arrow
													)}
												</Grid>

												{/* Right Side Input or Dropdown */}
												<Grid item xs="auto" sm={5}>
													<TextField
														fullWidth
														variant="outlined"
														disabled={true}
														value={row.type}
														onChange={(e) =>
															handleMapListChange(
																row.id,
																"type",
																e.target.value,
															)
														}
														InputLabelProps={{
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "12px",
																lineHeight: "16px",
																color: "rgba(17, 17, 19, 0.60)",
																top: "-5px",
																"&.Mui-focused": {
																	color: "rgba(56, 152, 252, 1)",
																	top: 0,
																},
																"&.MuiInputLabel-shrink": {
																	top: 0,
																},
															},
														}}
														InputProps={{
															sx: {
																"&.MuiOutlinedInput-root": {
																	height: "36px",
																	"& .MuiOutlinedInput-input": {
																		padding: "6.5px 8px",
																		fontFamily: "var(--font-roboto)",
																		color: "#202124",
																		fontSize: "12px",
																		fontWeight: "400",
																		lineHeight: "20px",
																	},
																	"& .MuiOutlinedInput-notchedOutline": {
																		borderColor: "#A3B0C2",
																	},
																	"&:hover .MuiOutlinedInput-notchedOutline": {
																		borderColor: "#A3B0C2",
																	},
																	"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																		{
																			borderColor: "rgba(56, 152, 252, 1)",
																		},
																},
																"&+.MuiFormHelperText-root": {
																	marginLeft: "0",
																},
															},
														}}
													/>
												</Grid>

												{/* Delete Icon */}
												<Grid
													item
													xs="auto"
													sm={1}
													container
													justifyContent="center"
												>
													{row.canDelete && (
														<>
															<IconButton
																onClick={(event) =>
																	handleClickOpen(event, row.id)
																}
															>
																<Image
																	src="/trash-icon-filled.svg"
																	alt="trash-icon-filled"
																	height={18}
																	width={18} // Adjust the size as needed
																/>
															</IconButton>
															<Popover
																id={deleteId}
																open={deleteOpen}
																anchorEl={deleteAnchorEl}
																onClose={handleDeleteClose}
																anchorOrigin={{
																	vertical: "bottom",
																	horizontal: "center",
																}}
																transformOrigin={{
																	vertical: "top",
																	horizontal: "right",
																}}
															>
																<Box
																	sx={{
																		minWidth: "254px",
																		borderRadius: "4px",
																		border: "0.2px solid #afafaf",
																		background: "#fff",
																		boxShadow:
																			"0px 4px 4px 0px rgba(0, 0, 0, 0.12)",
																		padding: "16px 21px 16px 16px",
																	}}
																>
																	<Typography
																		variant="body1"
																		className="first-sub-title"
																		sx={{
																			paddingBottom: "12px",
																		}}
																	>
																		Confirm Deletion
																	</Typography>
																	<Typography
																		variant="body2"
																		sx={{
																			color: "#5f6368",
																			fontFamily: "var(--font-roboto)",
																			fontSize: "12px",
																			fontWeight: "400",
																			lineHeight: "16px",
																			paddingBottom: "26px",
																		}}
																	>
																		Are you sure you want to delete this <br />{" "}
																		map data?
																	</Typography>
																	<Box
																		display="flex"
																		justifyContent="flex-end"
																		mt={2}
																	>
																		<Button
																			onClick={handleDeleteClose}
																			sx={{
																				borderRadius: "4px",
																				border:
																					"1px solid rgba(56, 152, 252, 1)",
																				boxShadow:
																					"0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
																				color: "rgba(56, 152, 252, 1)",
																				fontFamily: "var(--font-nunito)",
																				fontSize: "14px",
																				fontWeight: "600",
																				lineHeight: "20px",
																				marginRight: "16px",
																				textTransform: "none",
																			}}
																		>
																			Clear
																		</Button>
																		<Button
																			onClick={handleDelete}
																			sx={{
																				background: "rgba(56, 152, 252, 1)",
																				borderRadius: "4px",
																				border:
																					"1px solid rgba(56, 152, 252, 1)",
																				boxShadow:
																					"0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
																				color: "#fff",
																				fontFamily: "var(--font-nunito)",
																				fontSize: "14px",
																				fontWeight: "600",
																				lineHeight: "20px",
																				textTransform: "none",
																				"&:hover": {
																					color: "rgba(56, 152, 252, 1)",
																				},
																			}}
																		>
																			Delete
																		</Button>
																	</Box>
																</Box>
															</Popover>
														</>
													)}
												</Grid>
											</Grid>
										</Box>
									))}
									<Box sx={{ mb: 2 }}>
										{customFields.map((field, index) => (
											<Grid
												container
												spacing={2}
												alignItems="center"
												sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
												key={index}
											>
												<Grid item xs="auto" sm={5} mb={2}>
													{field.is_constant ? (
														<TextField
															fullWidth
															variant="outlined"
															label="Constant Field Name"
															value={field.type}
															onChange={(e) =>
																handleChangeField(index, "type", e.target.value)
															}
															placeholder="Enter field name"
															error={
																field.is_constant &&
																!!field.type &&
																!isSnakeCase(field.type)
															}
															InputLabelProps={{
																sx: {
																	fontFamily: "var(--font-nunito)",
																	fontSize: "13px",
																	lineHeight: "16px",
																	color: "rgba(17, 17, 19, 0.60)",
																	top: "-5px",
																	"&.Mui-focused": {
																		color: "rgba(56, 152, 252, 1)",
																		top: 0,
																	},
																	"&.MuiInputLabel-shrink": {
																		top: 0,
																	},
																},
															}}
															InputProps={{
																sx: {
																	"&.MuiOutlinedInput-root": {
																		height: "36px",
																		"& .MuiOutlinedInput-input": {
																			padding: "6.5px 8px",
																			fontFamily: "var(--font-roboto)",
																			color: "#202124",
																			fontSize: "14px",
																			fontWeight: "400",
																			lineHeight: "20px",
																		},
																		"& .MuiOutlinedInput-notchedOutline": {
																			borderColor: "#A3B0C2",
																		},
																		"&:hover .MuiOutlinedInput-notchedOutline":
																			{
																				borderColor: "#A3B0C2",
																			},
																		"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																			{
																				borderColor: "rgba(56, 152, 252, 1)",
																			},
																	},
																	"&+.MuiFormHelperText-root": {
																		marginLeft: "0",
																	},
																},
															}}
														/>
													) : (
														<TextField
															select
															fullWidth
															variant="outlined"
															label="Custom Field"
															value={field.type}
															onChange={(e) => {
																const selected = e.target.value;
																if (selected === "__constant__") {
																	setCustomFields((prev) => {
																		const updated = [...prev];
																		updated[index] = {
																			...updated[index],
																			type: "",
																			is_constant: true,
																		};
																		return updated;
																	});
																} else {
																	handleChangeField(index, "type", selected);
																	handleChangeField(
																		index,
																		"is_constant",
																		undefined,
																	);
																}
															}}
															InputLabelProps={{
																sx: {
																	fontFamily: "var(--font-nunito)",
																	fontSize: "13px",
																	lineHeight: "16px",
																	color: "rgba(17, 17, 19, 0.60)",
																	top: "-5px",
																	"&.Mui-focused": {
																		color: "rgba(56, 152, 252, 1)",
																		top: 0,
																	},
																	"&.MuiInputLabel-shrink": {
																		top: 0,
																	},
																},
															}}
															InputProps={{
																sx: {
																	"&.MuiOutlinedInput-root": {
																		height: "36px",
																		"& .MuiOutlinedInput-input": {
																			padding: "6.5px 8px",
																			fontFamily: "var(--font-roboto)",
																			color: "#202124",
																			fontSize: "14px",
																			fontWeight: "400",
																			lineHeight: "20px",
																		},
																		"& .MuiOutlinedInput-notchedOutline": {
																			borderColor: "#A3B0C2",
																		},
																		"&:hover .MuiOutlinedInput-notchedOutline":
																			{
																				borderColor: "#A3B0C2",
																			},
																		"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																			{
																				borderColor: "rgba(56, 152, 252, 1)",
																			},
																	},
																	"&+.MuiFormHelperText-root": {
																		marginLeft: "0",
																	},
																},
															}}
															error={isDuplicate(field.type, index)}
															helperText={
																isDuplicate(field.type, index)
																	? "This field name already exists"
																	: ""
															}
														>
															{extendedCustomFieldsList.map((item) => (
																<MenuItem
																	key={item.value}
																	value={item.value}
																	disabled={
																		item.value !== "__constant__" &&
																		customFields.some(
																			(f) => f.type === item.value,
																		)
																	}
																>
																	{item.type}
																</MenuItem>
															))}
														</TextField>
													)}
												</Grid>
												<Grid
													item
													xs="auto"
													sm={1}
													mb={2}
													container
													justifyContent="center"
												>
													<Image
														src="/chevron-right-purple.svg"
														alt="chevron-right-purple"
														height={18}
														width={18}
													/>
												</Grid>
												<Grid item xs="auto" sm={5} mb={2}>
													<TextField
														fullWidth
														variant="outlined"
														value={field.value}
														onChange={(e) =>
															handleChangeField(index, "value", e.target.value)
														}
														placeholder="Enter value"
														InputLabelProps={{
															sx: {
																fontFamily: "var(--font-nunito)",
																fontSize: "13px",
																lineHeight: "16px",
																color: "rgba(17, 17, 19, 0.60)",
																top: "-5px",
																"&.Mui-focused": {
																	color: "rgba(56, 152, 252, 1)",
																	top: 0,
																},
																"&.MuiInputLabel-shrink": {
																	top: 0,
																},
															},
														}}
														InputProps={{
															sx: {
																maxHeight: "36px",
																"& .MuiOutlinedInput-input": {
																	padding: "6.5px 8px",
																	fontFamily: "var(--font-roboto)",
																	color: "#202124",
																	fontSize: "12px",
																	fontWeight: "400",
																	lineHeight: "20px",
																},
																"& .MuiOutlinedInput-notchedOutline": {
																	borderColor: "#A3B0C2",
																},
																"&:hover .MuiOutlinedInput-notchedOutline": {
																	borderColor: "#A3B0C2",
																},
																"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																	{
																		borderColor: "rgba(56, 152, 252, 1)",
																	},
															},
														}}
													/>
												</Grid>
												<Grid
													item
													xs="auto"
													mb={2}
													sm={1}
													container
													justifyContent="center"
												>
													<IconButton onClick={() => handleDeleteField(index)}>
														<Image
															src="/trash-icon-filled.svg"
															alt="trash-icon-filled"
															height={18}
															width={18}
														/>
													</IconButton>
												</Grid>
												{field.type && !isSnakeCase(field.type) && (
													<Box
														sx={{ width: "100%", pl: 2.25, mt: "-6px", mb: 1 }}
													>
														<Typography
															sx={{
																color: "#d32f2f",
																fontSize: "12px",
																marginTop: "4px",
																marginLeft: "2px",
																fontFamily: "var(--font-roboto)",
															}}
														>
															Field name must be in snake_case: lowercase
															letters and underscores only
														</Typography>
													</Box>
												)}
											</Grid>
										))}
										<Box
											sx={{
												display: "flex",
												justifyContent: "flex-end",
												mb: 6,
												mr: 6,
											}}
										>
											<Button
												onClick={handleAddField}
												aria-haspopup="true"
												sx={{
													textTransform: "none",
													border: "1px solid rgba(56, 152, 252, 1)",
													borderRadius: "4px",
													padding: "6px 12px",
													minWidth: "auto",
													"@media (max-width: 900px)": {
														display: "none",
													},
												}}
											>
												<Typography
													sx={{
														fontFamily: "var(--font-nunito)",
														lineHeight: "22.4px",
														fontSize: "16px",
														textAlign: "left",
														fontWeight: "500",
														color: "rgba(56, 152, 252, 1)",
													}}
												>
													Add
												</Typography>
											</Button>
										</Box>
									</Box>
								</Box>
							</TabPanel>
						</TabContext>
					</Box>
					<Box
						sx={{
							px: 2,
							py: 2,
							borderTop: "1px solid #e4e4e4",
							position: "fixed",
							bottom: 0,
							right: 0,
							background: "#fff",
							zIndex: "1",
							width: "40%",
							"@media (max-width: 600px)": {
								width: "100%",
							},
						}}
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
export default HubspotDataSync;
