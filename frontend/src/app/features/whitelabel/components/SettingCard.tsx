import { Column } from "@/components/Column";
import { T } from "@/components/ui/T";
import { Paper, styled, type SxProps } from "@mui/material";
import type { FC, ReactNode } from "react";

type Props = {
	sx?: SxProps;
	title: string;
	description: string;
	children: ReactNode;
};

export const SettingCard: FC<Props> = ({ sx, children }) => {
	return (
		<Column sx={sx}>
			<Column gap="0.5rem">
				<T>Enter Your Brand Name</T>
				<T variant="subtitle1">
					This name will appear across the platform as your brand identity
				</T>
			</Column>
			{children}
		</Column>
	);
};

export const SettingCardContainer = styled(Paper)`
display: flex;
flex-direction: column;
align-items: flex-start;
gap: 1rem;
`;
