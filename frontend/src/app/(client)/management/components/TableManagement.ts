import type { SxProps, Theme } from "@mui/system";

export const style: { [key: string]: SxProps<Theme> } = {
	actionButtonText: {
		textTransform: "none",
		textDecoration: "none",
		fontFamily: "Roboto",
		fontWeight: 400,
		fontSize: "14px",
		color: "rgba(32, 33, 36, 1)",
		justifyContent: "flex-start",
		width: "100%", // можно убрать для автоширины, оставить — если хочешь выравнивание по левому краю
		textAlign: "left",
		padding: "6px 12px",
	},
};
