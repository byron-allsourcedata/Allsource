import type { FC } from "react";
import { GoogleAdsGenericSync } from "./GoogleAdsGenericSync";

type Props = {
	premium_source_id: string;
	integration_id: number;
	onClose: () => void;
	onAddedSync: () => void;
};
export const GoogleAdsPremiumSyncPopup: FC<Props> = ({
	premium_source_id,
	integration_id,
	onClose,
	onAddedSync,
}) => {
	return (
		<GoogleAdsGenericSync
			premium_source_id={premium_source_id}
			user_integration_id={integration_id}
			open={true}
			onClose={onClose}
			onCloseCreateSync={onAddedSync}
			data={{
				id: undefined,
				list_id: undefined,
				name: undefined,
				type: undefined,
				customer_id: undefined,
			}}
			isEdit={false}
		/>
	);
};
