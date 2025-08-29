import type { FC } from "react";
import { PremiumSourceCard, type AdminCardProps } from "./PremiumSourceCard";

export const AdminPremiumSourceCard: FC<AdminCardProps> = (props) => {
	return <PremiumSourceCard {...props} />;
};
