import { useCallback, useRef } from "react";

type UseFilePickerOptions = {
	accept?: string; // e.g. "image/*,.pdf"
	multiple?: boolean;
	onFileUpload: (files: FileList) => void;
};

export function useFilePicker({
	accept,
	multiple,
	onFileUpload,
}: UseFilePickerOptions) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const openFileDialog = useCallback(() => {
		if (!inputRef.current) return;
		inputRef.current.value = ""; // reset to allow re-selecting same file
		inputRef.current.click();
	}, []);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.files && event.target.files.length > 0) {
				onFileUpload(event.target.files);
			}
		},
		[onFileUpload],
	);

	const FileInput = (
		<input
			ref={inputRef}
			type="file"
			accept={accept}
			multiple={multiple}
			style={{ display: "none" }}
			onChange={handleChange}
		/>
	);

	return { openFileDialog, FileInput };
}
