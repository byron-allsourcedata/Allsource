import { Column } from "@/components/Column";
import { Dialog, DialogTitle, RadioGroup, styled } from "@mui/material";
import { useEffect, useState, type FC } from "react";
import { DialogHeader } from "./DialogHeader";
import { PaymentActions } from "./PaymentActions";
import { PaymentMethods } from "./PaymentMethods";
import { PremiumSourcePrice } from "./PremiumSourcePrice";
import { useGetAddedCards, useGetPremiumFunds } from "../../requests";
import type { CardDetails } from "./PaymentMethod";
import { PaymentCalculation } from "./PaymentCalculation";

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
		refetch().catch(() => {});
		refetchCards().catch(() => {});
	}, [sourceId]);

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
			<Column
				justifyContent={"space-between"}
				sx={{
					height: "70dvh",
					overflow: "hidden",
				}}
			>
				<Column>
					<DialogHeader
						title="Complete Your Payment"
						onClose={() => {
							onClose();
						}}
					/>
					<Column
						sx={{
							padding: "1rem 1.5rem",
							gap: "1rem",
						}}
					>
						<PremiumSourcePrice price={price} />

						<PaymentCalculation
							price={price}
							availableFunds={premiumFunds ?? 0}
						/>

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
									showCards={premiumFunds < price}
									cards={billing?.card_details ?? []}
								/>
							</RadioGroup>
						)}
					</Column>
				</Column>
				<PaymentActions
					onCancel={() => {
						onClose();
					}}
					onPay={() => {
						onPay(sourceId, price, billing?.card_details[+selectedCard]?.id);
					}}
				/>
			</Column>
		</Dialog>
	);
};

type DebugProps = {
	disable?: boolean;
};

export const Debug = styled(Column)<DebugProps>`
${({ disable }) =>
	!disable &&
	`
* {
	outline: 1px solid red;
}
	`}
`;
