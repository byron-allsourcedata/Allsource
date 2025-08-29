import { Row } from "@/app/(client)/components/Row";
import { Close } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import type { FC } from "react";

const T = Typography;

type Props = {
	title: string;
	onClose: () => void;
};

export const DrawerHeader: FC<Props> = ({ title, onClose }) => {
	return (
		<Row
			justifyContent="space-between"
			sx={{
				padding: "1.5rem 1rem",
				alignItems: "center",
				borderBottom: "1px solid #E4e4e4",
			}}
		>
			<DrawerTitle>{title}</DrawerTitle>
			<IconButton
				onClick={onClose}
				sx={{
					padding: 0,
					height: "1.25rem",
					width: "1.25rem",
				}}
			>
				<Close />
			</IconButton>
		</Row>
	);
};

const DrawerTitle = styled(T)`
	color: #202124;
	font-size: 16px;
	font-weight: 600;
	line-height: 22px;
`;
