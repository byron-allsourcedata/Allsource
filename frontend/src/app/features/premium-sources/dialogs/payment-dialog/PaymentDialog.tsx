import { Column } from "@/components/Column";
import {
	Dialog,
	DialogTitle,
	LinearProgress,
	RadioGroup,
	styled,
} from "@mui/material";
import { useEffect, useState, type FC } from "react";
import { DialogHeader } from "./DialogHeader";
import { PaymentActions } from "./PaymentActions";
import { PaymentMethods } from "./PaymentMethods";
import { PremiumSourcePrice } from "./PremiumSourcePrice";
import { useGetAddedCards, useGetPremiumFunds } from "../../requests";
import type { CardDetails } from "./PaymentMethod";
import { PaymentCalculation } from "./PaymentCalculation";
import { PremiumFundsPaymentMethod } from "./PremiumFundsPaymentMethod";
import type { StringNullableChain } from "lodash";
import { T } from "@/components/ui/T";

type Props = {
	open: boolean;
	onClose: () => void;

	sourceId: string;
	price: number;

	buyLoading: boolean;
	onPay: (sourceId: string, price: number, paymentMethodId?: string) => void;
};

export const PaymentDialog: FC<Props> = ({
	sourceId,
	price,
	open,
	onClose,
	buyLoading,
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

	const loading = fundsLoading || cardLoading;
	const cardsLoading = fundsLoading || cardLoading;

	const [selectedCard, setSelectedCard] = useState("0");

	const payDisabled =
		loading || buyLoading || billing?.card_details.length === 0;

	return (
		<Dialog open={open} onClose={onClose}>
			<Column
				justifyContent={"space-between"}
				sx={{
					height: "70dvh",
					width: "600px",
					maxWidth: "100%",
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
					{(loading || buyLoading) && <LinearProgress />}
					<Column
						sx={{
							padding: "1rem 1.5rem",
							gap: "1rem",
						}}
					>
						<DialogContent
							price={price}
							availableFunds={premiumFunds ?? 0}
							cards={billing?.card_details ?? []}
							setSelectedCard={setSelectedCard}
							selectedCard={selectedCard}
							loading={cardsLoading}
						/>
					</Column>
				</Column>
				<PaymentActions
					loading={payDisabled}
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

type DialogContentProps = {
	price: number;
	availableFunds: number;
	cards: CardDetails[];
	setSelectedCard: (cardId: string) => void;
	selectedCard: string;
	loading?: boolean;
};

const DialogContent: FC<DialogContentProps> = ({
	price,
	availableFunds,
	cards,
	setSelectedCard,
	selectedCard,
	loading,
}) => {
	if (availableFunds >= price) {
		return (
			<EnoughFundsPaymentSummary
				price={price}
				availableFunds={availableFunds}
			/>
		);
	}

	if (availableFunds < price && availableFunds > 0) {
		return (
			<MixedFundsPaymentSummary
				price={price}
				availableFunds={availableFunds}
				cards={cards}
				setSelectedCard={setSelectedCard}
				selectedCard={selectedCard}
				loading={loading}
			/>
		);
	}

	return (
		<CardPaymentSummary
			price={price}
			cards={cards}
			selectedCard={selectedCard}
			setSelectedCard={setSelectedCard}
			loading={loading}
		/>
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

type EnoughFundsPaymentSummaryProps = {
	price: number;
	availableFunds: number;
};

export const EnoughFundsPaymentSummary: FC<EnoughFundsPaymentSummaryProps> = ({
	price,
	availableFunds,
}) => {
	return (
		<Column gap="2rem">
			<PremiumSourcePrice price={price} />

			<Column gap="1rem">
				<PaymentMethod>Payment Method:</PaymentMethod>
				<PremiumFundsPaymentMethod availableFunds={availableFunds} />
			</Column>
		</Column>
	);
};

type MixedFundsPaymentSummaryProps = {
	price: number;
	availableFunds: number;
	cards: CardDetails[];
	setSelectedCard: (cardId: string) => void;
	selectedCard: string;
	loading?: boolean;
};

export const MixedFundsPaymentSummary: FC<MixedFundsPaymentSummaryProps> = ({
	price,
	availableFunds,
	cards,
	selectedCard,
	setSelectedCard,
	loading,
}) => {
	return (
		<Column gap="1.5rem">
			<PaymentCalculation price={price} availableFunds={availableFunds} />
			<PaymentMethodGroup
				availableFunds={availableFunds}
				showFunds={availableFunds >= price}
				showCards={availableFunds < price}
				cards={cards}
				selectedCard={selectedCard}
				setSelectedCard={setSelectedCard}
				loading={loading}
			/>
		</Column>
	);
};

type CardPaymentSummaryProps = {
	price: number;
	cards: CardDetails[];
	selectedCard: string;
	setSelectedCard: (cardId: string) => void;
	loading?: boolean;
};

export const CardPaymentSummary: FC<CardPaymentSummaryProps> = ({
	price,
	cards,
	selectedCard,
	setSelectedCard,
	loading,
}) => {
	return (
		<Column gap="1.5rem">
			<PremiumSourcePrice price={price} />

			<PaymentMethodGroup
				availableFunds={0}
				showFunds={false}
				showCards={true}
				cards={cards}
				selectedCard={selectedCard}
				setSelectedCard={setSelectedCard}
				loading={loading}
			/>
		</Column>
	);
};

type PaymentMethodGroupProps = {
	availableFunds: number;
	showFunds: boolean;
	showCards: boolean;
	cards: CardDetails[];
	selectedCard: string;
	setSelectedCard: (cardId: string) => void;
	loading?: boolean;
};

export const PaymentMethodGroup: FC<PaymentMethodGroupProps> = ({
	availableFunds,
	showFunds,
	showCards,
	cards,
	selectedCard,
	setSelectedCard,
	loading,
}) => {
	return (
		<Column gap="1rem">
			<PaymentMethod>Payment Method:</PaymentMethod>
			{!loading && (
				<RadioGroup
					value={selectedCard}
					onChange={(_, value) => {
						setSelectedCard(value);
					}}
					sx={{ width: "100%", gap: 2 }}
				>
					<PaymentMethods
						availableFunds={availableFunds}
						showFunds={showFunds}
						showCards={showCards}
						cards={cards}
					/>
				</RadioGroup>
			)}
		</Column>
	);
};

const PaymentMethod = styled(T)`
color: #202124;
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 22.4px */
`;
