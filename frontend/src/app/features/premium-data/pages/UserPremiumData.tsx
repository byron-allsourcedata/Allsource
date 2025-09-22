import type { FC } from "react";
import { UserSourcesList } from "../components/UserSourcesList";
import type { PremiumSourceData } from "../schemas";

type Props = {
	sources: PremiumSourceData[];
	onSync: (source: PremiumSourceData) => void;
	onDownload: (source: PremiumSourceData) => void;
	onUnlock: (source: PremiumSourceData) => void;
};

export const UserPremiumData: FC<Props> = ({
	sources,
	onSync,
	onDownload,
	onUnlock,
}) => {
	return (
		<UserSourcesList
			sources={sources}
			onSync={onSync}
			onDownload={onDownload}
			onUnlock={onUnlock}
		/>
	);
};
