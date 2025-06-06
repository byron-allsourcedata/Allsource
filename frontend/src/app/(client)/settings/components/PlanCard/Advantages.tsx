import { Table, TableBody } from "@mui/material";
import { AdvantageRow } from "./AdvantageRow";
import { FC } from "react";

type AdvantagesProps = {
    advantages: Advantage[];
};

export type Advantage = {
    good: boolean;
    name: string;
    value: string;
};

export const Advantages: FC<AdvantagesProps> = (props) => {
    const { advantages } = props;

    return advantages.map((advantage) => (
        <Table>
            <TableBody>
                <AdvantageRow key={advantage.name} advantage={advantage} />
            </TableBody>
        </Table>
    ));
};
