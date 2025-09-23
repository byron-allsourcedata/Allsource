import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";
import { FileUploadOutlined } from "@mui/icons-material";
import { Box, styled } from "@mui/material";
import { useState, type FC } from "react";
import {
	useFileDragAndDrop,
	useInitialHeight,
	usePageDragging,
	type FileDnd,
} from "../hooks/useFileDragAndDrop";
import type { DayCalendarProps } from "@mui/x-date-pickers/internals";

type Props = {
	dndProps: FileDnd;
	onClick: () => void;
};

export const PremiumSourceUpload: FC<Props> = ({ dndProps, onClick }) => {
	const [contentRef, contentHeight] = useInitialHeight<HTMLDivElement>();
	const pageDragging = usePageDragging();
	const { dragging, droppedFiles, ...dragProps } = dndProps;

	const state = dragging ? "dragover" : pageDragging ? "page" : "static";

	const contents = {
		static: <DefaultContent onUploadClick={onClick} />,
		dragover: <PageDragContent />,
		page: <PageDragContent />,
	};

	return (
		<DropContainer {...dragProps} dragging={dragging}>
			<Column
				gap="0.5rem"
				alignItems="center"
				ref={contentRef}
				height={contentHeight ?? undefined}
			>
				{contents[state]}
			</Column>
		</DropContainer>
	);
};

type DefaultContentProps = {
	onUploadClick: () => void;
};

const DefaultContent: FC<DefaultContentProps> = ({ onUploadClick }) => {
	return (
		<>
			<Column gap="0.375rem" alignItems="center">
				<UploadIconBox>
					<UploadIcon />
				</UploadIconBox>
				<DragText>Drag & drop</DragText>
			</Column>
			<OrText>OR </OrText>
			<UploadText onClick={onUploadClick}>Upload a file</UploadText>
		</>
	);
};

const PageDragContent: FC = () => {
	return (
		<Column height="inherit" justifyContent="center">
			<T>Drop here!</T>
		</Column>
	);
};

type DropContainerProps = {
	dragging: boolean;
};

const DropContainer = styled(Column, {
	shouldForwardProp: (propName) => propName !== "dragging",
})<DropContainerProps>`
    display: flex;
    
    padding: 1rem 8px;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;

    border-radius: 4px;
    border: 1px dashed #3898FC;
    background: #FFF;

    transition: background 0.1s ease-in-out;

    ${({ dragging }) => dragging && "background: #EBF5FF;"}
    :hover {
        border-radius: 4px;
        background: #EBF5FF;
    }
`;

const UploadIconBox = styled(Box)`
    display: flex;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 4px;
    background: rgba(56, 152, 252, 0.10);
    justify-content: center;
    align-items: center;
`;

const UploadIcon = styled(FileUploadOutlined)`
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: #3898FC;
`;

const DragText = styled(T)`
    color: #202124;
    font-size: 14px;
    font-weight: 500;
`;

const OrText = styled(T)`
    color: #202124;
    font-size: 12px;
    line-height: 140%; /* 16.8px */;
`;

const UploadText = styled(T)`
    color: #3898FC;
    font-family: "Nunito Sans";
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 140%; /* 19.6px */
    cursor: pointer;
    :hover {
        
        text-decoration: underline;
    }
`;
