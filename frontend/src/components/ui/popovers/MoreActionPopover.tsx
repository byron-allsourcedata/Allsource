import {
	List,
	ListItemButton,
	ListItemText,
	Popover,
	type PopoverProps,
} from "@mui/material";
import React from "react";

type ListItemButton = {
	disabled: boolean;
	primaryText: string;
	onClick: () => void;
};

type Props = {
	handleClose: () => void;
	openPopover: boolean;
	anchorEl: PopoverProps["anchorEl"];
	listItemButtons: ListItemButton[];
};

const EditNamePopover: React.FC<Props> = ({
	openPopover,
	handleClose,
	anchorEl,
	listItemButtons,
}) => {
	return (
		<Popover
			open={openPopover}
			anchorEl={anchorEl}
			onClose={handleClose}
			slotProps={{
				paper: {
					sx: {
						boxShadow: 0,
						borderRadius: "4px",
						border: "0.5px solid rgba(175, 175, 175, 1)",
					},
				},
			}}
			anchorOrigin={{
				vertical: "center",
				horizontal: "center",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "right",
			}}
		>
			<List
				sx={{
					width: "100%",
					maxWidth: 360,
					boxShadow: "none",
				}}
			>
				{listItemButtons.map((el, ind) => (
					<ListItemButton
						key={ind}
						disabled={el.disabled}
						sx={{
							padding: "4px 16px",
							":hover": {
								backgroundColor: "rgba(80, 82, 178, 0.1)",
							},
						}}
						onClick={el.onClick}
					>
						<ListItemText
							primaryTypographyProps={{
								fontSize: "14px",
							}}
							primary={el.primaryText}
						/>
					</ListItemButton>
				))}
			</List>
		</Popover>
	);
};

export default EditNamePopover;
