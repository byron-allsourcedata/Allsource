import type { SxProps, Theme } from "@mui/system";

export const OptOutStyle: Record<string, SxProps<Theme>> = {
	mainContent: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "100vh",
		marginTop: "-80px",
		position: "relative",

		"@media (max-width: 440px)": {
			marginTop: "-60px",
			padding: "0",
		},
	},
	header: {
		fontFamily: "var(--font-nunito)",
		fontSize: "18px",
		lineHeight: "normal",
		fontWeight: 600,
		color: "#202124",
	},
	description: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		lineHeight: "normal",
		fontWeight: 400,
		color: "#5f6368",
	},
	secondary: {
		fontFamily: "var(--font-nunito)",
		fontSize: "12px",
		lineHeight: "normal",
		fontWeight: 500,
		color: "#707071",
	},
	text: {
		fontFamily: "var(--font-roboto)",
		fontSize: "14px",
		fontWeight: "400",
		color: "#202124",
	},
	button: {
		textTransform: "none",
		backgroundColor: "#3898FC",
		color: "#fffff",
		"&:hover": { backgroundColor: "#3898FC" },
		fontFamily: "var(--font-nunito)",
		fontWeight: 600,
		fontSize: "14px",
	},
	formField: {
		marginTop: "0px",
		marginBottom: "0",
	},
};
