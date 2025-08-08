import { Column } from "@/components/Column";
import { Row } from "@/components/Row";
import { T } from "@/components/ui/T";
import { FileUploadOutlined, UploadFileOutlined } from "@mui/icons-material";
import { Box, styled } from "@mui/material";
import type { FC } from "react";

type Props = {};

export const UploadedLogo: FC<Props> = () => {
	return (
		<UploadedLogoContainer>
			<FileUploadOutlined
				sx={{
					color: "#3898FC",
				}}
			/>
			<T
				sx={{
					color: "#3898FC",
					fontSize: "14px",
					fontFamily: "Nunito Sans",
					fontWeight: "600",
					wordWrap: "break-word",
				}}
			>
				Drop here
			</T>
		</UploadedLogoContainer>
	);
};

const UploadedLogoContainer = styled(Column)`
justify-content: center;
align-items: center;
padding: 1rem 1.5rem;
gap: 0.5rem;
border-radius: 4px;

border: 1px dashed #3898FC;
background: #EFF7FF;
transition: background 0.1s ease-in-out;
cursor: pointer;
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
