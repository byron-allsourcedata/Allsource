import { useState, type ChangeEvent } from "react";

export function useFieldValue(val: string) {
	const [value, setValue] = useState(val);

	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setValue(e.target.value);
	};

	return [{ value, onChange }, setValue] as const;
}

export function useOptionalFieldValue(val?: string) {
	const [value, setValue] = useState(val);

	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setValue(e.target.value);
	};

	return [{ value, onChange }, setValue] as const;
}
