import { CloseIcon } from "@/icon";
import { Box, IconButton, Typography } from "@mui/material";

interface CustomChipProps {
	label: string;
	onDelete: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const CustomChip: React.FC<CustomChipProps> = ({ label, onDelete }) => (
	<Box
		sx={{
			display: "flex",
			alignItems: "center",
			backgroundColor: "rgba(255, 255, 255, 1)",
			border: "1px solid rgba(229, 229, 229, 1)",
			borderRadius: "3px",
			px: 1,
			mr: 1,
			py: 0.5,
			fontSize: "12px",
		}}
	>
		<IconButton
			size="medium"
			onClick={(e) => {
				e.stopPropagation();
				onDelete(e);
			}}
			sx={{ p: 0, mr: 0.5 }}
		>
			<CloseIcon sx={{ fontSize: "14px" }} />
		</IconButton>
		<Typography className="table-data">{label}</Typography>
	</Box>
);
