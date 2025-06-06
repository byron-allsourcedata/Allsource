import { Check, Clear } from "@mui/icons-material";
import { SxProps } from "@mui/material";
import { FC } from "react";

type AdvantageMarkProps = {
    good: boolean;
};
export const AdvantageMark: FC<AdvantageMarkProps> = (props) => {
    const { good } = props;

    const sx: SxProps = {
        padding: 0,
        width: "1.5rem",
        height: "1.5rem",
        display: "block",
    };

    return good ? (
        <Check htmlColor="#4A9E4F" sx={sx} />
    ) : (
        <Clear htmlColor="#E65A59" sx={sx} />
    );
};
