import { Add } from "@mui/icons-material";
import { Box, styled } from "@mui/material";
import type { FC } from "react";

type Props = {
	onClick: () => void;
};

export const AddButton: FC<Props> = ({ onClick }) => {
	return (
		<MainBox onClick={onClick}>
			<StyledAdd />
		</MainBox>
	);
};

const MainBox = styled(Box)`
    display: flex;
    width: 62px;
    height: 62px;
    padding: 8px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px dashed #3898FC;
    background: #FFF;
    flex-shrink: 0;
    cursor: pointer;

    transition: background 0.2s ease-in-out;

    :hover {
        border-radius: 6px;
        background: #EBF5FF;
    }
`;

const StyledAdd = styled(Add)`
    display: flex;
    width: 32px;
    height: 32px;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    color: #3898FC;
`;
