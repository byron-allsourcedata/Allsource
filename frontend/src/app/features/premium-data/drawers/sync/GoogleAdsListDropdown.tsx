import type { FC, ReactNode } from "react";
import type { ChannelList } from "../GoogleAdsGenericSync";
import { GoogleAdsDropdown } from "./GoogleAdsDropdown";
import { Box, ListItemText, MenuItem } from "@mui/material";
import {
	GoogleAdsCreateListMenuItem,
	GoogleAdsListCreator,
} from "./GoogleAdsListPicker";

type GoogleAdsListDropdownProps = {
	showCreateForm: boolean;
	selectedList: ChannelList | null;
	lists: ChannelList[];
	isOpen: boolean;
	onClick: () => void;
	toggle: () => void;
	onClose: () => void;
	onSelect: (account: ChannelList) => void;
	onSaveNewList: (listName: string) => void;
	onAddNewList: () => void;
	label?: string;
	disabled?: boolean;
	disableAddList: boolean;
	shrink?: boolean;
};

export const GoogleAdsListDropdown: FC<GoogleAdsListDropdownProps> = ({
	selectedList,
	lists,
	isOpen,
	onClick,
	toggle,
	onClose,
	onSelect,
	onAddNewList,
	onSaveNewList,
	label,
	disabled,
	shrink,
	disableAddList,
	showCreateForm,
}) => {
	const selectedListName = selectedList?.list_name ?? "";

	const menuItems = (
		<Box>
			<GoogleAdsCreateListMenuItem
				disabled={disableAddList}
				showCreateForm={showCreateForm}
				onSelect={onAddNewList}
			/>
			{showCreateForm && <GoogleAdsListCreator onSave={onSaveNewList} />}
			{lists?.map((list) => (
				<MenuItem
					key={list.list_id}
					onClick={() => onSelect(list)}
					sx={{
						"&:hover": {
							background: "rgba(80, 82, 178, 0.10)",
						},
					}}
				>
					<ListItemText
						primary={list.list_name}
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
		</Box>
	);
	return (
		<GoogleAdsDropdown
			label={label}
			selectedName={selectedListName}
			isOpen={isOpen}
			onClick={onClick}
			toggle={toggle}
			onClose={onClose}
			menuItems={[menuItems]}
		/>
	);
};
