export function getGradient(relativePercent: number, gradientColor: string) {
	const opacity = 0.4 + 0.6 * relativePercent;

	if (gradientColor.startsWith("rgba(")) {
		const rgbValues = gradientColor.match(/\d+/g)?.slice(0, 3).join(", ");
		return `rgba(${rgbValues}, ${opacity})`;
	}

	return `rgba(${gradientColor}, ${opacity})`;
}
