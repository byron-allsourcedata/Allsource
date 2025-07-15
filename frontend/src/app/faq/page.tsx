"use client";

import { Box, Typography, Container, Stack } from "@mui/material";
import { FaqStyle } from "./faq-style";
import Image from "next/image";
import { questions } from "./faq-data";
import FaqCard from "./components/FaqCard";

export default function FaqPage() {
	return (
		<>
			<Box
				sx={{
					marginTop: "24px",
					marginLeft: "32px",
				}}
			>
				<Image src="/logo.svg" alt="Allsource logo" width={120} height={32} />
			</Box>

			<Container maxWidth="md" sx={FaqStyle.mainContent}>
				<Typography sx={FaqStyle.header}>FAQ</Typography>

				<Stack spacing={2} sx={{ mt: 4 }}>
					{questions.map(({ q, a }, idx) => (
						<FaqCard key={idx} cardNumber={idx + 1} title={q} content={a} />
					))}
				</Stack>
			</Container>
		</>
	);
}
