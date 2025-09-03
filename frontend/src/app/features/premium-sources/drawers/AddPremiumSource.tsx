import {
	DrawerContainer,
	DrawerContent,
} from "@/components/drawers/DrawerContainer";
import { DrawerHeader } from "@/components/drawers/DrawerHeader";
import { Divider, LinearProgress, TextField, Typography } from "@mui/material";
import { useState, type FC } from "react";
import { useFileDragAndDrop } from "../../../../components/premium-sources/hooks/useFileDragAndDrop";
import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
import { PremiumSourceFileSlot } from "../../../../components/premium-sources/components/PremiumSourceFileSlot";
import { useFieldValue } from "../../../../components/premium-sources/hooks/useFieldValue";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import { useAdminPostPremiumSources } from "@/app/features/premium-sources/requests";
import { useFilePicker } from "../../whitelabel/hooks/useFilePicker";
import type { AxiosError } from "axios";

const T = Typography;

type Props = {
	userId: number;
	onClose: () => void;
	onDone: () => void;
};

export const AddPremiumSource: FC<Props> = ({ userId, onClose, onDone }) => {
	const [nameField] = useFieldValue("");
	const dndState = useFileDragAndDrop(["text/csv"]);

	const [pickedFile, setPickedFile] = useState<File | null>(null);
	const { openFileDialog, FileInput: hiddenSmallLogoFileInput } = useFilePicker(
		{
			accept: "text/csv",
			onFileUpload: (files) => {
				const file = files[0];
				setPickedFile(file);
			},
			multiple: false,
		},
	);

	const [{ loading, error }, upload] = useAdminPostPremiumSources();

	const fileUploaded = pickedFile != null || dndState.droppedFiles.length > 0;

	const uploadEnabled = nameField.value.trim().length > 0 && fileUploaded;

	const uploadedFile = pickedFile ?? dndState.droppedFiles[0];

	const onUpload = () => {
		const file = uploadedFile;

		const data = new FormData();

		data.append("file", file);
		data.append("user_id", String(userId));
		data.append("source_name", nameField.value);

		upload({ data })
			.then((response) => {
				showToast("Premium source uploaded successfully");
				onDone();
			})
			.catch((err: AxiosError) => {
				if (err.status === 400) {
					const errorCode = err.response?.data;

					if (errorCode === "missing_column") {
						showErrorToast("File missing 'PERSONAL_EMAIL_SHA256' column");
						return;
					}
					if (errorCode === "bad_encoding") {
						showErrorToast("File is not UTF-8 encoded (Encoding error)");
						return;
					}
				}
				showErrorToast("Failed to upload premium source");
			});
	};

	return (
		<DrawerContainer>
			{hiddenSmallLogoFileInput}
			<DrawerHeader title="Add Premium Source" onClose={onClose} />
			{loading && <LinearProgress variant="indeterminate" />}
			<DrawerContent>
				<Column justifyContent="space-between" height="inherit">
					<Column gap="1rem">
						<T>Upload and manage Premium Sources</T>

						<TextField
							title="Name"
							label="Name"
							placeholder="Premium Source Name"
							InputLabelProps={{
								shrink: true,
							}}
							{...nameField}
						/>
						<Divider />
						<PremiumSourceFileSlot
							selectedFile={pickedFile ?? undefined}
							dndState={dndState}
							onUploadClick={openFileDialog}
						/>
					</Column>
					<Row justifyContent="flex-end">
						<CustomButton disabled={!uploadEnabled} onClick={onUpload}>
							Upload
						</CustomButton>
					</Row>
				</Column>
			</DrawerContent>
		</DrawerContainer>
	);
};
