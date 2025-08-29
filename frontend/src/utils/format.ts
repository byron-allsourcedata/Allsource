type ParsedBytes = {
	size: number;
	units: string;
};

function parseBytes(bytes: number): { size: number; units: string } {
	if (bytes === 0) return { size: 0, units: "B" };

	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const size = Number.parseFloat((bytes / 1024 ** i).toFixed(2));

	return { size, units: units[i] };
}

function formatParsedBytes(bytes: ParsedBytes): string {
	return `${bytes.size} ${bytes.units}`;
}

export function formatBytes(bytes: number): string {
	return formatParsedBytes(parseBytes(bytes));
}
export function formatEta(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "short", // "Jun"
		day: "numeric", // "1"
		year: "numeric", // "2025"
	});
}

export function parseDate(input: string): Date {
	const trimmed = input.replace(/\.\d{6}/, "");
	return new Date(trimmed);
}
