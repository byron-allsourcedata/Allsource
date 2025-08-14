import type { ChangeEvent, FC } from "react";
import { TextFieldSkeleton } from "./TextFieldSkeleton";
import { TextField } from "@mui/material";

type Props = {
	value: string | undefined;
	onChange: (value: ChangeEvent<HTMLInputElement>) => void;
};

export const LoadingTextField: FC<Props> = ({ value, onChange }) => {
	if (value == null) {
		return <TextFieldSkeleton />;
	}

	return <TextField size="small" value={value} onChange={onChange} />;
};
