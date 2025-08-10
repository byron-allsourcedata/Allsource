import type { FC } from "react";
import { DraggingFileUpload } from "./UploadedLogo";
import { UploadLogo } from "./UploadLogo";
import { useInitialHeight } from "../../hooks/useInitialHeight";
import { FileCard } from "./BadUpload";
import { formatBytes } from "@/utils/format";

type Props = {
	selectedFile: File | null;
	isDragging: boolean;
	allowedTypes?: string[];
	maxSize?: number;
	onFileSelect: (newFile: File) => void;
	onRemoveFile: () => void;
};

export const LogoUploader: FC<Props> = ({
	selectedFile,
	isDragging,
	allowedTypes,
	maxSize,
	onFileSelect,
	onRemoveFile,
}) => {
	const [initialHeight, elementRef] = useInitialHeight();

	console.log(initialHeight);
	if (isDragging) {
		return (
			<DraggingFileUpload
				containerRef={elementRef}
				sx={{
					height: initialHeight > 0 ? initialHeight : undefined,
				}}
			/>
		);
	}

	if (selectedFile) {
		return (
			<FileCard
				filename={selectedFile.name}
				size={formatBytes(selectedFile.size)}
			/>
		);
	}

	return <UploadLogo containerRef={elementRef} />;
};
