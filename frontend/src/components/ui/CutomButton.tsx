import React from "react";
import { Button, SxProps, Theme } from "@mui/material";

interface CustomButtonProps {
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
}) => {
  const textStyles: SxProps<Theme> = {
    textTransform: "none",
    fontFamily: "Nunito Sans",
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
  };

  const variantStyles: Record<"contained" | "outlined", SxProps<Theme>> = {
    contained: {
      backgroundColor: "rgba(56, 152, 252, 1)",
      boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
      color: "rgba(255, 255, 255, 1)",
      "&:hover": {
        backgroundColor: "rgba(30, 136, 229, 1)",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
      },
      "&:active": {
        backgroundColor: "rgba(116, 183, 253, 1)",
        boxShadow: "none",
      },
      "&:disabled": {
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
      "&:hover": {
        backgroundColor: "rgba(30, 136, 229, 1)",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
        color: "rgba(255, 255, 255, 1)",
        border: "1px solid rgba(30, 136, 229, 1)",
      },
      "&:active": {
        backgroundColor: "rgba(116, 183, 253, 1)",
        color: "rgba(255, 255, 255, 1)",
        boxShadow: "none",
        border: "1px solid rgba(116, 183, 253, 1)",
      },
      "&:disabled": {
        backgroundColor: "rgba(56, 152, 252, 1)",
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
    >
      {children}
    </Button>
  );
};

export default CustomButton;
