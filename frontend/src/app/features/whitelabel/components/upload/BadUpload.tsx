import type { FC } from "react";
import { Box, Typography, IconButton, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Column } from "@/components/Column";
import Image from "next/image";

const StyledErrorBox = styled(Column)`
  border: 1px dashed #d32f2f;
  background-color: #fdecea;
  color: #d32f2f;
  padding: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledFileCard = styled(Paper)`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-top: 12px;
  gap: 16px;
`;

type ErrorBoxProps = {
	message: string;
};

export const ErrorBox: FC<ErrorBoxProps> = ({ message }) => (
	<StyledErrorBox>
		<CloseIcon />
		<Typography>{message}</Typography>
	</StyledErrorBox>
);

type FileCardProps = {
	filename: string;
	size: string | undefined;
	logoSrc?: string;
	onDelete?: () => void;
	width?: number;
	height?: number;
};

export const FileCard: FC<FileCardProps> = ({
	filename,
	size,
	logoSrc,
	onDelete,
	width,
	height,
}) => (
	<StyledFileCard
		elevation={0}
		variant="outlined"
		sx={{ display: "flex", alignItems: "center", gap: 1 }}
	>
		{logoSrc ? (
			<img
				src={logoSrc}
				alt={filename}
				width={width ?? "40px"}
				height={height ?? "40px"}
			/>
		) : (
			<Box width={width ?? 40} height={height ?? 40} />
		)}

		<Box sx={{ minWidth: 0, flexGrow: 1 }}>
			<Typography
				noWrap
				sx={{
					textOverflow: "ellipsis",
					overflow: "hidden",
					whiteSpace: "nowrap",
				}}
			>
				{filename}
			</Typography>
			{size && (
				<Typography
					variant="body2"
					color="text.secondary"
					noWrap
					sx={{
						textOverflow: "ellipsis",
						overflow: "hidden",
						whiteSpace: "nowrap",
					}}
				>
					{size}
				</Typography>
			)}
		</Box>

		<IconButton aria-label="delete" onClick={onDelete}>
			<DeleteOutlineIcon />
		</IconButton>
	</StyledFileCard>
);
