import {
	Box,
	Button,
	Popover,
	TextField,
	Typography,
	type PopoverProps,
} from "@mui/material";
import React, { Dispatch, SetStateAction } from "react";

type Props = {
	handleConfirmRename: () => void;
	handleClose: () => void;
	openPopover: boolean;
	anchorEl: PopoverProps["anchorEl"];
	editedName: string;
	setEditedName: Dispatch<SetStateAction<string>>;
	label: string;
};

const EditNamePopover: React.FC<Props> = ({
	openPopover,
	handleConfirmRename,
	handleClose,
	anchorEl,
	editedName,
	setEditedName,
	label,
}) => {
	return (
		<Popover
			open={openPopover}
			anchorEl={anchorEl}
			onClose={handleClose}
			anchorOrigin={{
				vertical: "center",
				horizontal: "center",
			}}
			transformOrigin={{
				vertical: "top",
				horizontal: "left",
			}}
			slotProps={{
				paper: {
					sx: {
						width: "15.875rem",
						boxShadow: 0,
						borderRadius: "4px",
						border: "0.5px solid rgba(175, 175, 175, 1)",
					},
				},
			}}
		>
			<Box sx={{ p: 2 }}>
				<TextField
					value={editedName}
					onChange={(e) => setEditedName(e.target.value)}
					variant="outlined"
					label={label}
					size="small"
					fullWidth
					sx={{
						"& label.Mui-focused": {
							color: "rgba(56, 152, 252, 1)",
						},
						"& .MuiOutlinedInput-root:hover fieldset": {
							color: "rgba(56, 152, 252, 1)",
						},
						"& .MuiOutlinedInput-root": {
							"&:hover fieldset": {
								borderColor: "rgba(56, 152, 252, 1)",
								border: "1px solid rgba(56, 152, 252, 1)",
							},
							"&.Mui-focused fieldset": {
								borderColor: "rgba(56, 152, 252, 1)",
								border: "1px solid rgba(56, 152, 252, 1)",
							},
						},
					}}
					InputProps={{
						style: {
							fontFamily: "var(--font-roboto)",
							fontSize: "14px",
						},
					}}
					InputLabelProps={{
						style: {
							fontSize: "14px",
							fontFamily: "var(--font-roboto)",
						},
					}}
				/>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						mt: 2,
					}}
				>
					<Button
						onClick={handleClose}
						sx={{
							backgroundColor: "#fff",
							color: "rgba(56, 152, 252, 1) !important",
							fontSize: "14px",
							textTransform: "none",
							padding: "0.75em 1em",
							maxWidth: "50px",
							maxHeight: "30px",
							mr: 0.5,
							"&:hover": {
								backgroundColor: "#fff",
								boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
							},
						}}
					>
						<Typography
							className="second-sub-title"
							sx={{
								color: "rgba(56, 152, 252, 1) !important",
							}}
						>
							Cancel
						</Typography>
					</Button>
					<Button
						onClick={() => {
							handleConfirmRename();
							handleClose();
						}}
						sx={{
							backgroundColor: "#fff",
							color: "rgba(56, 152, 252, 1) !important",
							fontSize: "14px",
							textTransform: "none",
							padding: "0.75em 1em",
							maxWidth: "50px",
							maxHeight: "30px",
							"&:hover": {
								backgroundColor: "#fff",
								boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
							},
						}}
					>
						<Typography
							className="second-sub-title"
							sx={{
								color: "rgba(56, 152, 252, 1) !important",
							}}
						>
							Save
						</Typography>
					</Button>
				</Box>
			</Box>
		</Popover>
	);
};

export default EditNamePopover;
