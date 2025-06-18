import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	FormControlLabel,
	Switch,
	Checkbox,
	Button,
	Box,
	Typography,
} from "@mui/material";

type PaymentPopupProps = {
	open: boolean;
	onClose: () => void;
};

const AddCardPopup: React.FC<PaymentPopupProps> = ({ open, onClose }) => {
	const [checked, setChecked] = useState(false);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Complete Your Payment</DialogTitle>
			<DialogContent>
				<Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
					<Box
						sx={{
							width: 290,
							height: 190,
							borderRadius: "4px",
							backgroundPosition: "center",
							backgroundRepeat: "no-repeat",
							backgroundImage: "url(/bank_card.svg)",
						}}
					/>
				</Box>
				<Box component="form" noValidate autoComplete="off">
					<TextField
						fullWidth
						label="Card Number"
						placeholder="Your card number"
						margin="normal"
						variant="outlined"
					/>
					<Box sx={{ display: "flex", gap: 2 }}>
						<TextField
							label="Exp. Date"
							placeholder="MM/YY"
							variant="outlined"
							fullWidth
						/>
						<TextField
							label="CVV"
							placeholder="123"
							variant="outlined"
							fullWidth
						/>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center" }}>
						<Switch
							checked={checked}
							onChange={() => setChecked((prev) => !prev)}
							sx={{
								"& .MuiSwitch-switchBase": {
									"&+.MuiSwitch-track": {
										backgroundColor: "rgba(163, 176, 194, 1)",
										opacity: 1,
									},
									"&.Mui-checked": {
										color: "#fff",
										"&+.MuiSwitch-track": {
											backgroundColor: "rgba(56, 152, 252, 1)",
											opacity: 1,
										},
									},
								},
							}}
						/>
						<Typography>Set as default</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} variant="outlined">
					Back
				</Button>
				<Button variant="contained" color="primary">
					Pay
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AddCardPopup;
