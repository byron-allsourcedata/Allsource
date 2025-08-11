import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type FileDnd = {
	clear: () => void;
} & FileDndState &
	FileDndProps;

export type FileDndState = {
	dragging: boolean;
	droppedFiles: File[];
};

export type FileDndProps = {
	onDragEnter: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onDragEnd: (e: React.DragEvent) => void;
};

export const useFileDragAndDrop: (allowedTypes: string[]) => FileDnd = (
	allowedTypes,
) => {
	const [dragging, setDragging] = useState(false);

	const [draggingFiles, setDraggingFiles] = useState<File[]>([]);

	const updateFiles = (files: FileList | null) => {
		if (files) {
			const savedFiles: File[] = [];

			for (let i = 0; i < files.length; i++) {
				const item = files.item(i);
				if (item != null) {
					savedFiles.push(item);
				}
			}

			setDraggingFiles(
				savedFiles.filter((f) => allowedTypes.find((ff) => ff === f.type)),
			);
		}
	};

	return {
		dragging,
		droppedFiles: draggingFiles,
		clear: () => setDraggingFiles([]),
		onDragEnter: (e: React.DragEvent) => {
			e.preventDefault();
			const files = e.dataTransfer.files;

			updateFiles(files);
			return setDragging(true);
		},

		onDragEnd: (e: React.DragEvent) => {
			e.preventDefault();
			return setDragging(false);
		},

		onDrop: (e: React.DragEvent) => {
			e.preventDefault();
			const files = e.dataTransfer.files;

			console.log(`Dropped files ${files}`);

			updateFiles(files);
			setDragging(false);
		},
		onDragLeave: (e: React.DragEvent) => {
			e.preventDefault();
			return setDragging(false);
		},

		onDragOver: (e: React.DragEvent) => {
			e.preventDefault();
		},
	};
};

export function usePageDragging(): boolean {
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		let dragCounter = 0;

		function onDragEnter(e: DragEvent) {
			if (e.dataTransfer?.types.includes("Files")) {
				dragCounter++;
				setDragging(true);
			}
		}

		function onDragLeave() {
			dragCounter--;
			if (dragCounter <= 0) setDragging(false);
		}

		function onDrop() {
			dragCounter = 0;
			setDragging(false);
		}

		window.addEventListener("dragenter", onDragEnter);
		window.addEventListener("dragleave", onDragLeave);
		window.addEventListener("drop", onDrop);

		return () => {
			window.removeEventListener("dragenter", onDragEnter);
			window.removeEventListener("dragleave", onDragLeave);
			window.removeEventListener("drop", onDrop);
		};
	}, []);

	return dragging;
}

export function useInitialHeight<T extends HTMLElement>(): [
	React.RefObject<T>,
	number | null,
] {
	const ref = useRef<T>(null);
	const [height, setHeight] = useState<number | null>(null);

	useLayoutEffect(() => {
		if (ref.current) {
			setHeight(ref.current.offsetHeight);
		}
	}, []);

	return [ref, height] as const;
}
