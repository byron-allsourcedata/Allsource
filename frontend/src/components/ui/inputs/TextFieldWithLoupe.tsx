import { SearchIcon } from "@/icon";
import { Button, InputAdornment, TextField } from "@mui/material";
import type { FC } from "react";

export type Props = {
	placeholder: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const TextFieldWithLoupe: FC<Props> = ({
	placeholder,
	value,
	onChange,
}) => {
	return (
		<TextField
			placeholder={placeholder}
			variant="outlined"
			fullWidth
			value={value}
			onChange={onChange}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<Button
							disabled={true}
							sx={{
								textTransform: "none",
								textDecoration: "none",
								padding: 0,
								minWidth: 0,
								height: "auto",
								width: "auto",
							}}
						>
							<SearchIcon
								sx={{ color: "var(--text-secondary)" }}
								fontSize="medium"
							/>
						</Button>
					</InputAdornment>
				),
				sx: {
					fontFamily: "var(--font-roboto)",
					fontSize: "14px",
					fontWeight: 400,
					lineHeight: "19.6px",
					textAlign: "left",
					color: "var(--text-regular)",
					"& input": {
						paddingLeft: 0,
					},
				},
			}}
			sx={{
				padding: "1em 1em 0em 1em",
				borderColor: "var(--border)",
				"& .MuiInputBase-input::placeholder": {
					fontFamily: "var(--font-roboto)",
					fontSize: "14px",
					fontWeight: 400,
					lineHeight: "19.6px",
					textAlign: "left",
					color: "var(--text-regular)",
				},
				"& .MuiOutlinedInput-root": {
					"& .MuiOutlinedInput-notchedOutline": {
						borderColor: "var(--border)",
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: "var(--text-helping)",
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: "var(--main-blue)",
					},
				},
			}}
		/>
	);
};
