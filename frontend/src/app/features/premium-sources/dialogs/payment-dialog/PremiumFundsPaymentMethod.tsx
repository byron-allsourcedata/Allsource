import { Row } from "@/components/Row";
import { Paper, styled } from "@mui/material";
import type { FC } from "react";

import Image from "next/image";
import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";
import { formatMoney } from "@/components/PartnersAccounts";
import { CreditCard } from "@mui/icons-material";

type Props = {
	availableFunds: number;
};

export const PremiumFundsPaymentMethod: FC<Props> = ({ availableFunds }) => {
	const amount = formatMoney(availableFunds / 100);

	return (
		<Card>
			<CardIcon />
			<Column>
				<Name>Premium Sources Funds</Name>
				<Row>
					<Amount>{amount}</Amount>
					{/* <Subtext>You have enough funds to proceed</Subtext> */}
				</Row>
			</Column>
		</Card>
	);
};

const Card = styled(Row)`
border-radius: 4px;
border: 1px solid #F0F0F0;
background: #FFF;

/* 3 */
box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.08);
display: flex;

padding: 8px 16px;
align-items: center;
gap: 0.75rem;
`;

const CardIcon = () => <CreditCard />;

const Name = styled(T)`
color: #4A4A4A;
font-family: "Nunito Sans";
font-size: 12px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 16.8px */
`;

const Amount = styled(T)`
color: #202124;
font-family: "Nunito Sans";
font-size: 14px;
font-style: normal;
font-weight: 700;
line-height: normal;
`;
const Subtext = styled(T)`
`;
