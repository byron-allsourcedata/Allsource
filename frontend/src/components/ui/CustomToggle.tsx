import React from "react";
import { ToggleButton, SxProps, Theme } from "@mui/material";

interface CustomToggleProps {
	isActive: boolean;
	value: string;
	name: string;
	onClick: () => void;
	sx?: SxProps<Theme>;
}

const CustomToggle: React.FC<CustomToggleProps> = ({
	onClick,
	value,
	name,
	isActive,
	sx,
}) => {
	const toggleStyle = {
		"&.MuiToggleButton-root.Mui-selected": {
			backgroundColor: "rgba(246, 248, 250, 1)",
			":hover": {
				borderColor: "rgba(208, 213, 221, 1)",
				backgroundColor: "rgba(236, 238, 241, 1)",
			},
		},
		"&.MuiToggleButton-root": {
			":hover": {
				borderColor: "rgba(208, 213, 221, 1)",
				backgroundColor: "rgba(236, 238, 241, 1)",
			},
		},
		textTransform: "none",
		color: "rgba(32, 33, 36, 1)",
		borderRadius: "4px",
		padding: "8px 12px",
	};

	const combinedSx: SxProps<Theme> = {
		...toggleStyle,
		...(sx as object),
	};

	return (
		<ToggleButton
			key={value}
			value={value}
			selected={isActive}
			className="form-input-label"
			onClick={onClick}
			sx={{
				...combinedSx,
				border: isActive
					? "1px solid rgba(117, 168, 218, 1)"
					: "1px solid #ccc",
			}}
		>
			{name}
		</ToggleButton>
	);
};

export default CustomToggle;
