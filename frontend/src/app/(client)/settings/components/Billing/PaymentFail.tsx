import React, { useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	Typography,
	Switch,
	Box,
	Radio,
	RadioGroup,
	Grid,
	CardActions,
	Card,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CloseIcon from "@mui/icons-material/Close";
import LegendToggleOutlinedIcon from "@mui/icons-material/LegendToggleOutlined";
import AllInboxOutlinedIcon from "@mui/icons-material/AllInboxOutlined";
import CustomButton from "@/components/ui/CustomButton";

interface PaymentPopupProps {
	open: boolean;
	cardDetails: any
}

const PaymentFail: React.FC<PaymentPopupProps> = ({
	open,
	cardDetails
}) => {
	const router = useRouter();
	console.log({open})


	const handlePay = () => {}
	const onClose = () => {}

	const addCardStyles = {
		switchStyle: {
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
		},
		imageStyle: {
			width: 87,
			height: 78,
			borderRadius: "4px",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			backgroundImage: "url(/danger-fill-icon.svg)",
		},
		wrapStripeInput: {
			border: "1px solid #ddd",
			borderRadius: "4px",
			padding: "10px",
		},
	};

	const [selectedCard, setSelectedCard] = useState<string>("visa");

	const handleCardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	  setSelectedCard(event.target.value);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ padding: 3 }} className="first-sub-title">
				Complete Your Payment
			</DialogTitle>
			<Divider />
			<DialogContent>
				<Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", my: 2 }}>
					<Box sx={{display: "flex", justifyContent: "center"}}><Box sx={addCardStyles.imageStyle} /></Box>
					<Typography className="hyperlink-red" sx={{textAlign: "center"}}>Your access has been paused because your last payment failed. To restore full functionality, please complete the payment below.</Typography>
				</Box>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						<Typography className="first-sub-title">Payment Method:</Typography>
					</Box>
					<Box sx={{ display: "flex", gap: 2}}>
						<RadioGroup value={selectedCard} onChange={handleCardChange} sx={{width: "100%", gap: 2}}>
							<Box sx={{ display: "flex", alignItems: "start", width: "100%", gap: 2, border: "1px solid #ddd", borderRadius: 2, p: 2 }}>
								<Radio value="visa" />
								<Box sx={{ display: "flex", flexDirection: "column", width: "100%", justifyContent: "center", flexGrow: 1 }}>
									<Typography sx={{ fontWeight: 600 }}>Visa (**** 5555)</Typography>
									<Typography sx={{ fontSize: "0.875rem", color: "gray" }}>Expire date: 08/29</Typography>
								</Box>
								<Typography
									className="main-text"
									sx={{
										borderRadius: "4px",
										background: "#eaf8dd",
										color: "#2b5b00",
										fontSize: "12px",
										fontWeight: "600",
										padding: "2px 12px",
									}}
								>
									Default
								</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 2, border: "1px solid #ddd", borderRadius: 2, p: 2 }}>
								<Radio value="amex" />
								<Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
									<Typography sx={{ fontWeight: 600 }}>American Express (**** 5555)</Typography>
									<Typography sx={{ fontSize: "0.875rem", color: "gray" }}>Expire date: 05/30</Typography>
								</Box>
							</Box>
						</RadioGroup>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<CustomButton variant="contained" onClick={handlePay}>
					Pay
				</CustomButton>
			</DialogActions>
		</Dialog>
	);
};

export default PaymentFail;
