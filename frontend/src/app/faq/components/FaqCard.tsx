"use client";

import {
	Typography,
	Accordion,
	AccordionDetails,
	AccordionSummary,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FaqStyle } from "../faq-style";
import type { FC } from "react";

type FaqCardProps = {
	cardNumber: number;
	title: string;
	content: React.ReactNode;
};

const FaqCard: FC<FaqCardProps> = ({ cardNumber, title, content }) => {
	return (
		<Accordion>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Typography sx={FaqStyle.question}>
					{cardNumber}. {title}
				</Typography>
			</AccordionSummary>
			<AccordionDetails>{content}</AccordionDetails>
		</Accordion>
	);
};

export default FaqCard;
