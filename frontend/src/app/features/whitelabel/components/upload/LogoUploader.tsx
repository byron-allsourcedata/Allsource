import type { FC, ReactNode } from "react";
import { DraggingFileUpload } from "./UploadedLogo";
import { UploadLogo } from "./UploadLogo";
import { useInitialHeight } from "../../hooks/useInitialHeight";
import { FileCard } from "./BadUpload";
import { formatBytes } from "@/utils/format";
import { useFileDragAndDrop } from "@/components/premium-sources/hooks/useFileDragAndDrop";
import { Column } from "@/components/Column";
import { Skeleton } from "@mui/material";

type Props = {
	loading: boolean;
	selectedFile: File | null;
	isDragging: boolean;
	allowedTypes?: string[];
	logoUrl?: string;
	maxSize?: number;
	onOpenFilePicker: () => void;
	onFileSelect: (newFile: File) => void;
	onRemoveFile: () => void;
	image?: {
		width?: number;
		height?: number;
	};
};

export const LogoUploader: FC<Props> = ({
	loading,
	selectedFile,
	isDragging,
	logoUrl,
	allowedTypes,
	maxSize,
	onOpenFilePicker,
	onFileSelect,
	onRemoveFile,
	image,
}) => {
	const [initialHeight, elementRef] = useInitialHeight();

	const dragProps = useFileDragAndDrop(["image/png", "image/svg+xml"]);

	const { dragging, droppedFiles, ...handlers } = dragProps;

	const onFilesDrop = (event: React.DragEvent<Element>) => {
		const files = event.dataTransfer.files;

		if (files.length > 0) {
			const file = files[0];
			const contentType = file.type;

			if (["image/png", "image/svg+xml"].find((ff) => ff === contentType)) {
				onFileSelect(files[0]);
			}
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

	if (loading) {
		return wrap(<Skeleton height="4.5rem" variant="rounded" />);
	}

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
				onDelete={onRemoveFile}
			/>,
		);
	}

	return wrap(
		<UploadLogo
			sizes={image}
			containerRef={elementRef}
			dragProps={dragHandlers}
			onClick={onOpenFilePicker}
		/>,
	);
};
