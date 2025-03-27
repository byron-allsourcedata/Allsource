import { useState, useEffect } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface DataItem {
    id: string;
    name: string;
    type: string;
    size: string;
}

export const useFetchAudienceData = () => {
    const [sourceData, setSourceData] = useState<DataItem[]>([]);
    const [lookalikeData, setLookalikeData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get("/audience-smarts/get-datasource");


                if (!data || !Array.isArray(data.lookalikes) || !Array.isArray(data.sources)) {
                    throw new Error("Unexpected response format");
                }


                const { lookalikes, sources } = data;


                setSourceData(
                    sources.map((source: any) => ({
                        id: source.id,
                        name: source.name,
                        type: source.source_type,
                        size: source.total_records?.toLocaleString() || "0",
                    }))
                );


                setLookalikeData(
                    lookalikes.map((lookalike: any) => ({
                        id: lookalike.id,
                        name: lookalike.name,
                        type: lookalike.source_type,
                        size: lookalike.size?.toLocaleString() || "0",
                    }))
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { sourceData, lookalikeData, loading };
};
