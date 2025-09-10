import { createTheme } from "@mui/material";

export const squareIconButtonSx = {
	borderRadius: "4px",
	color: "#3898FC",
	"&:hover": {
		background: "#EBF5FF",
	},
};

export const squareIconButtonsTheme = createTheme({
	components: {
		MuiIconButton: {
			defaultProps: {
				sx: squareIconButtonSx,
			},
		},
	},
});
