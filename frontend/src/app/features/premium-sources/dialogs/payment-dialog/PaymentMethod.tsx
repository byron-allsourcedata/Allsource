import { billingStyles } from "@/app/(client)/settings/components/Billing/billingStyles";
import { CardBrand } from "@/app/(client)/settings/components/Billing/types";
import { Box, Radio, Typography } from "@mui/material";
import type { FC } from "react";
import Image from "next/image";

export type CardDetails = {
	id: string;

	brand: CardBrand;
	last4: string;
	exp_month: number;
	exp_year: number;
	is_default: boolean;
};

type Props = {
	isSelected: boolean;
	selectedCard: string;
	index: number;
	card: CardDetails;
};

//TODO remove duplicates
export const cardBrandImages: Record<CardBrand, string> = {
	visa: "/visa-icon.svg",
	mastercard: "/mastercard-icon.svg",
	amex: "/american-express.svg",
	discover: "/discover-icon.svg",
	unionpay: "/unionpay-icon.svg",
};

export const PaymentMethod: FC<Props> = ({
	isSelected,
	selectedCard,
	index,
	card,
}) => {
	return (
		<Box
			key={card.id}
			sx={{
				...billingStyles.cardItemWrapper,
				borderColor: isSelected ? "#3898FC" : "#ddd",
			}}
		>
			<Radio value={index} />
			<Box
				sx={{
					display: "flex",
					width: "100%",
					gap: 2,
					alignItems: "center",
				}}
			>
				<Box sx={billingStyles.cardImageContainer}>
					<Image
						src={
							cardBrandImages[card.brand as CardBrand] ||
							"/default-card-icon.svg"
						}
						alt={`${card.brand}-icon`}
						height={54}
						width={54}
					/>
				</Box>
				<Box>
					<Typography sx={{ fontWeight: 600 }}>
						{card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} (****{" "}
						{card.last4})
					</Typography>
					<Typography className="table-data" sx={{ color: "#5F6368" }}>
						Expire date:{" "}
						{`${card.exp_month < 10 ? "0" : ""}${card.exp_month}/${card.exp_year}`}
					</Typography>
				</Box>
			</Box>
			{card.is_default && (
				<Typography className="main-text" sx={billingStyles.defaultLabel}>
					Default
				</Typography>
			)}
		</Box>
	);
};
