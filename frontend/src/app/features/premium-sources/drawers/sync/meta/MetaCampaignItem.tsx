import { MenuItem, ListItemText } from "@mui/material";
import type { FC } from "react";

export type Props = {
	onClick: () => void;
	listName: string;
};

export const MetaCampaignItem: FC<Props> = ({ listName, onClick }) => {
	return (
		<MenuItem
			onClick={onClick}
			sx={{
				"&:hover": {
					background: "rgba(80, 82, 178, 0.10)",
				},
			}}
		>
			<ListItemText
				primary={listName}
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
	);
};
