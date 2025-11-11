import React, { useState, useRef, useEffect, useMemo } from "react";
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
	Tooltip,
	RadioGroup,
	MenuItem,
	Popover,
	Menu,
	ListItemText,
	ClickAwayListener,
	InputAdornment,
	Grid,
	LinearProgress,
	Select,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";
import UserTip from "@/components/ui/tips/TipInsideDrawer";
import { LogoSmall } from "@/components/ui/Logo";
import { dataSyncStyles } from "./dataSyncStyles";
import { integrationsStyle } from "@/app/(client)/integrations/integrationsStyle";
import { CustomButton } from "../ui";
import { useCustomFields, Row } from "./pixel-sync-data/useCustomFields";
import { CustomFieldRow } from "./pixel-sync-data/CustomFieldRow";

interface ConnectGreenArrowPopupProps {
	open: boolean;
	onClose: () => void;
	onCloseCreateSync?: () => void;
	data: any;
	isEdit?: boolean;
}

type GreenArrowList = {
	id: string;
	list_name: string;
};

const defaultRows: Row[] = [
	{ id: 2, type: "Phone number", value: "Phone number" },
	{ id: 3, type: "First name", value: "First name" },
	{ id: 4, type: "Second name", value: "Second name" },
	{ id: 5, type: "Job Title", value: "Job Title" },
	{ id: 6, type: "Location", value: "Location" },
];

const GreenArrowDataSync: React.FC<ConnectGreenArrowPopupProps> = ({
	open,
	onClose,
	onCloseCreateSync,
	data,
	isEdit,
}) => {
	const { triggerSync } = useIntegrationContext();
	const [loading, setLoading] = useState(false);
	const [value, setValue] = React.useState("1");
	const [checked, setChecked] = useState(false);
	const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedOption, setSelectedOption] = useState<GreenArrowList | null>(
		null,
	);
	const [listName, setlistName] = useState<string | null>(data?.name ?? "");
	const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
	const [newListName, setNewListName] = useState<string>("");
	const [tagName, setTagName] = useState<string>("");
	const [isShrunk, setIsShrunk] = useState<boolean>(false);
	const textFieldRef = useRef<HTMLDivElement>(null);
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [tab2Error, setTab2Error] = useState(false);
	const [isDropdownValid, setIsDropdownValid] = useState(false);
	const [listNameError, setListNameError] = useState(false);
	const [tagNameError, setTagNameError] = useState(false);
	const [deleteAnchorEl, setDeleteAnchorEl] = useState<null | HTMLElement>(
		null,
	);
	const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
	const [greenArrowList, setGreenArrowList] = useState<GreenArrowList[]>([]);
	const CUSTOM_FIELDS = [
		{ type: "Gender", value: "gender" },
		{ type: "Company Name", value: "company_name" },
		{ type: "Company Domain", value: "company_domain" },
		{ type: "Company SIC", value: "company_sic" },
		{ type: "Company LinkedIn URL", value: "company_linkedin_url" },
		{ type: "Company Revenue", value: "company_revenue" },
		{ type: "Company Employee Count", value: "company_employee_count" },
		{ type: "Net Worth", value: "net_worth" },
		{ type: "Last Updated", value: "last_updated" },
		{ type: "Personal Emails Last Seen", value: "personal_emails_last_seen" },
		{ type: "Company Last Updated", value: "company_last_updated" },
		{ type: "Job Title Last Updated", value: "job_title_last_updated" },
		{ type: "Age Min", value: "age_min" },
		{ type: "Age Max", value: "age_max" },
		{ type: "Additional Personal Emails", value: "additional_personal_emails" },
		{ type: "LinkedIn URL", value: "linkedin_url" },
		{ type: "Married", value: "married" },
		{ type: "Children", value: "children" },
		{ type: "Income Range", value: "income_range" },
		{ type: "Homeowner", value: "homeowner" },
		{ type: "Seniority Level", value: "seniority_level" },
		{ type: "Department", value: "department" },
		{ type: "Primary Industry", value: "primary_industry" },
		{ type: "Related Domains", value: "related_domains" },
		{ type: "Social Connections", value: "social_connections" },
		{ type: "URL Visited", value: "url_visited" },
		{ type: "Time on site", value: "time_on_site" },
		{ type: "DPV Code", value: "dpv_code" },
		{ type: "Visited Date", value: "visited_date" },
	];

	const excludedFields = useMemo(
		() =>
			defaultRows
				.map((row) => {
					const matchedField = CUSTOM_FIELDS.find(
						(field) => field.type === row.type,
					);
					return matchedField ? matchedField.value : "";
				})
				.filter(Boolean),
		[],
	);

	const {
		customFields,
		customFieldsList,
		handleAddField,
		handleChangeField,
		handleDeleteField,
		canAddMore,
		emailEntry,
	} = useCustomFields(CUSTOM_FIELDS, data, false, excludedFields);

	const emailsVariations = [
		{ id: 1, type: "Personal Email", value: "Personal Email" },
		{ id: 1, type: "Business Email", value: "Business Email" },
	];
	const [activeEmailVariation, setActiveEmailVariation] = useState<Row>({
		id: 1,
		type: "business_email",
		value: "Email",
	});

	useEffect(() => {
		if (!emailEntry) return;

		setActiveEmailVariation({
			id: 1,
			type: emailEntry.type,
			value: emailEntry.value,
			is_constant: false,
		});
	}, [emailEntry]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				textFieldRef.current &&
				!textFieldRef.current.contains(event.target as Node)
			) {
				// If clicked outside, reset shrink only if there is no input value
				if (selectedOption?.list_name === "") {
					setIsShrunk(false);
				}
				if (isDropdownOpen) {
					setIsDropdownOpen(false); // Close dropdown when clicking outside
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [selectedOption]);

	const resetToDefaultValues = () => {
		setLoading(false);
		setValue("1");
		setChecked(false);
		setSelectedRadioValue("");
		setAnchorEl(null);
		setSelectedOption(null);
		setlistName("");
		setShowCreateForm(false);
		setNewListName("");
		setTagName("");
		setIsShrunk(false);
		setIsDropdownOpen(false);
		setTab2Error(false);
		setIsDropdownValid(false);
		setListNameError(false);
		setTagNameError(false);
		setDeleteAnchorEl(null);
		setSelectedRowId(null);
	};

	const getGreenArrowList = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/integrations/sync/list/", {
				params: {
					service_name: "green_arrow",
				},
			});
			setGreenArrowList(response.data);
			const foundItem = response.data?.find(
				(item: any) => item.list_name === data?.list_name,
			);
			if (foundItem) {
				setSelectedOption({
					id: foundItem.id,
					list_name: foundItem.list_name,
				});
				setlistName(foundItem.list_name);
			} else {
				setSelectedOption(null);
			}
			setSelectedRadioValue(data?.type);
			setLoading(false);
		} catch (error) {}
	};
	useEffect(() => {
		if (open) {
			getGreenArrowList();
		}
	}, [open]);

	const createNewList = async () => {
		const newListResponse = await axiosInstance.post(
			"/integrations/sync/list/",
			{
				name: selectedOption?.list_name,
			},
			{
				params: {
					service_name: "green_arrow",
				},
			},
		);

		if (newListResponse.status !== 201) {
			showErrorToast("Failed to create a new list");
		}

		return newListResponse.data;
	};

	const handleSaveSync = async () => {
		setLoading(true);
		let list: GreenArrowList | null = null;

		try {
			if (selectedOption && selectedOption.id === "-1") {
				list = await createNewList();
			} else if (selectedOption) {
				list = selectedOption;
			} else {
				if (!listName) {
					showToast("Please select a valid option.");
					return;
				}
			}

			if (isEdit) {
				const response = await axiosInstance.put(
					`/data-sync/sync`,
					{
						integrations_users_sync_id: data.id,
						leads_type: selectedRadioValue,
						data_map: [activeEmailVariation, ...customFields],
						list_id: list?.id,
						list_name: list?.list_name,
					},
					{
						params: {
							service_name: "green_arrow",
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
						list_id: list?.id,
						list_name: list?.list_name,
						leads_type: selectedRadioValue,
						data_map: [activeEmailVariation, ...customFields],
					},
					{
						params: {
							service_name: "green_arrow",
						},
					},
				);
				if (response.status === 201 || response.status === 200) {
					resetToDefaultValues();
					triggerSync();
					onClose();
					showToast("Data sync updated successfully");
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

	// Handle menu open
	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		setIsShrunk(true);
		setIsDropdownOpen((prev) => !prev);
		setAnchorEl(event.currentTarget);
		setShowCreateForm(false); // Reset form when menu opens
	};

	// Handle dropdown toggle specifically when clicking on the arrow
	const handleDropdownToggle = (event: React.MouseEvent) => {
		event.stopPropagation(); // Prevent triggering the input field click
		setIsDropdownOpen((prev) => !prev);
		setAnchorEl(textFieldRef.current);
	};

	// Handle menu close
	const handleClose = () => {
		setAnchorEl(null);
		setShowCreateForm(false);
		setIsDropdownOpen(false);
		setNewListName(""); // Clear new list name when closing
	};

	const handleSelectOption = (value: GreenArrowList | string) => {
		if (value === "createNew") {
			setShowCreateForm((prev) => !prev);
			if (!showCreateForm) {
				setAnchorEl(textFieldRef.current);
			}
		} else if (isGreenArrowList(value)) {
			// Проверка, является ли value объектом GreenArrowList
			setSelectedOption({
				id: value.id,
				list_name: value.list_name,
			});
			setlistName(value.list_name);
			setIsDropdownValid(true);
			handleClose();
		} else {
			setIsDropdownValid(false);
			setSelectedOption(null);
		}
	};

	const isGreenArrowList = (value: any): value is GreenArrowList => {
		return (
			value !== null &&
			typeof value === "object" &&
			"id" in value &&
			"list_name" in value
		);
	};

	const handleSave = async () => {
		let valid = true;

		// Validate List Name
		if (newListName.trim() === "") {
			setListNameError(true);
			valid = false;
		} else {
			setListNameError(false);
		}

		// If valid, save and close
		if (valid) {
			const newGreenArrowList = { id: "-1", list_name: newListName };
			setSelectedOption(newGreenArrowList);
			setlistName(newGreenArrowList.list_name);
			if (isGreenArrowList(newGreenArrowList)) {
				setIsDropdownValid(true);
			}
			handleClose();
		}
	};

	const getButton = (tabValue: string) => {
		switch (tabValue) {
			case "1":
				return (
					<CustomButton
						variant="contained"
						onClick={handleNextTab}
						disabled={!selectedRadioValue}
					>
						Next
					</CustomButton>
				);
			case "2":
				return (
					<CustomButton
						variant="contained"
						onClick={handleNextTab}
						disabled={!isDropdownValid && !listName}
					>
						Next
					</CustomButton>
				);
			case "3":
				return (
					<CustomButton
						variant="contained"
						onClick={handleSaveSync}
						disabled={!listName || !selectedRadioValue}
					>
						Export
					</CustomButton>
				);
			default:
				return null;
		}
	};

	const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedRadioValue(event.target.value);
	};

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
						boxShadow: isEdit
							? "0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12)"
							: "none",
						bottom: 0,
						"@media (max-width: 600px)": {
							width: "100%",
						},
					},
				}}
				slotProps={{
					backdrop: {
						sx: {
							backgroundColor: "rgba(0, 0, 0, 0.1)",
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
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/pixel-sync-to-green-arrow"
							target="_blank"
							rel="noopener referrer"
							className="main-text"
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
						title="Data Sync Speed"
						content="GreenArrow standard sync speed is 500 contacts per minute."
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
									onChange={handleChangeTab}
								>
									<Tab
										label="Sync Filter"
										value="1"
										className="tab-heading"
										sx={integrationsStyle.tabHeading}
									/>
									<Tab
										label="Contact Sync"
										value="2"
										className="tab-heading"
										sx={integrationsStyle.tabHeading}
									/>
									<Tab
										label="Map data"
										value="3"
										className="tab-heading"
										sx={integrationsStyle.tabHeading}
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
									sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
								>
									<Box
										sx={{
											p: 2,
											border: "1px solid #f0f0f0",
											borderRadius: "4px",
											boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.20)",
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												mb: 3,
											}}
										>
											<Image
												src="/green_arrow-icon.svg"
												alt="green_arrow"
												height={26}
												width={32}
											/>
											<Typography variant="h6" className="first-sub-title">
												Contact sync
											</Typography>
											<Tooltip title="Sync data with list" placement="right">
												<Image
													src="/baseline-info-icon.svg"
													alt="baseline-info-icon"
													height={16}
													width={16}
												/>
											</Tooltip>
										</Box>
										<ClickAwayListener
											disabled={data}
											onClickAway={handleClose}
										>
											<Box>
												<TextField
													ref={textFieldRef}
													variant="outlined"
													value={listName}
													onClick={handleClick}
													size="small"
													disabled={data}
													fullWidth
													label={listName ? "" : "Select or Create new list"}
													InputLabelProps={{
														shrink: listName ? false : isShrunk,
														sx: {
															fontFamily: "var(--font-nunito)",
															fontSize: "12px",
															lineHeight: "16px",
															letterSpacing: "0.06px",
															top: "5px",
														},
													}}
													InputProps={{
														endAdornment: (
															<InputAdornment position="end">
																{!data ? (
																	<IconButton
																		onClick={handleDropdownToggle}
																		edge="end"
																	>
																		{isDropdownOpen ? (
																			<Image
																				src="/chevron-drop-up.svg"
																				alt="chevron-drop-up"
																				height={24}
																				width={24}
																			/>
																		) : (
																			<Image
																				src="/chevron-drop-down.svg"
																				alt="chevron-drop-down"
																				height={24}
																				width={24}
																			/>
																		)}
																	</IconButton>
																) : (
																	""
																)}
															</InputAdornment>
														),
														sx: integrationsStyle.formInput,
													}}
													sx={{
														"& input": {
															caretColor: "transparent", // Hide caret with transparent color
															fontFamily: "var(--font-nunito)",
															fontSize: "14px",
															// color: "rgba(0, 0, 0, 0.89)",
															fontWeight: "600",
															lineHeight: "normal",
														},
														"& .MuiOutlinedInput-input": {
															cursor: "default", // Prevent showing caret on input field
															top: "5px",
														},
													}}
												/>

												<Menu
													anchorEl={anchorEl}
													open={Boolean(anchorEl) && isDropdownOpen}
													onClose={handleClose}
													PaperProps={{
														sx: {
															width: anchorEl
																? `${anchorEl.clientWidth}px`
																: "538px",
															borderRadius: "4px",
															border: "1px solid #e4e4e4",
														}, // Match dropdown width to input
													}}
													sx={{}}
												>
													{/* Show "Create New List" option */}
													<MenuItem
														disabled={data}
														onClick={() => handleSelectOption("createNew")}
														sx={{
															borderBottom: showCreateForm
																? "none"
																: "1px solid #cdcdcd",
															"&:hover": {
																background: "rgba(80, 82, 178, 0.10)",
															},
														}}
													>
														<ListItemText
															primary={`+ Create new list`}
															primaryTypographyProps={{
																sx: {
																	fontFamily: "var(--font-nunito)",
																	fontSize: "14px",
																	color: showCreateForm
																		? "rgba(56, 152, 252, 1)"
																		: "#202124",
																	fontWeight: "500",
																	lineHeight: "20px",
																},
															}}
														/>
													</MenuItem>

													{/* Show Create New List form if 'showCreateForm' is true */}
													{showCreateForm && (
														<Box>
															<Box
																sx={{
																	display: "flex",
																	flexDirection: "column",
																	gap: "24px",
																	p: 2,
																	width: anchorEl
																		? `${anchorEl.clientWidth}px`
																		: "538px",
																	pt: 0,
																}}
															>
																<Box
																	sx={{
																		mt: 1, // Margin-top to separate form from menu item
																		display: "flex",
																		justifyContent: "space-between",
																		gap: "16px",
																		"@media (max-width: 600px)": {
																			flexDirection: "column",
																		},
																	}}
																>
																	<TextField
																		label="List Name"
																		variant="outlined"
																		value={newListName}
																		disabled={data}
																		onChange={(e) =>
																			setNewListName(e.target.value)
																		}
																		size="small"
																		fullWidth
																		onKeyDown={(e) => e.stopPropagation()}
																		error={listNameError}
																		helperText={
																			listNameError
																				? "List Name is required"
																				: ""
																		}
																		InputLabelProps={{
																			sx: {
																				fontFamily: "var(--font-nunito)",
																				fontSize: "12px",
																				lineHeight: "16px",
																				fontWeight: "400",
																				color: "rgba(17, 17, 19, 0.60)",
																				"&.Mui-focused": {
																					color: "rgba(56, 152, 252, 1)",
																				},
																			},
																		}}
																		InputProps={{
																			endAdornment: newListName && ( // Conditionally render close icon if input is not empty
																				<InputAdornment position="end">
																					<IconButton
																						edge="end"
																						onClick={() => setNewListName("")} // Clear the text field when clicked
																					>
																						<Image
																							src="/close-circle.svg"
																							alt="close-circle"
																							height={18}
																							width={18} // Adjust the size as needed
																						/>
																					</IconButton>
																				</InputAdornment>
																			),
																			sx: {
																				"&.MuiOutlinedInput-root": {
																					height: "32px",
																					"& .MuiOutlinedInput-input": {
																						padding: "5px 16px 4px 16px",
																						fontFamily: "var(--font-roboto)",
																						color: "#202124",
																						fontSize: "14px",
																						fontWeight: "400",
																						lineHeight: "20px",
																					},
																					"& .MuiOutlinedInput-notchedOutline":
																						{
																							borderColor: "#A3B0C2",
																						},
																					"&:hover .MuiOutlinedInput-notchedOutline":
																						{
																							borderColor: "#A3B0C2",
																						},
																					"&.Mui-focused .MuiOutlinedInput-notchedOutline":
																						{
																							borderColor:
																								"rgba(56, 152, 252, 1)",
																						},
																				},
																				"&+.MuiFormHelperText-root": {
																					marginLeft: "0",
																				},
																			},
																		}}
																	/>
																</Box>
																<Box sx={{ textAlign: "right" }}>
																	<Button
																		variant="contained"
																		onClick={handleSave}
																		disabled={
																			listNameError ||
																			tagNameError ||
																			!newListName
																		}
																		sx={{
																			borderRadius: "4px",
																			border: "1px solid rgba(56, 152, 252, 1)",
																			background: "#fff",
																			boxShadow:
																				"0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
																			fontFamily: "var(--font-nunito)",
																			fontSize: "14px",
																			fontWeight: "600",
																			lineHeight: "20px",
																			color: "rgba(56, 152, 252, 1)",
																			textTransform: "none",
																			padding: "4px 22px",
																			"&:hover": {
																				background: "transparent",
																			},
																			"&.Mui-disabled": {
																				background: "transparent",
																				color: "rgba(56, 152, 252, 1)",
																			},
																		}}
																	>
																		Save
																	</Button>
																</Box>
															</Box>

															{/* Add a Divider to separate form from options */}
															<Divider sx={{ borderColor: "#cdcdcd" }} />
														</Box>
													)}

													{/* Show static options */}
													{greenArrowList &&
														greenArrowList.map((greenArrow, option) => (
															<MenuItem
																key={greenArrow.id}
																onClick={() => handleSelectOption(greenArrow)}
																sx={{
																	"&:hover": {
																		background: "rgba(80, 82, 178, 0.10)",
																	},
																}}
															>
																<ListItemText
																	primary={greenArrow.list_name}
																	primaryTypographyProps={{
																		sx: {
																			fontFamily: "var(--font-nunito)",
																			fontSize: "14px",
																			color: "#202124",
																			fontWeight: "500",
																			lineHeight: "20px",
																		},
																	}}
																/>
															</MenuItem>
														))}
												</Menu>
											</Box>
										</ClickAwayListener>
									</Box>
								</Box>
							</TabPanel>
							<TabPanel value="3" sx={{ p: 0 }}>
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
										{selectedOption?.list_name && (
											<Typography
												variant="h6"
												sx={{
													background: "#EDEDF7",
													borderRadius: "3px",
													fontFamily: "var(--font-roboto)",
													fontSize: "12px",
													fontWeight: "400",
													color: "#5f6368",
													padding: "2px 4px",
													lineHeight: "16px",
												}}
											>
												{selectedOption.list_name}
											</Typography>
										)}
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
											<LogoSmall height={22} width={34} />
										</Grid>
										<Grid
											item
											xs="auto"
											sm={1}
											sx={{
												"@media (max-width:599px)": {
													minWidth: "50px",
												},
											}}
										>
											&nbsp;
										</Grid>
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
											<Image
												src="/green_arrow-icon.svg"
												alt="green_arrow"
												height={20}
												width={30}
											/>
										</Grid>
										<Grid item xs="auto" sm={1}>
											&nbsp;
										</Grid>
									</Grid>

									<Box sx={{ mb: 2 }}>
										<Grid
											container
											spacing={2}
											alignItems="center"
											sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
										>
											{/* Left Input Field */}
											<Grid item xs={5} sm={5}>
												<FormControl fullWidth sx={{ height: "36px" }}>
													<Select
														value={
															activeEmailVariation.type === "personal_emails"
																? "Personal Email"
																: "Business Email"
														}
														onChange={(e) => {
															const type =
																e.target.value === "Personal Email"
																	? "personal_emails"
																	: "business_email";
															setActiveEmailVariation({
																id: 1,
																type: type,
																value: "Email",
															});
														}}
														displayEmpty
														inputProps={{
															sx: dataSyncStyles.formControlInputStyles,
														}}
														sx={dataSyncStyles.formControlStyles}
													>
														{emailsVariations.map(
															(item: Row, index: number) => (
																<MenuItem key={index} value={item.value}>
																	{item.value}
																</MenuItem>
															),
														)}
													</Select>
												</FormControl>
											</Grid>

											{/* Middle Icon Toggle (Right Arrow or Close Icon) */}
											<Grid
												item
												xs={1}
												sm={1}
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

											<Grid item xs={5} sm={5}>
												<TextField
													fullWidth
													variant="outlined"
													value={"Email"}
													disabled={true}
													InputLabelProps={{
														sx: dataSyncStyles.textFieldInputLabelStyles,
													}}
													InputProps={{
														sx: dataSyncStyles.textFieldInputStyles,
													}}
												/>
											</Grid>

											{/* Delete Icon */}
											<Grid
												item
												xs={1}
												sm={1}
												container
												justifyContent="center"
											/>
										</Grid>
									</Box>

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
															sx: dataSyncStyles.textFieldInputLabelStyles,
														}}
														InputProps={{
															sx: dataSyncStyles.textFieldInputStyles,
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
															sx: dataSyncStyles.textFieldInputLabelStyles,
														}}
														InputProps={{
															sx: dataSyncStyles.textFieldInputStyles,
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
									<Box>
										{customFields.map((field, index) => (
											<CustomFieldRow
												key={index}
												field={field}
												index={index}
												customFields={customFields}
												customFieldsList={customFieldsList}
												handleChangeField={handleChangeField}
												handleDeleteField={handleDeleteField}
											/>
										))}

										<Box
											sx={{
												display: "flex",
												justifyContent: "flex-end",
												mb: 6,
												mr: 6,
											}}
										>
											{canAddMore && (
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
											)}
										</Box>
									</Box>
								</Box>
							</TabPanel>
						</TabContext>
						{/* Button based on selected tab */}
					</Box>
					<Box
						sx={{
							px: 2,
							py: 2,
							border: "1px solid #e4e4e4",
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
export default GreenArrowDataSync;
