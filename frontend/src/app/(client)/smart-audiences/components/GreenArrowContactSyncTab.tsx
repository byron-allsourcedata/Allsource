import {
	Box,
	IconButton,
	ClickAwayListener,
	Button,
	ListItemText,
	TextField,
	InputAdornment,
	MenuItem,
	Menu,
	Divider,
} from "@mui/material";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { showErrorToast } from "@/components/ToastNotification";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { IntegrationConnectStyles } from "@/app/(client)/integrations/styles";
import { CustomButton } from "@/components/ui";
import { popupStyle } from "@/app/(client)/lookalikes/components/BadLookalikeErrorModal";

type KlaviyoList = {
	id: string;
	list_name: string;
};

interface MailchimpContactSyncTabProps {
	setIsloading: (state: boolean) => void;
	selectedOption: KlaviyoList | null;
	setSelectedOption: (state: KlaviyoList | null) => void;
	list: KlaviyoList[];
}

const MailchimpContactSyncTab: React.FC<MailchimpContactSyncTabProps> = ({
	setIsloading,
	selectedOption,
	setSelectedOption,
	list,
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const [newListName, setNewListName] = useState<string>("");
	const [isCreatedNewList, setIsCreatedNewList] = useState<boolean>(false);
	const [showCreateFormMailchimp, setShowCreateFormMailchimp] =
		useState<boolean>(false);
	const [listNameError, setListNameError] = useState(false);
	const [isShrunkMailchimp, setIsShrunkMailchimp] = useState<boolean>(false);
	const [anchorElMailchimp, setAnchorElMailchimp] =
		useState<null | HTMLElement>(null);
	const textFieldRefMailchimp = useRef<HTMLDivElement>(null);
	const [isDropdownValid, setIsDropdownValid] = useState(false);

	const handleSelectOptionMailchimp = (value: KlaviyoList | string) => {
		console.log(value);
		if (value === "createNew") {
			setShowCreateFormMailchimp((prev) => !prev);
			if (!showCreateFormMailchimp) {
				setAnchorElMailchimp(textFieldRefMailchimp.current);
			}
		} else if (isKlaviyoList(value)) {
			setSelectedOption({
				id: value.id,
				list_name: value.list_name,
			});
			setIsDropdownValid(true);
			handleCloseSelectMailchimp();
		} else {
			setIsDropdownValid(false);
			setSelectedOption(null);
		}
	};

	const handleClickMailchimp = (event: React.MouseEvent<HTMLInputElement>) => {
		setIsShrunkMailchimp(true);
		setIsDropdownOpen((prev) => !prev);
		setAnchorElMailchimp(event.currentTarget);
		setShowCreateFormMailchimp(false);
		// console.log(event.currentTarget)
		// setSelectedOption()
	};

	const handleCloseSelectMailchimp = () => {
		setAnchorElMailchimp(null);
		setShowCreateFormMailchimp(false);
		setIsDropdownOpen(false);
		setNewListName("");
	};

	const isKlaviyoList = (value: KlaviyoList | string): value is KlaviyoList => {
		return (
			value !== null &&
			typeof value === "object" &&
			"id" in value &&
			"list_name" in value
		);
	};

	const handleDropdownToggleMailchimp = (event: React.MouseEvent) => {
		event.stopPropagation();
		setIsDropdownOpen((prev) => !prev);
		setAnchorElMailchimp(textFieldRefMailchimp.current);
	};

	const createNewListMailchimp = async (name: string) => {
		try {
			setIsloading(true);
			const newListResponse = await axiosInstance.post(
				"/integrations/sync/list/",
				{
					name,
				},
				{
					params: {
						service_name: "green_arrow",
					},
				},
			);
			if (
				newListResponse.status !== 201 ||
				newListResponse.data?.status === "CREATED_IS_FAILED"
			) {
				showErrorToast("Failed to create a new list");
				return;
			}
			const data = newListResponse.data;
			setNewListName(newListName);
			setIsCreatedNewList(true);
			setSelectedOption(data);
			setIsDropdownValid(true);
		} catch {
		} finally {
			setIsloading(false);
		}
	};

	const handleSave = async () => {
		let valid = true;
		if (newListName.trim() === "") {
			setListNameError(true);
			valid = false;
		} else {
			setListNameError(false);
		}

		if (valid) {
			createNewListMailchimp(newListName);
			handleCloseSelectMailchimp();
		}
	};

	const [isOpenSelectExistingList, setOpenSelectExistingList] =
		useState<boolean>(false);
	const [isOpenCreateList, setOpenCreateList] = useState<boolean>(true);
	const [isShowCreateNewListButton, setShowCreateNewListButton] =
		useState<boolean>(false);
	const [isShowSelectExistingListButton, setShowSelectExistingListButton] =
		useState<boolean>(true);

	return (
		<>
			{/* <ClickAwayListener onClickAway={handleCloseSelectMailchimp}>
			<Box>
				<TextField
					ref={textFieldRefMailchimp}
					variant="outlined"
					value={selectedOption?.list_name || ""}
					onClick={handleClickMailchimp}
					size="small"
					fullWidth
					label={selectedOption ? "" : "Select or Create new list"}
					InputLabelProps={{
						shrink: selectedOption ? false : isShrunkMailchimp,
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
								<IconButton onClick={handleDropdownToggleMailchimp} edge="end">
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
							</InputAdornment>
						),
						sx: IntegrationConnectStyles.formInput,
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
					}}
				/>

				<Menu
					anchorEl={anchorElMailchimp}
					open={Boolean(anchorElMailchimp) && isDropdownOpen}
					onClose={handleCloseSelectMailchimp}
					PaperProps={{
						sx: {
							width: anchorElMailchimp
								? `${anchorElMailchimp.clientWidth}px`
								: "538px",
							borderRadius: "4px",
							border: "1px solid #e4e4e4",
						},
					}}
				>
					<MenuItem
						key={1}
						onClick={() => {
							handleSelectOptionMailchimp("createNew");
							setSelectedOption(null);
						}}
						sx={{
							borderBottom: showCreateFormMailchimp
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
									color: showCreateFormMailchimp
										? "rgba(56, 152, 252, 1)"
										: "#202124",
									fontWeight: "500",
									lineHeight: "20px",
								},
							}}
						/>
					</MenuItem>

					{showCreateFormMailchimp && (
						<Box>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									gap: "24px",
									p: 2,
									width: anchorElMailchimp
										? `${anchorElMailchimp.clientWidth}px`
										: "538px",
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
										label="List Name"
										variant="outlined"
										value={newListName}
										onChange={(e) => {
											if (newListName) {
												setListNameError(false);
											}
											setNewListName(e.target.value);
										}}
										size="small"
										fullWidth
										onKeyDown={(e) => e.stopPropagation()}
										error={listNameError}
										helperText={listNameError ? "List Name is Empty" : ""}
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
											endAdornment: newListName && (
												<InputAdornment position="end">
													<IconButton
														edge="end"
														onClick={() => {
															setNewListName("");
															setListNameError(false);
														}}
													>
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
										onClick={handleSave}
										disabled={listNameError || !newListName}
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
					)}

					{list &&
						list.map((listItem) => (
							<MenuItem
								key={listItem.id}
								onClick={() => handleSelectOptionMailchimp(listItem)}
								sx={{
									"&:hover": {
										background: "rgba(80, 82, 178, 0.10)",
									},
								}}
							>
								<ListItemText
									primary={listItem.list_name}
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
		</ClickAwayListener> */}

			<ClickAwayListener onClickAway={handleCloseSelectMailchimp}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "start",
						gap: 2,
					}}
				>
					{isOpenCreateList && (
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								gap: 2,
								width: "100%",
								alignItems: "center",
								p: 0,
							}}
						>
							<Box
								sx={{
									display: "flex",
									width: "100%",
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
									onChange={(e) => setNewListName(e.target.value)}
									size="small"
									fullWidth
									onKeyDown={(e) => e.stopPropagation()}
									error={listNameError}
									helperText={listNameError ? "List Name is required" : ""}
									InputLabelProps={{
										sx: {
											fontFamily: "var(--font-nunito)",
											fontSize: "12px",
											lineHeight: "24px",
											fontWeight: "400",
											color: "rgba(17, 17, 19, 0.60)",
											// color: "var(--main-blue)",
											"&.Mui-focused": {
												color: "var(--main-blue)",
											},
										},
									}}
									InputProps={{
										endAdornment: newListName && ( // Conditionally render close icon if input is not empty
											<InputAdornment position="end">
												<IconButton
													edge="end"
													onClick={() => setNewListName("")} // Clear the text field when clicked
													disabled={isCreatedNewList}
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
												height: "40px",
												"& .MuiOutlinedInput-input": {
													padding: "8px 12px",
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
								<CustomButton
									variant="outlined"
									onClick={handleSave}
									disabled={listNameError || !newListName || isCreatedNewList}
								>
									Save
								</CustomButton>
							</Box>
						</Box>
					)}

					{isShowSelectExistingListButton && (
						<Button
							sx={popupStyle.learnMoreText}
							onClick={() => {
								setOpenSelectExistingList(true);
								setOpenCreateList(false);

								setShowCreateNewListButton(true);
								setShowSelectExistingListButton(false);
							}}
						>
							Select existing list
						</Button>
					)}

					{isOpenSelectExistingList && (
						<TextField
							ref={textFieldRefMailchimp}
							variant="outlined"
							value={selectedOption?.list_name || ""}
							onClick={handleClickMailchimp}
							size="small"
							fullWidth
							label={selectedOption?.list_name ? "" : "Select list"}
							InputLabelProps={{
								shrink: selectedOption ? false : isShrunkMailchimp,
								sx: {
									fontSize: "14px",
									"&.Mui-focused": {
										color: "var(--main-blue)",
									},
								},
							}}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										{
											<IconButton
												onClick={handleDropdownToggleMailchimp}
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
										}
									</InputAdornment>
								),
								sx: IntegrationConnectStyles.formInput,
							}}
							sx={{
								height: "40px",
								"& input": {
									caretColor: "transparent", // Hide caret with transparent color
									fontFamily: "var(--font-nunito)",
									fontSize: "14px",
									fontWeight: "600",
									lineHeight: "normal",
								},
								"& .MuiOutlinedInput-input": {
									cursor: "default", // Prevent showing caret on input field
									top: "5px",
								},
							}}
						/>
					)}

					{isShowCreateNewListButton && (
						<Button
							sx={popupStyle.learnMoreText}
							onClick={() => {
								setOpenSelectExistingList(false);
								setOpenCreateList(true);

								setShowCreateNewListButton(false);
								setShowSelectExistingListButton(true);
							}}
						>
							Create List
						</Button>
					)}

					<Menu
						anchorEl={anchorElMailchimp}
						open={Boolean(anchorElMailchimp) && isDropdownOpen}
						onClose={handleCloseSelectMailchimp}
						PaperProps={{
							sx: {
								width: anchorElMailchimp
									? `${anchorElMailchimp.clientWidth}px`
									: "538px",
								borderRadius: "4px",
								border: "1px solid #e4e4e4",
							}, // Match dropdown width to input
						}}
						sx={{}}
					>
						{/* Show static options */}
						{list &&
							list.map((greenArrow, option) => (
								<MenuItem
									key={greenArrow.id}
									onClick={() => handleSelectOptionMailchimp(greenArrow)}
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
		</>
	);
};

export default MailchimpContactSyncTab;
