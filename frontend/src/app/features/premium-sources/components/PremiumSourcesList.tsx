import type { FC } from "react";
import { Column } from "@/components/Column";
import type { CardMenuProps } from "@/components/premium-sources/hooks/useCardMenu";
import type { PremiumSourceData } from "../schemas";
import { AdminPremiumSourceCard } from "@/components/premium-sources/cards/AdminPremiumSourceCard";

type Props = {
	menuProps: CardMenuProps;
	selectedSourceIdx: number;
	setSelectedSourceIdx: (idx: number) => void;
	sources: PremiumSourceData[];
	onDelete: (source: PremiumSourceData) => void;
};

export const PremiumSourcesList: FC<Props> = ({
	menuProps,
	selectedSourceIdx,
	setSelectedSourceIdx,
	sources,
	onDelete,
}) => {
	const cards = sources.map((source, idx) => (
		<>
			<AdminPremiumSourceCard
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
