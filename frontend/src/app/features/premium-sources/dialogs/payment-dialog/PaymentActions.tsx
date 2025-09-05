import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
import type { FC } from "react";

type Props = {
	onCancel: () => void;
	onPay: () => void;
	loading: boolean;
};

export const PaymentActions: FC<Props> = ({ onCancel, onPay, loading }) => {
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
			<CustomButton disabled={loading} onClick={onPay}>
				Pay
			</CustomButton>
		</Row>
	);
};
