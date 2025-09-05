import type { FC } from "react";
import type { PremiumSourceData } from "../schemas";
import { UserPremiumSourceCard } from "@/components/premium-sources/cards/UserPremiumSourceCard";
import { Column } from "@/components/Column";

type Props = {
	sources: PremiumSourceData[];
	onSync: (source: PremiumSourceData) => void;
	onDownload: (source: PremiumSourceData) => void;
	onUnlock: (source: PremiumSourceData) => void;
};

export const UserSourcesList: FC<Props> = ({
	sources,
	onSync,
	onDownload,
	onUnlock,
}) => {
	const cards = sources.map((source, idx) => (
		<>
			<UserPremiumSourceCard
				key={source.name}
				source={source}
				onSync={() => onSync(source)}
				onDownload={() => onDownload(source)}
				onUnlock={() => onUnlock(source)}
			/>
		</>
	));

	return <Column gap="1rem">{cards}</Column>;
};
