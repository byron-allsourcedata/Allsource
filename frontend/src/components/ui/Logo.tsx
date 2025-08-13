"use client";

import { useWhitelabel } from "@/app/features/whitelabel/contexts/WhitelabelContext";
import { Skeleton } from "@mui/material";
import Image from "next/image";
import { useEffect, useState, type FC } from "react";

type Props = {
	noWhitelabel?: boolean;
	alt?: string;
	width?: number;
	height?: number;
};

export const Logo: FC<Props> = ({
	noWhitelabel,
	width,
	height,
	alt: inputAlt,
}) => {
	const imageWidth = width ?? 130;
	const imageHeight = height ?? 30;

	const [isClient, setIsClient] = useState(false);
	const { whitelabel } = useWhitelabel();

	const url = noWhitelabel ? "/logo.svg" : whitelabel.brand_logo_url;
	const alt = noWhitelabel ? "Allsource" : whitelabel.brand_name;

	// counter-measure for next.js hydration error
	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<Skeleton
				variant="rounded"
				height={imageHeight}
				width={imageWidth}
				animation="wave"
				sx={{ bgcolor: "grey.100" }}
			/>
		);
	}

	return (
		<Image
			priority
			src={url}
			alt={inputAlt ?? alt}
			height={imageHeight}
			width={imageWidth}
		/>
	);
};

export const LogoSmall: FC<Props> = ({
	noWhitelabel,
	width,
	height,
	alt: inputAlt,
}) => {
	const imageWidth = width ?? 24;
	const imageHeight = height ?? 24;

	const [isClient, setIsClient] = useState(false);
	const { whitelabel } = useWhitelabel();

	const url = noWhitelabel ? "/logo-icon.svg" : whitelabel.brand_icon_url;
	const alt = noWhitelabel ? "Allsource" : whitelabel.brand_name;

	// counter-measure for next.js hydration error
	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return (
			<Skeleton
				variant="rounded"
				height={imageHeight}
				width={imageWidth}
				animation="wave"
				sx={{ bgcolor: "grey.100" }}
			/>
		);
	}

	return (
		<Image
			priority
			src={url}
			alt={inputAlt ?? alt}
			height={imageHeight}
			width={imageWidth}
		/>
	);
};
