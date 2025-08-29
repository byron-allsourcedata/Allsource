import { createTheme, Paper } from "@mui/material";

export const premiumSourcesTheme = createTheme({
	typography: {
		fontFamily: "var(--font-nunito)",
	},

	components: {
		MuiDrawer: {
			defaultProps: {
				anchor: "right",
			},
		},

		MuiLinearProgress: {
			variants: [
				{
					props: { variant: "determinate" },
					style: {
						height: "8px",
						borderRadius: "4px",
						backgroundColor: "#dbdbdb",
						"& .MuiLinearProgress-bar": {
							borderRadius: 5,
							backgroundColor: "#6EC125",
						},
						mb: 1,
					},
				},
			],
		},

		MuiTable: {
			defaultProps: {
				sx: {
					border: "1px solid #EBEBEB",
					borderRadius: "4px 4px 0 0",
					borderCollapse: "inherit",
				},
			},
		},

		MuiTableCell: {
			defaultProps: {
				sx: {
					position: "relative",
					":before": {
						position: "absolute",
						content: '""',
						left: 0,
						top: "calc((100% - 20px) / 2)",
						width: "100%",
						height: "20px",
						borderRight: "1px solid #DBDBDB",
					},
					"&:last-child": {
						":before": {
							display: "none",
						},
						borderRight: "none",
					},
				},
			},
		},
	},
});
