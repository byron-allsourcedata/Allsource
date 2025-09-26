import React, { useState, useRef, useEffect } from "react";
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	TextField,
	Button,
	Link,
	Tab,
	Grid,
	LinearProgress,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Image from "next/image";
import CloseIcon from "@mui/icons-material/Close";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
	showErrorToast,
	showToast,
} from "../../../../components/ToastNotification";
import { useIntegrationContext } from "@/context/IntegrationContext";
import UserTip from "@/components/ui/tips/TipInsideDrawer";
import { LogoSmall } from "@/components/ui/Logo";
import { SyncFilter } from "./sync/SyncFilter";
import { GoogleAdsListPicker } from "./sync/GoogleAdsListPicker";
import { useDropdown } from "./sync/useDropdown";
import { useGoogleAdsLists } from "./sync/useGoogleAdsLists";
import { useCreateGoogleAdsPremiumSync } from "./sync/requests";

export const googleConnectStyles = {
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
			"&:hover .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(56, 152, 252, 1)",
			},
		},
		"&+.MuiFormHelperText-root": {
			marginLeft: "0",
		},
	},
};

export type GoogleAdsPopupData = {
	id?: string;
	list_id?: string;
	name?: string;
	type?: string;
	customer_id?: string;
};

interface ConnectGoogleAdsPopupProps {
	open: boolean;
	onClose: () => void;
	onCloseCreateSync?: () => void;
	data: GoogleAdsPopupData;
	isEdit: boolean;
	user_integration_id: number;
	premium_source_id: string;
}

export type ChannelList = {
	list_id: string;
	list_name: string;
};

type Customers = {
	customer_id: string;
	customer_name: string;
};

export const GoogleAdsGenericSync: React.FC<ConnectGoogleAdsPopupProps> = ({
	open,
	onClose,
	onCloseCreateSync,
	data,
	isEdit,
	user_integration_id,
	premium_source_id,
}) => {
	const createSync = useCreateGoogleAdsPremiumSync();
	const { triggerSync } = useIntegrationContext();
	const [loading, setLoading] = useState(false);
	const [value, setValue] = React.useState("1");
	const [selectedRadioValue, setSelectedRadioValue] = useState(data?.type);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
	const [newListName, setNewListName] = useState<string>(data?.name ?? "");
	const [isShrunk, setIsShrunk] = useState<boolean>(false);
	const textFieldRef = useRef<HTMLDivElement>(null);
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [tab2Error, setTab2Error] = useState(false);
	const [isDropdownValid, setIsDropdownValid] = useState(false);
	const [listNameError, setListNameError] = useState(false);
	const textFieldRefAdAccount = useRef<HTMLDivElement>(null);
	const [notAdsUser, setNotAdsUser] = useState<boolean>(false);
	const [anchorElAdAccount, setAnchorElAdAccount] =
		useState<null | HTMLElement>(null);

	const adAccountDropdown = useDropdown();
	const adListDropdown = useDropdown();

	const googleAdLists = useGoogleAdsLists();
	const { fetchedLists: googleList, setLists: setGoogleAdsList } =
		googleAdLists;

	const { selectedList: selectedOption, setSelectedList: setSelectedOption } =
		googleAdLists;

	const [inputCustomerName, setInputCustomerName] = useState(
		data?.customer_id ?? "",
	);
	const [inputListName, setInputListName] = useState(data?.name ?? "");

	const [customersInfo, setCustomersInfo] = useState<Customers[]>([
		{
			customer_id: data?.customer_id ?? "",
			customer_name: data?.customer_id ?? "",
		},
	]);

	const [selectedAccountId, setSelectedAccountId] = useState<string>(
		data?.customer_id ?? "",
	);
	const [listNameErrorMessage, setListNameErrorMessage] = useState("");
	const [savedList, setSavedList] = useState<ChannelList | null>({
		list_id: data?.list_id ?? "",
		list_name: data?.name ?? "",
	});

	const selectedAdsAccount =
		customersInfo.find(
			(account) => account.customer_id === selectedAccountId,
		) ?? null;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				textFieldRef.current &&
				!textFieldRef.current.contains(event.target as Node)
			) {
				if (selectedOption?.list_name === "") {
					setIsShrunk(false);
				}
				if (isDropdownOpen) {
					setIsDropdownOpen(false);
				}
			}
		};
		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [selectedOption]);

	const handleCloseAdAccount = () => {
		setAnchorElAdAccount(null);
		adAccountDropdown.close();
	};

	useEffect(() => {
		if (open) {
			return;
		}
		setLoading(false);
		setValue("1");
		setSelectedRadioValue("");
		setAnchorEl(null);
		setSelectedOption(null);
		setInputListName("");
		setShowCreateForm(false);
		setNewListName("");
		setIsShrunk(false);
		setIsDropdownOpen(false);
		setTab2Error(false);
		setIsDropdownValid(false);
		setListNameError(false);
		setAnchorElAdAccount(null);
		adAccountDropdown.close();
	}, [open]);

	const getGoogleAdsList = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("integrations/get-channels", {
				params: {
					customer_id: selectedAccountId,
					service_name: "google_ads",
				},
			});
			setInputListName("");
			setGoogleAdsList(response.data.user_lists || []);
			if (response.data.status !== "SUCCESS") {
				showErrorToast(response.data.message);
			}
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (open && selectedAccountId && !data?.name) {
			getGoogleAdsList();
		}
	}, [open, selectedAccountId]);

	const getCustomersInfo = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get(
				"integrations/sync/ad_accounts",
				{
					params: {
						service_name: "google_ads",
					},
				},
			);
			if (response.data.status === "SUCCESS") {
				setCustomersInfo(response.data.customers || []);
			} else if (response.data.status === "NOT_ADS_USER") {
				setNotAdsUser(true);
			} else {
				showErrorToast(response.data.message);
			}
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (open && !data?.customer_id) {
			getCustomersInfo();
		}
	}, [open]);

	const createNewList = async () => {
		try {
			setLoading(true);
			const newListResponse = await axiosInstance.post(
				"/integrations/sync/list/",
				{
					name: selectedOption?.list_name,
					customer_id: String(selectedAccountId),
				},
				{
					params: {
						service_name: "google_ads",
					},
				},
			);

			if (newListResponse.data.status !== "SUCCESS") {
				showErrorToast(newListResponse.data.message);
			}

			return newListResponse.data.channel;
		} finally {
			setLoading(false);
		}
	};

	const metaStyles = {
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
				"&:hover .MuiOutlinedInput-notchedOutline": {
					borderColor: "rgba(56, 152, 252, 1)",
				},
			},
			"&+.MuiFormHelperText-root": {
				marginLeft: "0",
			},
		},
	};

	const handleSaveList = async () => {
		setLoading(true);
		try {
			let list: ChannelList | null = null;

			if (selectedOption && selectedOption.list_id === "-1") {
				list = await createNewList();
			} else if (selectedOption) {
				list = selectedOption;
			} else {
				showToast("Please select a valid option.");
				return;
			}
			if (validateTab2()) {
				setValue((prevValue) => String(Number(prevValue) + 1));
			}
			if (list) {
				setSavedList(list);
				setGoogleAdsList((prev) => [...(prev || []), list]);
				showToast("List saved successfully");
			}
		} catch (error) {
			console.error("Error saving list:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSaveSync = async () => {
		const selectedList = googleAdLists.selectedList;
		if (!selectedList) {
			showToast("No list data found. Please save the list first.");
			return;
		}

		setLoading(true);
		try {
			const response = await createSync.request({
				customer_id: String(selectedAccountId),
				list_id: String(selectedList.list_id),
				list_name: selectedList.list_name,
				premium_source_id: premium_source_id,
				user_integration_id: user_integration_id,
			});

			if (response.status === 201 || response.status === 200) {
				showToast("Data sync created successfully");
				triggerSync();
				onClose();
			}

			handlePopupClose();
			if (onCloseCreateSync) {
				onCloseCreateSync();
			}
		} catch (error) {
			console.error("Error during sync:", error);
			showErrorToast("Error while creating sync.");
		} finally {
			setLoading(false);
		}
	};

	const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
		setIsShrunk(true);
		setIsDropdownOpen((prev) => !prev);
		setAnchorEl(event.currentTarget);
		setShowCreateForm(false);
	};

	const handleDropdownToggle = (event: React.MouseEvent) => {
		event.stopPropagation();
		setIsDropdownOpen((prev) => !prev);
		setAnchorEl(textFieldRef.current);
	};

	const handleClose = () => {
		setAnchorEl(null);
		setAnchorElAdAccount(null);
		adAccountDropdown.close();
		adListDropdown.close();
		setShowCreateForm(false);
		setIsDropdownOpen(false);
	};

	const handleSelectOption = (value: ChannelList | string) => {
		if (value === "createNew") {
			setShowCreateForm((prev) => !prev);
			if (!showCreateForm) {
				setAnchorEl(textFieldRef.current);
			}
		} else if (isKlaviyoList(value)) {
			setSelectedOption({
				list_id: value.list_id,
				list_name: value.list_name,
			});
			setInputListName(value.list_name);
			setIsDropdownValid(true);
			handleClose();
		} else {
			setIsDropdownValid(false);
			setSelectedOption(null);
		}
	};

	const isKlaviyoList = (value: any): value is ChannelList => {
		return (
			value !== null &&
			typeof value === "object" &&
			"list_id" in value &&
			"list_name" in value
		);
	};

	const handleAddNewList = async (newListName: string) => {
		let valid = true;

		if (newListName.trim() === "") {
			setListNameError(true);
			valid = false;
		} else {
			setListNameError(false);
		}

		if (valid) {
			const newSlackList = { list_id: "-1", list_name: newListName };
			googleAdLists.setNewList(newSlackList);
			googleAdLists.setSelectedList(newSlackList);
			if (isKlaviyoList(newSlackList)) {
				setIsDropdownValid(true);
			}
			handleClose();
		}
	};

	const getButton = (tabValue: string) => {
		switch (tabValue) {
			case "1":
				return (
					<Button
						variant="contained"
						onClick={handleNextTab}
						disabled={!googleAdLists.selectedList}
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
							"&:hover": {
								backgroundColor: "rgba(56, 152, 252, 1)",
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
						disabled={!googleAdLists.selectedList}
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
							"&:hover": {
								backgroundColor: "rgba(56, 152, 252, 1)",
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
		{ id: 1, type: "Email", value: "Hashed Email" },
		// { id: 2, type: "Full name", value: "Full name" },
		// { id: 3, type: "Phone", value: "Phone" },
		// { id: 4, type: "Address", value: "Address" },
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

	const handleSelectAdAccount = async (value: Customers) => {
		setInputCustomerName(value.customer_name);
		setSelectedAccountId(value.customer_id);
		handleClose();
	};

	const handleClickAdAccount = (event: React.MouseEvent<HTMLInputElement>) => {
		setIsShrunk(true);
		setAnchorElAdAccount(event.currentTarget);
		adAccountDropdown.open();
	};

	const handleDropdownToggleAdAccount = (event: React.MouseEvent) => {
		event.stopPropagation();
		adAccountDropdown.toggle();
		setAnchorElAdAccount(textFieldRefAdAccount.current);
	};

	const validateTab2 = () => {
		if (selectedRadioValue === null) {
			setTab2Error(true);
			return false;
		}
		setTab2Error(false);
		return true;
	};

	const handleNewListChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (googleList?.some((list) => list.list_name === value)) {
			setListNameError(true);
			setListNameErrorMessage("List name must be unique");
		} else {
			setListNameError(false);
			setListNameErrorMessage("");
		}
		setNewListName(value);

		if (!value) {
			setListNameError(true);
			setListNameErrorMessage("List name is required");
		}
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

	const handleChangeTab = (event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	const handlePopupClose = () => {
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
						bottom: 0,
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
							backgroundColor: "rgba(0, 0, 0, 0)",
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
						Connect to GoogleAds
					</Typography>
					<Box
						sx={{
							display: "flex",
							gap: "32px",
							"@media (max-width: 600px)": { gap: "8px" },
						}}
					>
						<Link
							href="https://allsourceio.zohodesk.com/portal/en/kb/articles/pixel-sync-to-googleads"
							target="_blank"
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
						content="GoogleAds standard sync speed is 500 contacts per minute."
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
						{notAdsUser ? (
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
									The Google account that generated the OAuth access tokens is
									not associated with any Ads accounts.
									<br />
									Please <strong>create a new account</strong> or add the Google
									account to an existing Ads account.
								</Typography>

								<Typography
									variant="body2"
									sx={{ color: "rgba(56, 152, 252, 1)", fontWeight: "bold" }}
								>
									<Link
										href="https://ads.google.com/signup"
										target="_blank"
										className="main-text"
										sx={{
											fontSize: "14px",
											fontWeight: "600",
											lineHeight: "20px",
											color: "rgba(56, 152, 252, 1)",
											textDecorationColor: "rgba(56, 152, 252, 1)",
										}}
									>
										Register for Google Ads
									</Link>
								</Typography>
							</Box>
						) : (
							<TabContext value={value}>
								<Box sx={{ pb: 4 }}>
									<TabList
										centered
										aria-label="Connect to GoogleAds Tabs"
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
										{/* <Tab
											label="Sync Filter"
											value="1"
											className="tab-heading"
											sx={googleConnectStyles.tabHeading}
										/> */}
										<Tab
											label="Contact Sync"
											value="1"
											className="tab-heading"
											sx={googleConnectStyles.tabHeading}
										/>
										<Tab
											label="Map data"
											value="2"
											className="tab-heading"
											sx={googleConnectStyles.tabHeading}
										/>
									</TabList>
								</Box>
								<TabPanel value="1" sx={{ p: 0 }}>
									{/* <SyncFilter
										showError={tab2Error}
										selectedRadioValue={selectedRadioValue}
										handleRadioChange={handleRadioChange}
									/> */}
									<GoogleAdsListPicker
										inputListName={undefined}
										handleClick={() => {}}
										isShrunk={false}
										data={data}
										handleDropdownToggle={() => {}}
										isDropdownOpen={false}
										handleSelectOption={handleSelectOption}
										googleList={[]}
										handleSave={handleAddNewList}
										listNameError={false}
										newListName={undefined}
										setNewListName={setNewListName}
										handleNewListChange={handleNewListChange}
										showCreateForm={showCreateForm}
										handleClose={handleClose}
										anchorEl={null}
										textFieldRef={textFieldRef}
										handleSelectAdAccount={handleSelectAdAccount}
										adAccountDropdown={{
											selectedAccount: selectedAdsAccount,
											accounts: customersInfo,
											isOpen: adAccountDropdown.isDropdownOpen,
											onClick: adAccountDropdown.open,
											toggle: adAccountDropdown.toggle,
											onClose: adAccountDropdown.close,
											onSelect: handleSelectAdAccount,
										}}
										adListDropdown={{
											selectedList: googleAdLists.selectedList,
											lists: googleAdLists.fetchedLists ?? [],
											isOpen: adListDropdown.isDropdownOpen,
											onClick: adListDropdown.open,
											toggle: adListDropdown.toggle,
											onClose: adListDropdown.close,
											onSelect: handleSelectOption,
										}}
									/>
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
											{inputListName && (
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
													{inputListName}
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
												<LogoSmall height={25} width={24} />
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
													src="/google-ads.svg"
													alt="googleAds"
													height={25}
													width={24}
												/>
											</Grid>
											<Grid item xs="auto" sm={1}>
												&nbsp;
											</Grid>
										</Grid>

										{defaultRows.map((row, index) => (
											<Box key={row.id} sx={{ mb: 2 }}>
												<Grid
													container
													spacing={2}
													alignItems="center"
													sx={{ flexWrap: { xs: "nowrap", sm: "wrap" } }}
												>
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
													</Grid>
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
																	width={18}
																/>
															) : (
																<Image
																	src="/close-circle.svg"
																	alt="close-circle"
																	height={18}
																	width={18}
																/>
															)
														) : (
															<Image
																src="/chevron-right-purple.svg"
																alt="chevron-right-purple"
																height={18}
																width={18}
															/>
														)}
													</Grid>
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
													</Grid>
												</Grid>
											</Box>
										))}
									</Box>
								</TabPanel>
							</TabContext>
						)}
					</Box>
					{!notAdsUser && (
						<Box
							sx={{
								px: 2,
								py: 2,
								width: "100%",
								borderTop: "1px solid #e4e4e4",
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
					)}
				</Box>
			</Drawer>
		</>
	);
};
