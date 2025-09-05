import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
import type { FC } from "react";

type Props = {
	onCancel: () => void;
	onPay: () => void;
};

export const PaymentActions: FC<Props> = ({ onCancel, onPay }) => {
	return (
		<Row
			sx={{
				padding: "1.25rem 1rem",
				gap: "1rem",
				borderTop: "1px solid var(--Border, #E4E4E4)",
			}}
			justifyContent={"end"}
		>
			<CustomButton variant="outlined" onClick={onCancel}>
				Cancel
			</CustomButton>
			<CustomButton onClick={onPay}>Pay</CustomButton>
		</Row>
	);
};
