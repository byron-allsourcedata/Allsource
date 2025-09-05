import { InputAdornment, TextField } from "@mui/material";
import type { FC } from "react";

export type Props = {
	label: string;
	name: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export const PriceInputField: FC<Props> = ({
	label,
	name,
	value,
	onChange,
	onBlur,
}) => {
	return (
		<TextField
			fullWidth
			variant="outlined"
			margin="normal"
			label={label}
			name={name}
			value={value}
			placeholder="0.00"
			onKeyDown={(e) => e.stopPropagation()}
			onChange={onChange}
			onBlur={onBlur}
			InputProps={{
				startAdornment: <InputAdornment position="start">$</InputAdornment>,
			}}
		/>
	);
};
