import { Row } from "@/components/Row";
import { T } from "@/components/ui/T";
import { Close } from "@mui/icons-material";
import { Divider, IconButton, styled } from "@mui/material";
import type { FC } from "react";

type Props = {
	title: string;
	onClose?: () => void;
};

export const DialogHeader: FC<Props> = ({ title, onClose }) => {
	return (
		<Container>
			<HeaderTitle>{title}</HeaderTitle>
			{onClose && (
				<IconButton onClick={onClose}>
					<Close />
				</IconButton>
			)}
		</Container>
	);
};

const Container = styled(Row)`
padding: 1.5rem 1rem;
justify-content: space-between;
align-items: center;
max-width: 800px;
width: 100%;
border-bottom: 1px solid var(--Border, #E4E4E4);
`;

const HeaderTitle = styled(T)`
color: var(--Text_Headings, #202124);
font-family: "Nunito Sans";
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: normal;
`;
