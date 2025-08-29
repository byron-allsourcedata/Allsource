import type { FC } from "react";
import type { FileDnd } from "../hooks/useFileDragAndDrop";
import { Column } from "@/components/Column";
import { PremiumSourceUploaded } from "./PremiumSourceUploaded";
import { PremiumSourceUpload } from "./PremiumSourceUpload";

type Props = {
	dndState: FileDnd;
	selectedFile?: File;
	onUploadClick: () => void;
};

export const PremiumSourceFileSlot: FC<Props> = ({
	dndState,
	selectedFile,
	onUploadClick: onClick,
}) => {
	const { droppedFiles } = dndState;
	const droppedSelectedFile = selectedFile ? selectedFile : droppedFiles[0];

	if (droppedSelectedFile != null) {
		return (
			<PremiumSourceUploaded
				name={droppedSelectedFile.name}
				size={droppedSelectedFile.size}
				onDelete={() => {
					dndState.clear();
				}}
			/>
		);
	}
	return <PremiumSourceUpload dndProps={dndState} onClick={onClick} />;
};
