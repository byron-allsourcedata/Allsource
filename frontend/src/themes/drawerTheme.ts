import { createTheme } from "@mui/material/styles";

export const drawerTheme = createTheme({
	components: {
		MuiDrawer: {
			styleOverrides: {
				paper: ({ theme }) => ({
					width: "40%",
					position: "fixed",
					top: 0,
					bottom: 0,
					msOverflowStyle: "none",
					scrollbarWidth: "none",
					overflowY: "auto",
					"&::-webkit-scrollbar": { display: "none" },
					[theme.breakpoints.down("sm")]: { width: "100%" },
				}),
			},
		},
		MuiModal: {
			defaultProps: {
				BackdropProps: {
					sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
				},
			},
		},
		MuiPopover: {
			defaultProps: {
				BackdropProps: {
					sx: { backgroundColor: "rgba(0, 0, 0, 0.05)" },
				},
			},
		},
		MuiBackdrop: {
			styleOverrides: {
				root: {
					backgroundColor: "rgba(0, 0, 0, 0.25)",
				},
			},
		},
	},
});
