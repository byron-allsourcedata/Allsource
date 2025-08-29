import {
	Box,
	Typography,
	TextField,
	InputAdornment,
	IconButton,
	Menu,
	MenuItem,
	ListItemText,
	ClickAwayListener,
	Button,
	Divider,
	Tooltip,
} from "@mui/material";
import { useRef, useState, type FC, type ReactNode } from "react";

import Image from "next/image";
import {
	googleConnectStyles,
	type ChannelList,
	type GoogleAdsPopupData,
} from "../GoogleAdsGenericSync";
import { Column } from "@/components/Column";
import { useFieldValue } from "@/components/premium-sources/hooks/useFieldValue";
import { GoogleAdsDropdown } from "./GoogleAdsDropdown";
import { GoogleAdsAccountMenu } from "./GoogleAdsAccountMenu";
import { GoogleAdsListDropdown } from "./GoogleAdsListDropdown";

type GoogleListSchema = {
	list_id: string;
	list_name: string;
};

export type Customer = {
	customer_id: string;
	customer_name: string;
};

type Props = {
	inputListName: string | undefined;
	handleClick: () => void;
	isShrunk: boolean;
	data: GoogleAdsPopupData;
	handleDropdownToggle: () => void;
	isDropdownOpen: boolean;
	handleSelectOption: (list: GoogleListSchema | "createNew") => void;
	googleList: GoogleListSchema[];
	handleSave: (listName: string) => void;
	listNameError: boolean;
	newListName: string | undefined;
	setNewListName: React.Dispatch<React.SetStateAction<string>>;
	listNameErrorMessage?: string;
	handleNewListChange: (list: React.ChangeEvent<HTMLInputElement>) => void;
	showCreateForm: boolean;
	handleClose: () => void;
	anchorEl: null | HTMLElement;
	textFieldRef: React.RefObject<HTMLDivElement>;
	customersInfo?: Customer[];
	handleSelectAdAccount: (account: Customer) => void;

	adAccountDropdown: {
		selectedAccount: Customer | null;
		accounts: Customer[];
		isOpen: boolean;
		onClick: () => void;
		toggle: () => void;
		onClose: () => void;
		onSelect: (account: Customer) => void;
	};
	adListDropdown: {
		selectedList: ChannelList | null;
		lists: ChannelList[];
		isOpen: boolean;
		onClick: () => void;
		toggle: () => void;
		onClose: () => void;
		onSelect: (list: ChannelList) => void;
	};
};

export const GoogleAdsListPicker: FC<Props> = ({
	handleSelectAdAccount,
	textFieldRef,
	showCreateForm,
	anchorEl,
	inputListName,
	isShrunk,
	data,
	handleDropdownToggle,
	isDropdownOpen,
	handleSelectOption,
	handleSave,
	listNameError,
	newListName,
	googleList,
	handleClose,
	setNewListName,
	handleNewListChange,
	listNameErrorMessage,
	adAccountDropdown: {
		selectedAccount,
		accounts,
		isOpen,
		onClick,
		toggle,
		onClose,
		onSelect,
	},
	adListDropdown: {
		selectedList,
		lists,
		isOpen: isListOpen,
		onClick: onListClick,
		toggle: toggleList,
		onClose: onListClose,
		onSelect: onListSelect,
	},
}) => {
	// const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
	// 	setIsShrunk(true);
	// 	setIsDropdownOpen((prev) => !prev);
	// 	setAnchorEl(event.currentTarget);
	// 	setShowCreateForm(false);
	// };

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
			}}
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
					<Image src="/google-ads.svg" alt="webhook" height={26} width={32} />
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
				<GoogleAdsAccountDropdown
					selectedAccount={selectedAccount}
					accounts={accounts}
					isOpen={isOpen}
					onClick={onClick}
					toggle={toggle}
					onClose={onClose}
					onSelect={onSelect}
					label="Select An Account"
				/>
				<ClickAwayListener onClickAway={() => {}}>
					<Column>
						<GoogleAdsListDropdown
							disableAddList={!!data?.name}
							label="Select or Create new list"
							shrink={inputListName ? false : isShrunk}
							selectedList={selectedList}
							lists={lists}
							isOpen={isListOpen}
							onClick={onListClick}
							toggle={toggleList}
							onClose={onListClose}
							onSelect={onListSelect}
							showCreateForm={showCreateForm}
							onSaveNewList={handleSave}
							onAddNewList={() => {
								handleSelectOption("createNew");
							}}
						/>
					</Column>
				</ClickAwayListener>
			</Box>
		</Box>
	);
};

type GoogleAdsAccountDropdownProps = {
	selectedAccount: Customer | null;
	accounts: Customer[];
	isOpen: boolean;
	onClick: () => void;
	toggle: () => void;
	onClose: () => void;
	onSelect: (account: Customer) => void;
	label?: string;
	disabled?: boolean;
	shrink?: boolean;
};

export const GoogleAdsAccountDropdown: FC<GoogleAdsAccountDropdownProps> = ({
	selectedAccount,
	accounts,
	isOpen,
	onClick,
	toggle,
	onClose,
	onSelect,
	label = "",
}) => {
	const anchorRef = useRef<HTMLDivElement>(null);

	const selectedAccountName = selectedAccount?.customer_name;

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "24px",
			}}
		>
			<TextField
				ref={anchorRef}
				variant="outlined"
				value={selectedAccountName}
				onClick={onClick}
				size="small"
				fullWidth
				label={selectedAccountName ? "" : label}
				InputLabelProps={{
					// shrink: isShrunk || inputCustomerName !== "",
					sx: {
						fontFamily: "var(--font-nunito)",
						fontSize: "12px",
						lineHeight: "16px",
						color: "rgba(17, 17, 19, 0.60)",
						letterSpacing: "0.06px",
						top: "5px",
						"&.Mui-focused": {
							color: "rgba(56, 152, 252, 1)",
						},
					},
				}}
				InputProps={{
					endAdornment: (
						<InputAdornment position="end">
							<IconButton onClick={toggle} edge="end">
								{isOpen ? (
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
						</InputAdornment>
					),
					// sx: metaStyles.formInput,
				}}
				sx={{
					"& input": {
						caretColor: "transparent",
						fontFamily: "var(--font-nunito)",
						fontSize: "14px",
						color: "rgba(0, 0, 0, 0.89)",
						fontWeight: "600",
						lineHeight: "normal",
					},
					"& .MuiOutlinedInput-input": {
						cursor: "default",
						top: "5px",
					},
					marginBottom: "24px",
				}}
			/>
			<GoogleAdsAccountMenu
				open={isOpen}
				anchor={anchorRef?.current}
				accounts={accounts ?? []}
				onSelect={onSelect}
				onClose={onClose}
			/>
		</Box>
	);
};

type GoogleAdsCreateListProps = {
	error?: string;
	onSave: (listName: string) => void;
};

export const GoogleAdsListCreator: FC<GoogleAdsCreateListProps> = ({
	error,
	onSave,
}) => {
	const [listNameField, setListName] = useFieldValue("");
	const anchorEl = useRef<HTMLDivElement | null>(null);
	const listNameError = error !== undefined;
	const listNameErrorMessage = error;

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "24px",
					p: 2,
					width: anchorEl.current
						? `${anchorEl.current.clientWidth}px`
						: undefined,
					pt: 0,
				}}
			>
				<Box
					sx={{
						mt: 1,
						display: "flex",
						justifyContent: "space-between",
						gap: "16px",
						"@media (max-width: 600px)": {
							flexDirection: "column",
						},
					}}
				>
					<TextField
						{...listNameField}
						label="List Name"
						variant="outlined"
						size="small"
						fullWidth
						onKeyDown={(e) => e.stopPropagation()}
						error={listNameError}
						helperText={listNameErrorMessage}
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
							endAdornment: listNameField.value && (
								<InputAdornment position="end">
									<IconButton edge="end" onClick={() => setListName("")}>
										<Image
											src="/close-circle.svg"
											alt="close-circle"
											height={18}
											width={18}
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
						}}
					/>
				</Box>
				<Box sx={{ textAlign: "right" }}>
					<Button
						variant="contained"
						onClick={() => onSave(listNameField.value)}
						disabled={listNameError || !listNameField.value}
						sx={{
							borderRadius: "4px",
							border: "1px solid rgba(56, 152, 252, 1)",
							background: "#fff",
							boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
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
			<Divider sx={{ borderColor: "#cdcdcd" }} />
		</Box>
	);
};

type GoogleAdsCreateListMenuItemProps = {
	disabled: boolean;
	showCreateForm: boolean;
	onSelect: () => void;
};

export const GoogleAdsCreateListMenuItem: FC<
	GoogleAdsCreateListMenuItemProps
> = ({
	disabled, // !!data?.name
	showCreateForm, //handleSelectOption("createNew")
	onSelect,
}) => {
	return (
		<MenuItem
			disabled={disabled}
			onClick={onSelect}
			sx={{
				borderBottom: showCreateForm ? "none" : "1px solid #cdcdcd",
				"&:hover": {
					background: "rgba(80, 82, 178, 0.10)",
				},
			}}
		>
			<ListItemText
				primary={"+ Create new list"}
				primaryTypographyProps={{
					sx: {
						fontFamily: "var(--font-nunito)",
						fontSize: "14px",
						color: showCreateForm ? "rgba(56, 152, 252, 1)" : "#202124",
						fontWeight: "500",
						lineHeight: "20px",
					},
				}}
			/>
		</MenuItem>
	);
};
