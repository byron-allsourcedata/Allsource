import { Column } from "@/components/Column";
import type { FC } from "react";
import { PremiumFundsPaymentMethod } from "./PremiumFundsPaymentMethod";
import { PaymentMethod, type CardDetails } from "./PaymentMethod";
import { T } from "@/components/ui/T";

type Props = {
	availableFunds: number;
	showCards: boolean;
	cards: CardDetails[];
};

export const PaymentMethods: FC<Props> = ({
	availableFunds,
	showCards,
	cards,
}) => {
	return (
		<Column gap="1rem">
			{availableFunds > 0 && (
				<PremiumFundsPaymentMethod availableFunds={availableFunds} />
			)}

			{showCards &&
				cards.map((card, idx) => (
					<PaymentMethod
						isSelected={true}
						card={card}
						selectedCard=""
						index={idx}
						key={card.id}
					/>
				))}

			{showCards && cards.length === 0 && (
				<Column>
					<T>No cards found</T>
				</Column>
			)}
		</Column>
	);
};
