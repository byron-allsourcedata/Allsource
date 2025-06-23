import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useReturnToAdmin } from "@/hooks/useReturnToAdmin";

type Props = {
	setVisibleButton?: (value: boolean) => void;
	setBackButton?: (value: boolean) => void;
};

export const ReturnToAdminButton = ({ setVisibleButton, setBackButton }: Props) => {
	const returnToAdmin = useReturnToAdmin();

	const handleClick = async () => {
		await returnToAdmin({
			onAfterUserData: () => {
				setVisibleButton?.(false);
				setBackButton?.(false);
			},
		});
	};

	return (
		<Button
			onClick={handleClick}
			variant="text"
			startIcon={<ArrowBackIcon />}
			sx={{
				fontFamily: "Nunito Sans",
				fontSize: "16px",
				fontWeight: 600,
				textTransform: "none",
				color: "#3898FC",
				backgroundColor: "transparent",
				boxShadow: "none",
				"&:hover": {
					backgroundColor: "transparent",
					color: "#3898FC",
					boxShadow: "none",
				},
			}}
		>
			Return to Admin
		</Button>
	);
};
