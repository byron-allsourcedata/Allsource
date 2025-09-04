import { useRef, useState, type FC, type RefObject } from "react";
import { Row } from "@/components/Row";
import { IconButton, Menu, MenuItem, styled, Typography } from "@mui/material";
import { Column } from "@/components/Column";
import { Download } from "@mui/icons-material";
import { CustomButton } from "@/components/ui";

import { formatDate, parseDate } from "@/utils/format";
import { MoreVert } from "@/icon";
import type { PremiumSourceData } from "@/app/features/premium-sources/schemas";
import { useCardMenu, type CardMenuProps } from "../hooks/useCardMenu";
import { StatusLabel } from "@/app/(client)/premium-sources/components/status";

const Header = styled(Typography)`
	color: #202124;
	font-size: 0.75rem;
	font-style: normal;
	font-weight: 600;
	line-height: 140%; /* 1.05rem */
`;

const Value = styled(Typography)`
   color: #5F6368;
	font-family: Roboto;
	font-size: 0.75rem;
	font-style: normal;
	font-weight: 400;
	line-height: 140%; /* 1.05rem */
`;

const CardContainer = styled(Row)`
	display: flex;
	width: 100%;
	padding: 1.4375rem 0 1.375rem 0;
	justify-content: center;
	align-items: center;
	border-radius: 0.375rem;
	border: 1px solid #EBEBEB;
	background: #FFF;
`;

const CardInnerContainer = styled(Row)`
	display: flex;
	width: 100%;
	padding: 0 1.25rem;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;
`;

const SyncButton = styled(CustomButton)`
	display: flex;
	padding: 0.625rem 1.5rem;
	justify-content: center;
	align-items: center;
	gap: 0.625rem;
	align-self: stretch;
	border-radius: 0.25rem;
	background: #3898FC;
	color: #FFF;
	font-family: "Nunito Sans";
	font-size: 0.875rem;
	font-style: normal;
	font-weight: 600;
	line-height: 140%; /* 1.225rem */
`;

const CardColumn = styled(Column)`
	width: 8rem;
	gap: 0.5rem;
`;

const DownloadButton = styled(Download)`
		color: #3898FC;
		`;

type Props = UserCardProps | AdminCardProps;

export type UserCardProps = {
	cardType: "user";
	source: PremiumSourceData;
	onSync: () => void;
	onDownload: () => void;
};

export type AdminCardProps = {
	cardType: "admin";
	source: PremiumSourceData;
	menu: CardMenuProps;
	onDelete: () => void;
};

export const PremiumSourceCard: FC<Props> = (props) => {
	// TODO: Smart title elipsis

	const source = props.source;

	const menuProps = useCardMenu();

	const { menuAnchor, menuOpen, setMenuOpen } = menuProps;

	const canSync = source.status === "ready";

	return (
		<Row justifyContent={"center"}>
			<CardContainer>
				<CardInnerContainer>
					<CardColumn>
						<Header>Name</Header>
						<Value
							whiteSpace="nowrap"
							overflow="hidden"
							textOverflow="ellipsis"
						>
							{source.name}
						</Value>
					</CardColumn>
					<CardColumn>
						<Header>Uploaded Date</Header>
						<Value>{formatDate(parseDate(source.created_at))}</Value>
					</CardColumn>
					<CardColumn>
						<Header>No of Rows</Header>
						<Value>{source.rows}</Value>
					</CardColumn>

					{props.cardType === "admin" && (
						<PriceColumn price={props.source.price} />
					)}
					<CardColumn
						sx={{
							width: "5rem",
						}}
					>
						<Header>Status</Header>
						<StatusLabel status={source.status} />
					</CardColumn>

					{props.cardType === "user" && (
						<CardColumn>
							<Row alignItems="center" gap="0.5rem">
								<SyncButton disabled={!canSync} onClick={props.onSync}>
									Sync
								</SyncButton>
								<DownloadButton onClick={props.onDownload} />
							</Row>
						</CardColumn>
					)}

					{props.cardType === "admin" && (
						<CardColumn
							flexDirection={"row-reverse"}
							sx={{ width: "min-content" }}
						>
							<IconButton
								onClick={() => setMenuOpen(true)}
								ref={menuAnchor as RefObject<HTMLButtonElement>}
							>
								<MoreVert />
							</IconButton>
							<Menu
								open={menuOpen}
								onClose={() => setMenuOpen(false)}
								anchorEl={menuAnchor?.current}
							>
								{/* <MenuItem disabled>Rename</MenuItem> */}
								<MenuItem onClick={props.onDelete}>Delete</MenuItem>
							</Menu>
						</CardColumn>
					)}
				</CardInnerContainer>
			</CardContainer>
		</Row>
	);
};

type PriceColumnProps = {
	price: number;
};

export const PriceColumn: FC<PriceColumnProps> = ({ price }) => {
	const formattedPrice = (price / 100).toFixed(2);

	return (
		<CardColumn>
			<Header>Price</Header>
			<Value>${formattedPrice}</Value>
		</CardColumn>
	);
};
