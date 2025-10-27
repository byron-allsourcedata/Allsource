import { SxProps, Theme } from "@mui/system";

export const signupStyles: { [key: string]: SxProps<Theme> } = {
	mainContent: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "100vh",
		marginTop: "-80px",
		"@media (max-width: 440px)": {
			marginTop: "-60px",
			padding: "0",
		},
	},
	headers: {
		display: "flex",
		// marginTop: "10px",
		justifyContent: "space-between",
		alignItems: "center",
		paddingRight: "1.5rem",
		maxHeight: "16vh",
		width: "100%",
		color: "rgba(244, 87, 69, 1)",
	},
	logoContainer: {
		paddingLeft: "2.5em",
		paddingRight: "0.5em",
		paddingTop: "2.5em",
		"@media (max-width: 440px)": {
			paddingLeft: "1.25em",
			paddingTop: "1.25em",
			"& img": {
				width: "40px",
				height: "25px",
			},
		},
	},
};
