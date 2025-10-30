export const dataSyncStyles = {
	textFieldInputLabelStyles: {
		fontFamily: "var(--font-nunito)",
		fontSize: "12px",
		lineHeight: "16px",
		color: "rgba(17, 17, 19, 0.60)",
		top: "-5px",
		"&.Mui-focused": {
			color: "rgba(56, 152, 252, 1)",
			top: 0,
		},
		"&.MuiInputLabel-shrink": {
			top: 0,
		},
	},
	textFieldInputStyles: {
		"&.MuiOutlinedInput-root": {
			height: "36px",
			"& .MuiOutlinedInput-input": {
				padding: "6.5px 8px",
				fontFamily: "var(--font-roboto)",
				color: "#202124",
				fontSize: "12px",
				fontWeight: "400",
				lineHeight: "20px",
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
		},
		"&+.MuiFormHelperText-root": {
			marginLeft: "0",
		},
	},
	formControlInputStyles: {
		height: "36px",
		padding: "6.5px 8px !important",
		fontFamily: "var(--font-roboto)",
		fontSize: "12px",
		fontWeight: "400",
		color: "#202124",
		lineHeight: "20px",
	},
	formControlStyles: {
		"&.MuiOutlinedInput-root": {
			height: "36px",
			"& .MuiOutlinedInput-notchedOutline": {
				borderColor: "#A3B0C2",
			},
			"&:hover .MuiOutlinedInput-notchedOutline": {
				borderColor: "#A3B0C2",
			},
			"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
				borderColor: "rgba(56, 152, 252, 1)",
			},
		},
	},
};
