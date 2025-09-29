import React from "react";
import { styled } from "@mui/material/styles";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { SxProps } from "@mui/system";

interface RadioButtonProps<T extends string> {
	value?: T;
	onChange?: (value: React.SetStateAction<T>) => void;
	className?: SxProps;
	values: RadioValues<T>[];
}

interface RadioValues<T extends string> {
	value: T;
	name: string;
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

const CustomRadioButton = <T extends string>({
	value,
	onChange,
	className,
	values,
}: RadioButtonProps<T>) => {
	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const val = event.target.value as T;
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
				aria-label="radio-group"
				name="radio-group"
			>
				{values.map((val, ind) => (
					<FormControlLabel
						key={ind}
						value={val.value}
						control={<StyledRadio />}
						label={
							<Typography
								variant="subtitle1"
								sx={{
									color: value === val.value ? "#3b82f6" : "#6f6f6f",
									display: "inline-flex",
									alignItems: "center",
									ml: 0.75,
									fontSize: "12px",
								}}
							>
								{val.name}
							</Typography>
						}
					/>
				))}
			</RadioGroup>
		</FormControl>
	);
};

export default CustomRadioButton;
