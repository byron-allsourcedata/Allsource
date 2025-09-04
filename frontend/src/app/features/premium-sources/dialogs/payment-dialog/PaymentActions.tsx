import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
import type { FC } from "react";

type Props = {
	onCancel: () => void;
	onPay: () => void;
};

export const PaymentActions: FC<Props> = ({ onCancel, onPay }) => {
	return (
		<Row>
			<CustomButton variant="outlined" onClick={onCancel}>
				Cancel
			</CustomButton>
			<CustomButton onClick={onPay}>Pay</CustomButton>
		</Row>
	);
};
