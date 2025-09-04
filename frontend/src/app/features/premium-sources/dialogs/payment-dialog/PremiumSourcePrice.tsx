import { Column } from "@/components/Column";
import { formatMoney } from "@/components/PartnersAccounts";
import { T } from "@/components/ui/T";
import { styled } from "@mui/material";
import type { FC } from "react";

type Props = {
	price: number;
};

export const PremiumSourcePrice: FC<Props> = ({ price }) => {
	return (
		<Column>
			<PriceHeader>Price:</PriceHeader>
			<Price>{formatMoney(price / 100)}</Price>
		</Column>
	);
};

const PriceHeader = styled(T)`
color: #202124;
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 22.4px */
`;

const Price = styled(T)`
color: #787878;
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 22.4px */
letter-spacing: 0.08px;
`;
