import type { FC, ReactNode } from "react";
import { DraggingFileUpload } from "./UploadedLogo";
import { UploadLogo } from "./UploadLogo";
import { useInitialHeight } from "../../hooks/useInitialHeight";
import { FileCard } from "./BadUpload";
import { formatBytes } from "@/utils/format";
import { useBlobUrl } from "../../hooks/useBlobUrl";
import { useFileDragAndDrop } from "@/components/premium-sources/hooks/useFileDragAndDrop";
import { Column } from "@/components/Column";

type Props = {
	selectedFile: File | null;
	isDragging: boolean;
	allowedTypes?: string[];
	maxSize?: number;
	onFileSelect: (newFile: File) => void;
	onRemoveFile: () => void;
	image?: {
		width?: number;
		height?: number;
	};
};

export const LogoUploader: FC<Props> = ({
	selectedFile,
	isDragging,
	allowedTypes,
	maxSize,
	onFileSelect,
	onRemoveFile,
	image,
}) => {
	const [initialHeight, elementRef] = useInitialHeight();
	const logoUrl = useBlobUrl(selectedFile);

	const dragProps = useFileDragAndDrop(["image/png"]);

	const { dragging, droppedFiles, ...handlers } = dragProps;

	const onFilesDrop = (event: React.DragEvent<Element>) => {
		const files = event.dataTransfer.files;

		console.log("on files drop");
		if (files.length > 0) {
			console.dir(files[0]);
			onFileSelect(files[0]);
		}

		dragProps.onDrop(event);
	};

	const dragHandlers = {
		...dragProps,
		onDrop: onFilesDrop,
	};

	const wrap = (content: ReactNode) => {
		return (
			<Column ref={elementRef} {...dragHandlers}>
				{content}
			</Column>
		);
	};

	if (isDragging) {
		return wrap(
			<DraggingFileUpload
				sx={{
					height: initialHeight > 0 ? initialHeight : undefined,
				}}
			/>,
		);
	}

	if (selectedFile) {
		return wrap(
			<FileCard
				filename={selectedFile.name}
				logoSrc={logoUrl}
				size={formatBytes(selectedFile.size)}
				width={image?.width}
				height={image?.height}
			/>,
		);
	}

	return wrap(
		<UploadLogo containerRef={elementRef} dragProps={dragHandlers} />,
	);
};
