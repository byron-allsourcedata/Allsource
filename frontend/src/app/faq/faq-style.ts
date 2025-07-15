import type { SxProps, Theme } from "@mui/system";

export const FaqStyle: Record<string, SxProps<Theme>> = {
	mainContent: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		// minHeight: "100vh",
		marginTop: "2vh",
		marginBottom: "2vh",
		position: "relative",

		"@media (max-width: 440px)": {
			marginTop: "-60px",
			padding: "0",
		},
	},
	header: {
		fontFamily: "var(--font-nunito)",
		fontSize: "30px",
		lineHeight: "normal",
		fontWeight: 600,
		color: "#202124",
	},
	secondary: {
		fontFamily: "var(--font-nunito)",
		fontSize: "12px",
		lineHeight: "normal",
		fontWeight: 500,
		color: "#707071",
	},
	question: {
		fontFamily: "var(--font-roboto)",
		fontSize: "20px",
		fontWeight: "500",
		color: "#202124",
	},
	answer: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		fontWeight: "400",
		color: "#202124",
	},
};
