import { Column } from "@/components/Column";
import { formatMoney } from "@/components/PartnersAccounts";
import { T } from "@/components/ui/T";
import type { FC } from "react";

type Props = {
	price: number;
};

export const PremiumSourcePrice: FC<Props> = ({ price }) => {
	return (
		<Column>
			<T>Price:</T>
			<T>{formatMoney(price / 100)}</T>
		</Column>
	);
};
