import { SxProps, Theme } from "@mui/system";

export const signupStyles: { [key: string]: SxProps<Theme> } = {
	mainContent: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "100vh",
		"@media (max-width: 440px)": {
			marginTop: "-60px",
			padding: "0",
		},
	},
	mainContainer: {
		display: "grid",
		width: "100%",
		height: "100vh",
		gridTemplateColumns: "30vw 1fr",
		// gridTemplateColumns: "minmax(0, min(30vw, calc(100vh * 16 / 9))) 1fr",
		"@media (max-width: 900px)": {
			gridTemplateColumns: "0 100%",
		},

    "@media (min-width: 1601px)": {
			gridTemplateColumns: "25vw 1fr",
		},

		// gridTemplateColumns: {
		// 	xs: "0 100%",
		// 	lg: "minmax(400px, 35vw) 1fr",
		// 	xl: "minmax(500px, 40vw) 1fr",
		// },
		// "@media (min-width: 901px) and (max-width: 1200px)": {
		// 	gridTemplateColumns: "35vw 1fr",
		// },
		// "@media (min-width: 901px) and (max-width: 1600px)": {
		// 	gridTemplateColumns: "0 1fr",
		// },
		// "@media (min-width: 1201px) and (max-width: 1600px)": {
		// 	gridTemplateColumns: "30vw 1fr",
		// },
		// "@media (min-width: 1601px)": {
		// 	gridTemplateColumns: "30vw 1fr",
		// },
		// "@media (min-width: 1001px) and (min-height: 1200px)": {
		// 	gridTemplateColumns: "65vw 1fr",
		// },
		// "@media (min-width: 1201px) and (min-height: 1200px)": {
		// 	gridTemplateColumns: "60vw 1fr",
		// },
		// "@media (min-width: 1401px) and (min-height: 1200px)": {
		// 	gridTemplateColumns: "53vw 1fr",
		// },
		// "@media (min-width: 1601px) and (min-height: 1200px)": {
		// 	gridTemplateColumns: "45vw 1fr",
		// },
		// "@media (min-width: 1801px) and (min-height: 1200px)": {
		// 	gridTemplateColumns: "47vw 1fr",
		// },
		// "@media (min-width: 2001px) and (min-height: 1200px)": {
		// 	gridTemplateColumns: "37vw 1fr",
		// },
		// "@media (max-width: 900px)": {
		// 	gridTemplateColumns: "0 100%",
		// },
	},
  videoContainer: {
    backgroundColor: "rgba(218, 235, 255, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
    padding: 0,
  },
	container: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		margin: "auto auto",
		position: "relative",
		boxShadow: "0rem 0.2em 0.8em 0px #00000033",
		borderRadius: "0.625rem",
		border: "0.0625rem solid transparent",
		textAlign: "center",
		padding: "32px",
		maxWidth: "464px",
		height: "60vh",
		minHeight: "581px",
		"@media (max-width: 440px)": {
			boxShadow: "0rem 0px 0px 0px #00000033",
			border: "none",
			padding: "0 20px 40px 20px",
			maxWidth: "100%",
		},
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
	title: {
		fontWeight: "600",
		whiteSpace: "nowrap",
		textAlign: "center",
		paddingBottom: "33px",
		lineHeight: "normal",
		overflow: "hidden",
		textOverflow: "ellipsis",
		display: "block",
		maxWidth: "100%",
		"@media (max-width: 440px)": {
			paddingBottom: "2rem",
		},
	},
	googleButton: {
		mb: 2,
		bgcolor: "#FFFFFF",
		color: "#000000",
		padding: "0.875rem 7.5625rem",
		whiteSpace: "nowrap",
		border: "0.125rem solid transparent",
		"&:hover": {
			borderColor: "#Grey/Light",
			backgroundColor: "white",
		},
		textTransform: "none",
		width: "100%",
		maxWidth: "22.5rem",
		fontWeight: "medium",
		fontSize: "0.875rem",
	},
	orDivider: {
		display: "flex",
		alignItems: "center",
		width: "100%",
		mt: "24px",
		mb: "24px",
		"@media (max-width: 440px)": {
			marginTop: "16px",
			marginBottom: "16px",
		},
	},
	orText: {
		px: "36px",
		"@media (max-width: 440px)": {
			marginTop: "16px",
			marginBottom: "16px",
		},
	},
	form: {
		width: "100%",
	},
	inputLabel: {
		top: "-3px",
		"&.Mui-focused": {
			color: "rgba(17, 17, 19, 0.6)",
			fontFamily: "var(--font-nunito)",
			fontWeight: 400,
			fontSize: "12px",
			lineHeight: "16px",
		},
	},
	submitButton: {
		mt: 2,
		backgroundColor: "#3898FC",
		color: "#fff !important",
		"&:hover": {
			backgroundColor: "#1E88E5",
		},
		"&:active": {
			backgroundColor: "#74B7FD",
		},
		margin: "24px 0px 0 0px",
		textTransform: "none",
		minHeight: "3rem",
		"@media (max-width: 440px)": {
			marginTop: "32px",
		},
	},
	loginText: {
		mt: 2,
		margin: "43px 0 0",
	},
	loginLink: {
		cursor: "pointer",
		textDecoration: "none",
	},
	formField: {
		marginTop: "24px",
		marginBottom: "0",
		"@media (max-width: 440px)": {
			marginTop: "16px",
		},
	},
	formInput: {
		"&.MuiOutlinedInput-root": {
			height: "48px",
			"& .MuiOutlinedInput-input": {
				padding: "12px 16px 13px 16px",
			},
			"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(56, 152, 252, 1)",
			},
		},
		"&+.MuiFormHelperText-root": {
			marginLeft: "0",
		},
	},
	passwordValidationText: {
		"& .MuiTypography-root": {
			fontFamily: "var(--font-nunito)",
			fontSize: "12px",
			fontWeight: "400",
			color: "#707071",
			lineHeight: "22px",
		},
	},
	passwordValidationTextSuccess: {
		"& .MuiTypography-root": {
			fontFamily: "var(--font-nunito)",
			fontSize: "12px",
			fontWeight: "400",
			color: "#202124",
		},
	},
	passwordContentList: {
		display: "flex",
		padding: "0",
	},
	passwordContentListItem: {
		width: "auto",
		padding: "0 16px 0 0",
		"&:last-child": {
			padding: 0,
		},
	},
	passwordContentListItemIcon: {
		minWidth: "0",
		marginRight: "4px",
	},
	checkboxContentField: {
		display: "table",
		textAlign: "left",
		color: "#202124",
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		fontWeight: "400",
		lineHeight: "normal",
		marginTop: "24px",
		marginLeft: "0",
		marginRight: "0",
		"& .MuiCheckbox-root": {
			padding: 0,
			marginRight: "10px",
			position: "relative",
			top: "-2px",
		},
		"& .MuiSvgIcon-root": {
			width: 0,
			height: 0,
		},
		"& .MuiCheckbox-root:before": {
			content: '""',
			display: "inline-block",
			width: "18px",
			height: "18px",
			borderRadius: "4px",
			border: "1px solid #e4e4e4", // Default border color
			backgroundColor: "#fff",
			boxShadow: "none",
		},
		"& .MuiCheckbox-root.Mui-checked:before": {
			border: "1px solid #3898FC",
			backgroundColor: "#3898FC",
			content: '""',
			backgroundImage: 'url("/checkbox-tick.svg")',
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			color: "#fff",
		},
		"& .MuiCheckbox-root:focusVisible:before": {
			boxShadow:
				"rgb(255, 255, 255) 0px 0px 0px 1px, rgb(80, 105, 200) 0px 0px 0px 3px",
		},
		"& .MuiCheckbox-root:hover:before": {
			border: "1px solid #3898FC",
		},
	},
	checkboxContentLink: {
		color: "#202124",
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		textDecorationColor: "#202124",
		"& img": {
			position: "relative",
			top: "3px",
			left: "4px",
		},
	},
};
