import { LinearProgress, styled } from "@mui/material";

export const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
	height: 4,
	borderRadius: 0,
	backgroundColor: "#c6dafc",
	"& .MuiLinearProgress-bar": {
		borderRadius: 5,
		backgroundColor: "#4285f4",
	},
}));
