import { createTheme } from "@mui/material";

export const tabsTheme = createTheme({
	components: {
		MuiTabs: {
			defaultProps: {
				TabIndicatorProps: {
					sx: {
						backgroundColor: "rgba(56, 152, 252, 1)",
						height: "2px",
						bottom: 5,
					},
				},
				sx: {
					minHeight: 0,
					justifyContent: "flex-start",
					alignItems: "left",
					width: "min-content",
					"@media (max-width: 600px)": {
						border: "1px solid rgba(228, 228, 228, 1)",
						borderRadius: "4px",
						width: "100%",
						"& .MuiTabs-indicator": {
							height: "1.4px",
						},
					},
				},
			},
		},
		MuiTab: {
			defaultProps: {
				sx: {
					fontFamily: "var(--font-nunito)",
					fontWeight: 500,
					fontSize: "14px",
					lineHeight: "100%",
					letterSpacing: "0%",
					width: "min-content",
					color: "rgba(112, 112, 113, 1)",
					textTransform: "none",
					padding: "4px 1px",
					minHeight: "auto",
					flexGrow: 1,
					pb: "10px",
					textAlign: "center",
					mr: 2,
					minWidth: "auto",
					"&.Mui-selected": {
						fontWeight: 700,
						color: "rgba(56, 152, 252, 1)",
					},
					"&.MuiTabs-indicator": {
						backgroundColor: "rgba(56, 152, 252, 1)",
					},
					"@media (max-width: 600px)": {
						mr: 1,
						borderRadius: "4px",
						"&.Mui-selected": {
							backgroundColor: "rgba(249, 249, 253, 1)",
							border: "1px solid rgba(220, 220, 239, 1)",
						},
					},
				},
			},
		},
	},
});
