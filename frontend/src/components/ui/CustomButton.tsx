import type React from "react";
import {
	Button,
	type ButtonProps,
	type SxProps,
	type Theme,
} from "@mui/material";

interface CustomButtonProps extends Omit<ButtonProps, "sx"> {
	children: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	variant?: "contained" | "outlined";
	disabled?: boolean;
	sx?: SxProps<Theme>;
}

const CustomButton: React.FC<CustomButtonProps> = ({
	children,
	onClick,
	variant = "contained",
	disabled = false,
	sx,
	...muiButtonProps
}) => {
	const textStyles: SxProps<Theme> = {
		textTransform: "none",
		fontFamily: "var(--font-nunito)",
		fontWeight: 600,
		fontSize: "14px",
		lineHeight: "140%",
		letterSpacing: 0,
	};

	const baseStyles: SxProps<Theme> = {
		...textStyles,
		borderRadius: "4px",
		gap: "10px",
		p: "10px 24px",
		transition: "opacity 0.2s ease-in-out",
	};

	const variantStyles: Record<"contained" | "outlined", SxProps<Theme>> = {
		contained: {
			backgroundColor: "rgba(56, 152, 252, 1)",
			boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
			transition:
				"background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
			color: "rgba(255, 255, 255, 1)",
			borderRadius: "4px",
			"&:hover": {
				backgroundColor: "rgba(30, 136, 229, 1)",
				boxShadow:
					"0 1px 2px 0 rgba(0, 0, 0, 0.25), 0 2px 8.6px 0 rgba(0, 0, 0, 0.18)",
			},
			"&:active": {
				backgroundColor: "rgba(116, 183, 253, 1)",
				boxShadow:
					"0 1px 10px 0 rgba(0, 0, 0, 0.12), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 2px 4px -1px rgba(0, 0, 0, 0.20)",
			},
			"&:disabled": {
				color: "rgba(255, 255, 255, 1)",
				backgroundColor: "rgba(56, 152, 252, 1)",
				opacity: 0.6,
				boxShadow: "none",
			},
		},
		outlined: {
			border: "1px solid rgba(56, 152, 252, 1)",
			color: "rgba(56, 152, 252, 1)",
			boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
			backgroundColor: "transparent",
			transition:
				"background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
			borderRadius: "4px",
			"&:hover": {
				boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
				border: "1px solid rgba(30, 136, 229, 1)",
			},
			"&:active": {
				boxShadow: "none",
				border: "1px solid rgba(56, 152, 252, 1)",
			},
			"&:disabled": {
				opacity: 0.6,
				boxShadow: "none",
				border: "1px solid rgba(56, 152, 252, 1)",
			},
		},
	};

	const combinedSx: SxProps<Theme> = {
		...baseStyles,
		...variantStyles[variant],
		...(sx as object),
	};

	return (
		<Button
			onClick={onClick}
			variant={variant}
			disabled={disabled}
			sx={combinedSx}
			{...muiButtonProps}
		>
			{children}
		</Button>
	);
};

export default CustomButton;
