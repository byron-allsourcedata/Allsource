import {
	Button,
	DialogActions,
	DialogContent,
	DialogContentText,
	Popover,
	Typography,
	type PopoverProps,
} from "@mui/material";
import React from "react";

type Props = {
	confirmAction: () => void;
	handleCloseConfirmDialog: () => void;
	openConfirmDialog: boolean;
	anchorEl: PopoverProps["anchorEl"];
	title: string;
	description: string;
	successButtonText?: string;
};

const ConfirmDialogPopover: React.FC<Props> = ({
	openConfirmDialog,
	confirmAction,
	handleCloseConfirmDialog,
	anchorEl,
	title,
	description,
	successButtonText,
}) => {
	return (
		<Popover
			open={openConfirmDialog}
			onClose={handleCloseConfirmDialog}
			anchorEl={anchorEl}
			anchorOrigin={{
				vertical: "bottom",
				horizontal: "right",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "center",
			}}
			slotProps={{
				paper: {
					sx: {
						padding: "0.125rem",
						width: "15.875rem",
						boxShadow: 0,
						borderRadius: "8px",
						border: "0.5px solid rgba(175, 175, 175, 1)",
					},
				},
			}}
		>
			<Typography
				className="first-sub-title"
				sx={{
					paddingLeft: 2,
					pt: 1,
					pb: 0,
				}}
			>
				{title}
			</Typography>
			<DialogContent sx={{ padding: 2 }}>
				<DialogContentText className="table-data">
					{description}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button
					className="second-sub-title"
					onClick={handleCloseConfirmDialog}
					sx={{
						backgroundColor: "#fff",
						color: "rgba(56, 152, 252, 1) !important",
						fontSize: "14px",
						textTransform: "none",
						padding: "0.75em 1em",
						border: "1px solid rgba(56, 152, 252, 1)",
						maxWidth: "50px",
						maxHeight: "30px",
						"&:hover": {
							backgroundColor: "#fff",
							boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
						},
					}}
				>
					Cancel
				</Button>
				<Button
					className="second-sub-title"
					onClick={confirmAction}
					sx={{
						backgroundColor: "rgba(56, 152, 252, 1)",
						color: "#fff !important",
						fontSize: "14px",
						textTransform: "none",
						padding: "0.75em 1em",
						border: "1px solid rgba(56, 152, 252, 1)",
						maxWidth: "60px",
						maxHeight: "30px",
						"&:hover": {
							backgroundColor: "rgba(56, 152, 252, 1)",
							boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
						},
					}}
				>
					{successButtonText ?? "Delete"}
				</Button>
			</DialogActions>
		</Popover>
	);
};

export default ConfirmDialogPopover;
