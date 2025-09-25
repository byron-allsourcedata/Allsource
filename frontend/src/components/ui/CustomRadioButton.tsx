import React from "react";
import { styled } from "@mui/material/styles";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { SxProps } from "@mui/system";

type MatchValue = "all" | "any";

interface MatchToggleProps {
	value?: MatchValue;
	onChange?: (value: MatchValue) => void;
	className?: SxProps;
}

const StyledRadio = styled(Radio)(({ theme }) => {
	return {
		padding: 6,
		fontFamily: "Roboto",
		fontSize: "12px",
		fontWeight: 500,
		width: "16px",
		height: "16px",
		ml: 1.5,
		"& .MuiSvgIcon-root": {
			fontSize: 16,
		},
		color: "#717171",
		"&.Mui-checked": {
			color: "rgba(56, 152, 252, 1)",
		},
		"&:focus-visible": {
			outline: "none",
			boxShadow: `0 0 0 6px rgba(59,130,246,0.12)`,
			borderRadius: "50%",
		},
	};
});

const CustomRadioButton: React.FC<MatchToggleProps> = ({
	value,
	onChange,
	className,
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const val = event.target.value as MatchValue;
		onChange?.(val);
	};

	return (
		<FormControl
			component="fieldset"
			sx={{
				...className,
				"& .MuiFormControlLabel-root": {
					marginLeft: 0,
				},
				gap: 2,
			}}
		>
			<RadioGroup
				row
				value={value}
				onChange={handleChange}
				aria-label="match-mode"
				name="match-mode"
			>
				<FormControlLabel
					value="all"
					control={<StyledRadio />}
					label={
						<Typography
							variant="subtitle1"
							sx={{
								color: value === "all" ? "#3b82f6" : "#6f6f6f",
								display: "inline-flex",
								alignItems: "center",
								ml: 0.75,
								fontSize: "12px",
							}}
						>
							Match All
						</Typography>
					}
				/>

				<FormControlLabel
					value="any"
					control={<StyledRadio />}
					label={
						<Typography
							variant="subtitle1"
							sx={{
								color: value === "any" ? "#3b82f6" : "#6f6f6f",
								display: "inline-flex",
								alignItems: "center",
								ml: 0.75,
								fontSize: "12px",
							}}
						>
							Match Any
						</Typography>
					}
				/>
			</RadioGroup>
		</FormControl>
	);
};

export default CustomRadioButton;
