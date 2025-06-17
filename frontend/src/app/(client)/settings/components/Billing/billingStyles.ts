export const billingStyles = {
	tableColumn: {
		lineHeight: "16px !important",
		position: "relative",
		paddingLeft: "45px",
		paddingTop: "18px",
		paddingBottom: "18px",
		"&::after": {
			content: '""',
			display: "block",
			position: "absolute",
			top: "15px",
			bottom: "15px",
			right: 0,
			width: "1px",
			height: "calc(100% - 30px)",
			backgroundColor: "rgba(235, 235, 235, 1)",
		},
		"&:last-child::after": {
			content: "none",
		},
	},
	tableBodyRow: {
		"&:last-child td": {
			borderBottom: 0,
		},
	},
	tableBodyColumn: {
		lineHeight: "16px !important",
		position: "relative",
		paddingLeft: "45px",
		paddingTop: "13.5px",
		paddingBottom: "13.5px",
		"&::after": {
			content: '""',
			display: "block",
			position: "absolute",
			top: "15px",
			bottom: "15px",
			right: 0,
			width: "1px",
			height: "calc(100% - 30px)",
			backgroundColor: "rgba(235, 235, 235, 1)",
		},
		"&:last-child::after": {
			content: "none",
		},
	},
	formField: {
		margin: "0",
	},
	inputLabel: {
		top: "-3px",
		"&.Mui-focused": {
			top: 0,
			color: "rgba(17, 17, 19, 0.6)",
			fontFamily: "Nunito Sans",
			fontWeight: 400,
			fontSize: "12px",
			lineHeight: "16px",
		},
	},
	formInput: {
		"&.MuiFormControl-root": {
			margin: 0,
		},
		"&.MuiOutlinedInput-root": {
			"& .MuiOutlinedInput-input": {
				fontFamily: "Roboto",
				color: "#202124",
				fontSize: "14px",
				lineHeight: "20px",
			},
		},
	},
	page_number: {
		backgroundColor: "rgba(255, 255, 255, 1)",
		color: "rgba(56, 152, 252, 1)",
	},
	buttonInPopover: {
		border: "none",
		boxShadow: "none",
		color: "#202124 !important",
		lineHeight: "normal !important",
		textTransform: "none",
		minWidth: "auto",
		width: "100%",
		padding: "4px 0 4px 16px",
		textAlign: "left",
		display: "block",
		borderRadius: "0",
		"&:hover": {
			backgroundColor: "rgba(80, 82, 178, 0.10)",
		},
	},
	addFundsButton: {
		background: "rgba(56, 152, 252, 1)",
		borderRadius: "4px",
		border: "1px solid rgba(56, 152, 252, 1)",
		boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
		color: "#fff !important",
		textTransform: "none",
		padding: "6px 16.5px",
		"&:hover": {
			color: "rgba(56, 152, 252, 1) !important",
		},
	},
};
