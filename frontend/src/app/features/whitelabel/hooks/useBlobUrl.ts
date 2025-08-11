import { useEffect, useState } from "react";

export function useBlobUrl(blob?: Blob | null) {
	const [blobUrl, setBlobUrl] = useState<string>();

	useEffect(() => {
		if (blob) {
			setBlobUrl(URL.createObjectURL(blob));
		}

		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [blob]);

	return blobUrl;
}
