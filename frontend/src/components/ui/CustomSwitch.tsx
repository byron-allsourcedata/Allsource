import React from "react";
import { Switch, SxProps, Theme } from "@mui/material";

interface CustomButtonProps {
	stateSwitch: boolean;
	changeState: (state: React.ChangeEvent<HTMLInputElement>) => void;
	sx?: SxProps<Theme>;
}

const CustomButton: React.FC<CustomButtonProps> = ({
	changeState,
	stateSwitch,
	sx,
}) => {

	const switchStyle = {
		"& .MuiSwitch-switchBase": {
			"&+.MuiSwitch-track": {
				backgroundColor: "rgba(163, 176, 194, 1)",
				opacity: 1,
			},
			"&.Mui-checked": {
				color: "#fff",
				"&+.MuiSwitch-track": {
					backgroundColor: "rgba(56, 152, 252, 1)",
					opacity: 1,
				},
			},
		},
	}

	const combinedSx: SxProps<Theme> = {
		...switchStyle,
		...(sx as object),
	};

	return (
		<Switch
            onChange={changeState}
			checked={stateSwitch}
			sx={combinedSx}
		/>
        
            
	);
};

export default CustomButton;
