import { Divider, styled, Typography } from "@mui/material";
import { FC } from "react";
import { AdvantageMark } from "./AdvantageMark";
import { Row } from "@/components/Row";
import { Column } from "@/components/Column";
import { Advantage } from "./Advantages";

const AdvantageName = styled(Typography)`
    font-family: Nunito Sans;
    font-weight: 600;
    white-space: nowrap;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    vertical-align: middle;
    color: #20212499;
`;

const AdvantageValue = styled(Typography)`
    font-family: Nunito Sans;
    font-weight: 500;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    text-align: right;
    white-space: nowrap;
    vertical-align: middle;
    color: #202124;
`;

type AdvantageRowProps = {
    advantage: Advantage;
    addDivider?: boolean;
};

export const AdvantageRow: FC<AdvantageRowProps> = (props) => {
    const { addDivider, advantage } = props;

    return (
        <Column gap="0.25rem">
            <Row justifyContent="space-between" gap="0.25rem">
                <Row gap="0.5rem">
                    <AdvantageMark good={advantage.good} />
                    <AdvantageName>{advantage.name}</AdvantageName>
                </Row>
                <AdvantageValue>{advantage.value}</AdvantageValue>
            </Row>
            {addDivider && <Divider />}
        </Column>
    );
};
