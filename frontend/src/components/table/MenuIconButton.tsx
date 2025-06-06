import React from "react";
import { IconButton, SxProps } from "@mui/material";
import { Theme } from "@mui/material/styles";

interface MenuIconButtonProps {
    buttonProps: {
        onClick?: (event: React.MouseEvent<HTMLElement>) => void;
        sx?: SxProps<Theme>;
    };
    iconProps: {
        icon: React.ReactElement;
        sx?: SxProps<Theme>;
    }
}

const MenuIconButton: React.FC<MenuIconButtonProps> = ({ buttonProps, iconProps }) => {
    const combinedIconSx: SxProps<Theme> = {
        ...(iconProps.icon.props.sx as object),
        ...(iconProps.sx || {}),
    };

    const renderedIcon = React.cloneElement(iconProps.icon, {
        sx: combinedIconSx,
    });

    return (
        <IconButton
            onClick={buttonProps.onClick}
            sx={{
                fontSize: "16px",
                ":hover": {
                    backgroundColor: "transparent",
                    px: 0,
                },
                ...(buttonProps.sx || {}),
            }}
        >
            {renderedIcon}
        </IconButton>
    );
};

export default MenuIconButton;
