import { Row } from "@/components/Row";
import { Paper, styled } from "@mui/material";
import type { FC } from "react";

import Image from "next/image";
import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";
import { formatMoney } from "@/components/PartnersAccounts";

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
					<Subtext>You have enough funds to proceed</Subtext>
				</Row>
			</Column>
		</Card>
	);
};

const Card = styled(Row)`


`;

const CardIcon = () => (
	<Image
		src={"/default-card-icon.svg"}
		alt={"payment-icon"}
		height={54}
		width={54}
	/>
);

const Name = styled(T)`

`;

const Amount = styled(T)`
`;
const Subtext = styled(T)`
`;
