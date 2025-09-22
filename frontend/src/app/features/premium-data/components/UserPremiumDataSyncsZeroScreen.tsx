import { Column } from "@/components/Column";
import type { FC } from "react";
import Image from "next/image";
import { T } from "@/components/ui/T";
import { styled } from "@mui/material";
import { SmartButton } from "@mui/icons-material";
import { Row } from "@/components/Row";
import { CustomButton } from "@/components/ui";
type Props = {
	onBeginClick: () => void;
};

export const UserPremiumDataSyncsZeroScreen: FC<Props> = ({
	onBeginClick,
}) => {
	return (
		<Column alignItems={"center"}>
			<Column gap="1rem">
				<Header>Sync Your Premium Data</Header>
				<Subheader>Create a Sync to a platform of your choice</Subheader>
				<BannerContainer justifyContent={"start"} textAlign={"left"}>
					<BannerHeader>Sync Premium Data Any Platform</BannerHeader>
					<Image
						alt="Premium Data Sync"
						src={"/premium_sources_syncs_zero_logo.svg"}
						width={800}
						height={300}
					/>
					<Explanation>
						Send your Premium Data to connected platforms like Meta Ads,
						Google Ads, and Mailchimp with one click.
					</Explanation>
					<Row width={"100%"} justifyContent={"end"}>
						<CustomButton onClick={onBeginClick}>Begin</CustomButton>
					</Row>
				</BannerContainer>
			</Column>
		</Column>
	);
};

const Header = styled(T)`
color: var(--Text_Headings, #202124);
text-align: center;

/* H1 */
font-family: "Nunito Sans";
font-size: 20px;
font-style: normal;
font-weight: 600;
line-height: 20px; /* 100% */
`;

const Subheader = styled(T)`
color: var(--Text_Secondary, #717171);
text-align: center;
font-family: "Nunito Sans";
font-size: 14px;
font-style: normal;
font-weight: 400;
line-height: 20px; /* 142.857% */
`;

const BannerHeader = styled(T)`
color: var(--Black, #151619);
font-family: "Nunito Sans";
font-size: 14px;
font-style: normal;
font-weight: 600;
line-height: 22px; /* 157.143% */
`;

const Explanation = styled(T)`
color: var(--Gray-100, #32363E);
font-family: "Nunito Sans";
font-size: 14px;
font-style: normal;
font-weight: 400;
line-height: 22px; /* 157.143% */
`;

const BannerContainer = styled(Column)`
display: flex;
max-width: 840px;
padding: 24px;
flex-direction: column;
align-items: start;
gap: 1rem;
border-radius: 6px;
border: 1px solid #EDEDED;
`;
