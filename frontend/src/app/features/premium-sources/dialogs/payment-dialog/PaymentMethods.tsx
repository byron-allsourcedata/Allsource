import { Column } from "@/components/Column";
import type { FC } from "react";
import { PremiumFundsPaymentMethod } from "./PremiumFundsPaymentMethod";
import { PaymentMethod, type CardDetails } from "./PaymentMethod";
import { T } from "@/components/ui/T";

type Props = {
	availableFunds: number;
	showFunds: boolean;
	showCards: boolean;
	cards: CardDetails[];
};

export const PaymentMethods: FC<Props> = ({
	availableFunds,
	showCards,
	showFunds,
	cards,
}) => {
	return (
		<Column gap="1rem">
			{showFunds && (
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
