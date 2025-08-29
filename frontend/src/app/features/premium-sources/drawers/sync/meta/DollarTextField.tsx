import { InputAdornment, TextField } from "@mui/material";
import type { FC } from "react";

export type Props = {
	label: string;
	name: string;
	value: number;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const DollarTextField: FC<Props> = ({
	label,
	name,
	value,
	onChange,
}) => {
	return (
		<TextField
			fullWidth
			variant="outlined"
			type="number"
			margin="normal"
			label={label}
			name={name}
			value={value}
			onKeyDown={(e) => e.stopPropagation()}
			onChange={onChange}
			InputProps={{
				startAdornment: <InputAdornment position="start">$</InputAdornment>,
			}}
		/>
	);
};
