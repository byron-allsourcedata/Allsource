export const IntegrationConnectStyles = {
	tabHeading: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		color: "#707071",
		fontWeight: "500",
		lineHeight: "20px",
		textTransform: "none",
		padding: 0,
		minWidth: "auto",
		px: 2,
		pointerEvents: "none",
		"@media (max-width: 600px)": {
			alignItems: "flex-start",
			p: 0,
		},
		"&.Mui-selected": {
			color: "rgba(56, 152, 252, 1)",
			fontWeight: "700",
		},
	},
	inputLabel: {
		fontFamily: "var(--font-nunito)",
		fontSize: "14px",
		lineHeight: "16px",
		left: "2px",
		color: "rgba(17, 17, 19, 0.60)",
		"&.Mui-focused": {
			color: "rgba(56, 152, 252, 1)",
		},
	},
	formInput: {
		"&.MuiOutlinedInput-root": {
			height: "48px",
			"& .MuiOutlinedInput-input": {
				padding: "12px 16px 13px 16px",
				fontFamily: "var(--font-roboto)",
				color: "#202124",
				fontSize: "14px",
				lineHeight: "20px",
				fontWeight: "400",
			},
			"& .MuiOutlinedInput-notchedOutline": {
				borderColor: "#A3B0C2",
			},
			"&:hover .MuiOutlinedInput-notchedOutline": {
				borderColor: "#A3B0C2",
			},
			"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(56, 152, 252, 1)",
			},
			"&.Mui-error .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(224, 49, 48, 1)",
			},
		},
		"&+.MuiFormHelperText-root": {
			marginLeft: "0",
		},
	},
};
