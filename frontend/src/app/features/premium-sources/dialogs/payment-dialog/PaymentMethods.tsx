import { Column } from "@/components/Column";
import type { FC } from "react";
import { PremiumFundsPaymentMethod } from "./PremiumFundsPaymentMethod";
import { PaymentMethod, type CardDetails } from "./PaymentMethod";
import { T } from "@/components/ui/T";

type Props = {
	availableFunds: number;
	cards: CardDetails[];
};

export const PaymentMethods: FC<Props> = ({ availableFunds, cards }) => {
	return (
		<Column>
			<PremiumFundsPaymentMethod availableFunds={availableFunds} />
			{cards.map((card, idx) => (
				<PaymentMethod
					isSelected={true}
					card={card}
					selectedCard=""
					index={idx}
					key={card.id}
				/>
			))}

			{cards.length === 0 && (
				<Column>
					<T>No cards found</T>
				</Column>
			)}
		</Column>
	);
};
