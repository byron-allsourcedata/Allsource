import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { T } from "@/components/ui/T";
import { FileUploadOutlined, UploadFileOutlined } from "@mui/icons-material";
import { Box, styled } from "@mui/material";
import type { FC } from "react";

type Props = {
	containerRef: React.RefObject<HTMLDivElement>;
};

export const UploadLogo: FC<Props> = ({ containerRef }) => {
	return (
		<UploadLogoContainer ref={containerRef}>
			<UploadIcon />
			<Column gap="0.5rem">
				<Title>Upload a file</Title>
				<Description>130x30, SVG or PNG, Max 10 MB</Description>
			</Column>
		</UploadLogoContainer>
	);
};

const UploadLogoContainer = styled(Row)`
padding: 1rem 1.5rem;
gap: 1.5rem;
border-radius: 4px;
border: 1px dashed #3898FC;
transition: background 0.1s ease-in-out;
cursor: pointer;
:hover {
    background: #EFF7FF;
}
`;

const UploadIcon = () => {
	return (
		<UploadIconBox>
			<FileUploadOutlined
				sx={{
					color: "#3898FC",
				}}
			/>
		</UploadIconBox>
	);
};

const UploadIconBox = styled(Box)`
display: flex;
justify-content: center;
align-items: center;
width: 2.5rem;
height: 2.5rem;
flex-shrink: 0;
border-radius: 4px;
background: #D7EAFE;    
`;

const Title = styled(T)`
color: #3898FC;
font-size: 14px;
font-style: normal;
font-weight: 600;
line-height: 140%; /* 19.6px */
`;

const Description = styled(T)`
color: #202124;
font-family: "Nunito Sans";
font-size: 14px;
font-style: normal;
font-weight: 500;
line-height: normal;
`;
