import { Row } from "@/components/Row";
import type { FC } from "react";

import Image from "next/image";
import { Column } from "@/components/Column";
import { IconButton, styled } from "@mui/material";
import { T } from "@/components/ui/T";
import { DeleteOutline } from "@mui/icons-material";
import { formatBytes } from "@/utils/format";

type Props = {
	name: string;
	size?: number;
	onDelete?: () => void;
};

export const PremiumSourceUploaded: FC<Props> = ({ name, size, onDelete }) => {
	return (
		<Card>
			<Row gap="1rem">
				<CsvFileIcon />
				<Column gap="0.5rem">
					<Name>{name}</Name>
					{size && <Size>{formatBytes(size)}</Size>}
				</Column>
			</Row>
			{onDelete && <DeleteButton onClick={onDelete} />}
		</Card>
	);
};

const CsvFileIcon = () => {
	const size = 48;
	return (
		<Image src="/csv-file.svg" alt="csv-icon" width={size} height={size} />
	);
};

type DeleteProps = {
	onClick: () => void;
};
const DeleteButton: FC<DeleteProps> = ({ onClick }) => {
	return (
		<IconButton>
			<DeleteOutline onClick={onClick} />
		</IconButton>
	);
};

const Name = styled(T)`
color: #202124;
font-size: 16px;
font-style: normal;
font-weight: 600;
line-height: normal;
`;

const Size = styled(T)`
color: #4A4A4A;
font-size: 12px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 16.8px */
`;

const Card = styled(Row)`
display: flex;
width: 556px;
padding: 16px;
justify-content: space-between;
align-items: center;
border-radius: 4px;
border: 1px solid #E4E4E4;
background: #F6F8FA;
`;
