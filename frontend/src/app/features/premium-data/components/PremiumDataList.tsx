import type { FC } from "react";
import { Column } from "@/components/Column";
import type { CardMenuProps } from "@/components/premium-data/hooks/useCardMenu";
import type { PremiumSourceData } from "../schemas";
import { AdminPremiumDataCard } from "@/components/premium-data/cards/AdminPremiumDataCard";

type Props = {
	menuProps: CardMenuProps;
	selectedSourceIdx: number;
	setSelectedSourceIdx: (idx: number) => void;
	sources: PremiumSourceData[];
	onDelete: (source: PremiumSourceData) => void;
};

export const PremiumDataList: FC<Props> = ({
	menuProps,
	selectedSourceIdx,
	setSelectedSourceIdx,
	sources,
	onDelete,
}) => {
	const cards = sources.map((source, idx) => (
		<>
			<AdminPremiumDataCard
				key={source.name}
				onDelete={() => onDelete(source)}
				source={source}
				cardType="admin"
				menu={menuProps}
			/>
		</>
	));

	return <Column gap="1rem">{cards}</Column>;
};
