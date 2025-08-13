import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	Typography,
} from "@mui/material";

interface ConfirmPlanChangeDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	user: {
		name: string;
		email: string;
		joinDate: string;
		currentPlan: string;
	};
	newPlan: string;
}

export const ConfirmPlanChangeDialog: React.FC<
	ConfirmPlanChangeDialogProps
> = ({ open, onClose, onConfirm, user, newPlan }) => {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle className="modal-heading">Confirm your action</DialogTitle>
			<DialogContent>
				<Typography className="modal-text" sx={{ mb: 2 }}>
					Are you sure you want to move this user to <strong>{newPlan}</strong>{" "}
					plan?
				</Typography>

				<Typography className="modal-text" sx={{ mb: 1 }}>
					USER DETAILS
				</Typography>

				<Grid container spacing={1}>
					{[
						{ label: "Name", value: user.name },
						{ label: "Email", value: user.email },
						{
							label: "Join Date",
							value: new Date(user.joinDate).toLocaleDateString("en-US", {
								year: "numeric",
								month: "short",
								day: "2-digit",
							}),
						},
						{ label: "Current Plan", value: user.currentPlan },
					].map(({ label, value }) => (
						<Grid
							item
							xs={12}
							key={label}
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								py: 0.5,
							}}
						>
							<Typography className="modal-text">{label}</Typography>
							<Typography
								className="modal-text-semibold"
								sx={{ textAlign: "right" }}
							>
								{value}
							</Typography>
						</Grid>
					))}
				</Grid>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2, justifyContent: "flex-end", gap: 2 }}>
				<Button
					variant="outlined"
					onClick={onClose}
					sx={{
						fontFamily: "var(--font-nunito)",
						height: 36,
						fontSize: "0.8rem",
						textTransform: "none",
						border: "1px solid rgba(56, 152, 252, 1)",
						color: "rgba(56, 152, 252, 1)",
						"&:hover": {
							borderColor: "rgba(56, 152, 252, 1)",
						},
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={onConfirm}
					sx={{
						fontFamily: "var(--font-nunito)",
						height: 36,
						fontSize: "0.8rem",
						textTransform: "none",
						backgroundColor: "rgba(56, 152, 252, 1)",
						color: "#fff",
						"&:hover": {
							backgroundColor: "rgba(56, 152, 252, 1)",
						},
						"&.Mui-disabled": {
							backgroundColor: "rgba(80, 82, 178, 0.6)",
							color: "#fff",
						},
					}}
				>
					Confirm
				</Button>
			</DialogActions>
		</Dialog>
	);
};
