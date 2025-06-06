import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { styled, Table, TableBody, Typography } from "@mui/material";
import { FC, ReactNode } from "react";
import { AdvantageMark } from "./AdvantageMark";
import { AdvantageRow } from "./AdvantageRow";
import { Advantage } from "./Advantages";

type Props = {
    icon: ReactNode;
    title: string;
    advantages: Advantage[];
    showLastDivider: boolean;
};

const T = Typography;
const Title = styled(Typography)`
    font-family: Nunito Sans;
    font-weight: 600;
    font-size: 14px;
    line-height: 22px;
    letter-spacing: 0%;
    vertical-align: middle;
    text-transform: uppercase;
`;

export const PlanProperties: FC<Props> = (props) => {
    const { icon, title, showLastDivider, advantages } = props;

    return (
        <Column gap="1rem">
            <Row gap="0.5rem">
                {icon}
                <Title>{title}</Title>
            </Row>

            <Column gap="1rem">
                {advantages.map((advantage, i) => (
                    <AdvantageRow
                        advantage={advantage}
                        addDivider={
                            showLastDivider || i !== advantages.length - 1
                        }
                    />
                ))}
            </Column>
        </Column>
    );
};
