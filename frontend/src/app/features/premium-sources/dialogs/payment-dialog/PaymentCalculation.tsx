import type { FC } from "react";
import { Box, Divider, styled } from "@mui/material";
import { T } from "@/components/ui/T";
import { Column } from "@/components/Column";
import { Debug } from "./PaymentDialog";
import { formatCents, formatMoney } from "@/components/PartnersAccounts";

const Card = styled(Box)`
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 1rem;
  background: white;
`;

const Row = styled(Box)`
  display: grid;
  grid-template-columns: 1fr auto;
  font-size: 1rem;
`;

const Label = styled(T)`
  color: #111827;
`;

type Props = {
	price: number;
	availableFunds: number;
};

export const PaymentCalculation: FC<Props> = ({ price, availableFunds }) => {
	const formattedPrice = formatCents(price);
	const formattedAvailableFunds = formatCents(availableFunds);

	const total = price - availableFunds;
	return (
		<Card>
			<Column gap="1rem">
				<Row>
					<SummaryItem>Price:</SummaryItem>
					<Value>{formattedPrice}</Value>
				</Row>
				<Row>
					<SummaryItem>Premium Sources Funds Credits:</SummaryItem>
					<Value>-{formattedAvailableFunds}</Value>
				</Row>
				<Divider />
				<Row>
					<SummaryItem>Final Total:</SummaryItem>
					<Value>{formatCents(total)}</Value>
				</Row>
			</Column>
		</Card>
	);
};

const SummaryItem = styled(T)`
color: #202124;
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 22.4px */
`;

const Value = styled(T)`
color: #787878;
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 22.4px */
letter-spacing: 0.08px;
`;
