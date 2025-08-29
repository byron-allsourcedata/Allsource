import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { Column } from "@/components/Column";
import { CustomButton } from "@/components/ui";
import { T } from "@/components/ui/T";
import { useBookingUrl } from "@/services/booking";
import { SmartButton } from "@mui/icons-material";
import { styled } from "@mui/material";
import Image from "next/image";
import type { FC } from "react";

type Props = {};
export const UserPremiumSourceFirstTimeContent: FC<Props> = ({}) => {
	const bookingUrl = useBookingUrl(axiosInterceptorInstance);

	return (
		<Column
			sx={{
				width: "100%",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Column
				gap="1rem"
				sx={{
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<HeaderText>There are no Premium Sources available</HeaderText>
				<SubheaderText>
					Please contact our team to get Premium Sources
				</SubheaderText>
				<CustomButton
					sx={{
						width: "fit-content",
						whiteSpace: "nowrap",
						flex: 0,
						flexGrow: 0,
						flexShrink: 1,
					}}
					onClick={() => window.open(bookingUrl, "_blank")}
				>
					Book a Call
				</CustomButton>
			</Column>
			<Image
				src="/premium_source_first_time_logo.svg"
				alt="No Premium Sources Found"
				width={750}
				height={450}
			/>
		</Column>
	);
};

const HeaderText = styled(T)`
color: var(--Text_Headings, #202124);
text-align: center;

/* H1 */
font-family: "Nunito Sans";
font-size: 20px;
font-style: normal;
font-weight: 600;
line-height: 20px; /* 100% */
`;

const SubheaderText = styled(T)`
color: var(--Text_Secondary, #717171);
text-align: center;
font-family: "Nunito Sans";
font-size: 14px;
font-style: normal;
font-weight: 400;
line-height: 20px; /* 142.857% */
`;
