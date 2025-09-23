import type { FC } from "react";
import { PremiumSourceCard, type UserCardProps } from "./PremiumDataCard";

type Props = Omit<UserCardProps, "cardType">;

export const UserPremiumDataCard: FC<Props> = (props) => {
	return <PremiumSourceCard cardType="user" {...props} />;
};
