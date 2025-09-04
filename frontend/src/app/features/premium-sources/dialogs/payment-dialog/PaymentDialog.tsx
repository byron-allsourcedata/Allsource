import { Column } from "@/components/Column";
import { Dialog, DialogTitle, RadioGroup } from "@mui/material";
import { useEffect, useState, type FC } from "react";
import { DialogHeader } from "./DialogHeader";
import { PaymentActions } from "./PaymentActions";
import { PaymentMethods } from "./PaymentMethods";
import { PremiumSourcePrice } from "./PremiumSourcePrice";
import { useGetAddedCards, useGetPremiumFunds } from "../../requests";
import type { CardDetails } from "./PaymentMethod";

type Props = {
	open: boolean;
	onClose: () => void;

	sourceId: string;
	price: number;

	onPay: (sourceId: string, price: number, paymentMethodId?: string) => void;
};

export const PaymentDialog: FC<Props> = ({
	sourceId,
	price,
	open,
	onClose,
	onPay,
}) => {
	const {
		loading: fundsLoading,
		data: premiumFunds,
		refetch,
	} = useGetPremiumFunds();
	const {
		loading: cardLoading,
		data: billing,
		refetch: refetchCards,
	} = useGetAddedCards();

	useEffect(() => {
		refetch();
		refetchCards();
	}, []);

	// const cards: CardDetails[] = [
	// 	{
	// 		brand: "visa",
	// 		exp_month: 1,
	// 		exp_year: 2023,
	// 		id: "1",
	// 		is_default: true,
	// 		last4: "1234",
	// 	},
	// ];

	const loading = fundsLoading || cardLoading;

	const [selectedCard, setSelectedCard] = useState("0");
	return (
		<Dialog open={open} onClose={onClose}>
			<Column>
				<DialogHeader title="Complete Your Payment" onClose={() => {}} />
				<PremiumSourcePrice price={price} />

				{!loading && premiumFunds != null && (
					<RadioGroup
						value={selectedCard}
						onChange={(_, value) => {
							setSelectedCard(value);
						}}
						sx={{ width: "100%", gap: 2 }}
					>
						<PaymentMethods
							availableFunds={premiumFunds}
							cards={billing?.card_details ?? []}
						/>
					</RadioGroup>
				)}
				<PaymentActions
					onCancel={() => {}}
					onPay={() => {
						onPay(sourceId, price, billing?.card_details[+selectedCard]?.id);
					}}
				/>
			</Column>
		</Dialog>
	);
};
