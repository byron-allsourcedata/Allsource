import { Button, styled } from "@mui/material";
import { FC } from "react";

type Props = {
    isActive: boolean;
    label: string;
    disabled?: boolean;
    onClick: () => void;
};

const B = styled(Button)`
    width: 100%;
    height: 40;
    border-radius: 4px;

    padding-top: 10px;
    padding-right: 24px;
    padding-bottom: 10px;
    padding-left: 24px;

    background: #3898fc;

    box-shadow: 0px 1px 2px 0px #00000040;
`;

export const PlanButton: FC<Props> = (props) => {
    const { isActive, label, disabled, onClick } = props;

    return (
        <Button
            className="hyperlink-red"
            variant="outlined"
            fullWidth
            onClick={() => onClick()}
            disabled={isActive}
            sx={{
                color: isActive
                    ? "#5f6368 !important"
                    : "rgba(56, 152, 252, 1) !important",
                backgroundColor: isActive ? "#e7e7e7" : "transparent",
                borderRadius: "4px",
                border: isActive
                    ? "1px solid #f8464b"
                    : "1px solid rgba(56, 152, 252, 1)",
                boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.25)",
                textTransform: "none",
                padding: "9px 24px",
                "&:hover": {
                    backgroundColor: "rgba(56, 152, 252, 1)",
                    color: "#fff !important",
                },
                "&:disabled": {
                    opacity: 0.4,
                },
            }}
        >
            {label}
        </Button>
    );
};
