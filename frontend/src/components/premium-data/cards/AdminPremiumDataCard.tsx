import type { FC } from "react";
import { PremiumSourceCard, type AdminCardProps } from "./PremiumDataCard";

export const AdminPremiumDataCard: FC<AdminCardProps> = (props) => {
	return <PremiumSourceCard {...props} />;
};
