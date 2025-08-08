import { createTheme } from "@mui/material";
import { fontFamily } from "@mui/system";

export const whitelabelTheme = createTheme({
	components: {
		MuiTextField: {
			defaultProps: {
				size: "small",
			},
		},
		MuiPaper: {
			styleOverrides: {
				elevation1: {
					boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.08)",
					padding: "20px",
					borderRadius: "4px",
					border: "1px solid #F0F0F0",
				},
			},
		},
		MuiTypography: {
			defaultProps: {
				sx: {
					fontFamily: "var(--font-nunito)",
				},
			},
			styleOverrides: {
				h2: {
					color: "#202124",
					fontSize: "16px",
					fontStyle: "normal",
					fontWeight: 500,
					lineHeight: "normal",
				},
				subtitle1: {
					color: "#5F6368",
					fontFamily: "Roboto",
					fontSize: "12px",
					fontStyle: "normal",
					fontWeight: 400,
					lineHeight: "170%", // 20.4px
					letterSpacing: "0.06px",
				},
			},
		},
	},
});
