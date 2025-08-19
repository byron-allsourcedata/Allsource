import { Table, TableBody } from "@mui/material";
import { AdvantageRow } from "./AdvantageRow";
import type { FC } from "react";

type AdvantagesProps = {
	advantages: Advantage[];
};

export type Advantage = {
	good: boolean;
	name: string;
	value?: string;
};

export const Advantages: FC<AdvantagesProps> = (props) => {
	const { advantages } = props;

	return advantages.map((advantage, index) => (
		<Table key={index}>
			<TableBody>
				<AdvantageRow key={advantage.name} advantage={advantage} />
			</TableBody>
		</Table>
	));
};
