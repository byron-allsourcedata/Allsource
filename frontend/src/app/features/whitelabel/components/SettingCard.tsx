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

export const SettingCard: FC<Props> = ({
	sx,
	title,
	description,
	children,
}) => {
	return (
		<Paper>
			<Column sx={sx} gap="1rem">
				<Column gap="0.5rem">
					<T>{title}</T>
					<T variant="subtitle1">{description}</T>
				</Column>
				{children}
			</Column>
		</Paper>
	);
};

export const SettingCardContainer = styled(Paper)`
display: flex;
flex-direction: column;
align-items: flex-start;
gap: 1rem;
`;
