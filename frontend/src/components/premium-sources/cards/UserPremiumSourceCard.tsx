import type { FC } from "react";
import { PremiumSourceCard, type UserCardProps } from "./PremiumSourceCard";

type Props = Omit<UserCardProps, "cardType">;

export const UserPremiumSourceCard: FC<Props> = (props) => {
	return <PremiumSourceCard cardType="user" {...props} />;
};
