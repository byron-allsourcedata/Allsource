import { useState, useEffect, useMemo, useRef } from "react";

interface PollingData {
  id: string;
  size: number;
  size_progress: number;
}

interface sseProgress {
  processed: number;
  total: number;
}

export const usePolling = (
  initialItem: PollingData,
  sseProgress: sseProgress,
  fetchDataCallback: (id: string) => Promise<PollingData>
) => {
  const [data, setData] = useState<PollingData>(initialItem);
  const [isPolling, setIsPolling] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const mergedProgress = useMemo(
    () => Math.max(data.size_progress ?? 0, sseProgress?.processed ?? 0),
    [data.size_progress, sseProgress?.processed]
  );

  const mergedTotal = useMemo(
    () => Math.max(data.size ?? 0, sseProgress?.total ?? 0),
    [data.size, sseProgress?.total]
  );

  useEffect(() => {
    if (!isPolling) return;

    const poll = async () => {
      try {
        const { size_progress, size} = data

        if (size_progress < size || size_progress === 0) {
          console.log(`Polling for item ${data.id}`);
          const updatedItem = await fetchDataCallback(data.id);

          if (
            updatedItem &&
            updatedItem.size !== undefined &&
            updatedItem.size_progress !== undefined
          ) {
            setData(updatedItem);
          }


        } else {
          console.log(`Polling stopped for item ${data.id}`);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsPolling(false);
        }
      } catch (error) {
        console.error(`Error during polling for item ${data.id}:`, error);
      }
    };

    intervalRef.current = setInterval(poll, 10000);
    poll();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("Polling interval cleared");
      }
    };
  }, [data.size, data.size_progress, isPolling, fetchDataCallback]);

  return { mergedProgress, mergedTotal };
};
