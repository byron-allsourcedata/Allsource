import { MoreVert } from "@/icon";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useState, type FC } from "react";

type ActionsProps = {
	onDelete: () => void;
};

export const Actions: FC<ActionsProps> = ({ onDelete }) => {
	const [anchor, setAnchor] = useState<null | HTMLElement>(null);
	const [open, setOpen] = useState(false);

	const toggle = (e: React.MouseEvent<HTMLElement>) => {
		setAnchor(e.target as HTMLElement);
		return setOpen((prev) => !prev);
	};

	const actionsIcon = (
		<IconButton onClick={toggle}>
			<MoreVert />
		</IconButton>
	);

	return (
		<div>
			{actionsIcon}
			<Menu open={open} anchorEl={anchor} onClose={toggle}>
				<MenuItem
					onClick={onDelete}
					sx={{
						minWidth: "8rem",
					}}
				>
					Delete
				</MenuItem>
			</Menu>
		</div>
	);
};
