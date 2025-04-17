import { useState, useEffect } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";

interface DataItem {
    id: string;
    name: string;
    type: string;
    size: string;
}

interface SourceSourceData {
    id: string;
    name: string;
    source_type: string;
    matched_records: string;
    source_origin: string;
    domain: string;
}

interface LookalikeSourceData {
    id: string;
    name: string;
    source_type: string;
    size: number;
    source_origin: string;
    domain: string;
}

export const useFetchAudienceData = () => {
    const [sourceData, setSourceData] = useState<DataItem[]>([]);
    const [lookalikeData, setLookalikeData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const getSourceType = (origin: string, type: string, domain: string) => {
        if (origin === "pixel") {
            return domain
        }
        return setSourceTypeFortmat(type)
    }

    const setSourceTypeFortmat = (sourceType: string) => {
        return sourceType
          ?.split(",")
          .map((item) =>
            item
              .split("_")
              .map((subItem) => subItem.charAt(0).toUpperCase() + subItem.slice(1))
              .join(" ")
          )
          .join(", ");
      };

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
                    sources.map((source: SourceSourceData) => ({
                        id: source.id,
                        name: source.name,
                        type: getSourceType(source.source_origin, source.source_type, source.domain),
                        size: source.matched_records?.toLocaleString() || "0",
                    }))
                );


                setLookalikeData(
                    lookalikes.map((lookalike: LookalikeSourceData) => ({
                        id: lookalike.id,
                        name: lookalike.name,
                        type: getSourceType(lookalike.source_origin, lookalike.source_type, lookalike.domain),
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
