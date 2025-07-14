import { useState, useEffect, useMemo, useRef } from "react";

interface PollingData {
	id: string;
	train_model_size: number;
	processed_train_model_size: number;
	eta_seconds: number | null;
}

interface sseProgress {
	processed: number;
	total: number;
}

export const usePolling = (
	initialItem: PollingData,
	sseProgress: sseProgress,
	fetchDataCallback: (id: string) => Promise<PollingData>,
) => {
	const [data, setData] = useState<PollingData>(initialItem);
	const [isPolling, setIsPolling] = useState(true);

	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const mergedProgress = useMemo(
		() =>
			Math.max(
				data.processed_train_model_size ?? 0,
				sseProgress?.processed ?? 0,
			),
		[data.processed_train_model_size, sseProgress?.processed],
	);

	const mergedTotal = useMemo(
		() => Math.max(data.train_model_size ?? 0, sseProgress?.total ?? 0),
		[data.train_model_size, sseProgress?.total],
	);

	useEffect(() => {
		if (!isPolling) return;

		const poll = async () => {
			try {
				const { processed_train_model_size, train_model_size } = data;

				if (
					processed_train_model_size < train_model_size ||
					processed_train_model_size === 0
				) {
					const updatedItem = await fetchDataCallback(data.id);
					if (
						updatedItem &&
						updatedItem.train_model_size !== undefined &&
						updatedItem.processed_train_model_size !== undefined
					) {
						setData(updatedItem);
					}
				} else {
					clearInterval(intervalRef.current!);
					setIsPolling(false);
				}
			} catch (error) {
				console.error(`Polling error:`, error);
			}
		};

		intervalRef.current = setInterval(poll, 5000);
		poll();

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
				console.log("Polling interval cleared");
			}
		};
	}, []);

	return { mergedProgress, mergedTotal };
};
