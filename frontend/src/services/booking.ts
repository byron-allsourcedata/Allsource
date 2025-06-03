import { AxiosInstance } from "axios";
import { useEffect, useState } from "react";

export type PrefillData = {
  email: string;
  first_name: string;
  last_name: string;
};

export function getBookingUrl(): string {
  return "https://meetings-na2.hubspot.com/mikhail-sofin/allsource";
}

export function useBookingUrl(axios: AxiosInstance) {
  const [utmParams, setUtmParams] = useState<string | null>(null);

  const { prefillData } = usePrefillData(axios, setUtmParams);

  return getCalendlyPopupUrl(utmParams, prefillData);
}

export function usePrefillData(
  axios: AxiosInstance,
  setUtmParams: (utmParams: string | null) => void
) {
  const initialPrefill = { email: "", first_name: "", last_name: "" };
  const [prefillData, setPrefillData] = useState<{
    email: string;
    first_name: string;
    last_name: string;
  }>(initialPrefill);
  const [isPrefillLoaded, setIsPrefillLoaded] = useState(false);

  const fetchPrefillData = async () => {
    try {
      const response = await axios.get("/calendly");
      const user = response.data.user;

      if (user) {
        const { first_name, last_name, email, utm_params } = user;
        setUtmParams(utm_params);
        setPrefillData({
          email: email || "",
          first_name: first_name || "",
          last_name: last_name || "",
        });
      } else {
        setPrefillData(initialPrefill);
      }
    } catch (error) {
      setPrefillData(initialPrefill);
    } finally {
      setIsPrefillLoaded(true);
    }
  };

  useEffect(() => {
    fetchPrefillData();
  }, []);

  return {
    prefillData,
    setPrefillData,
    isPrefillLoaded,
  };
}

export function getCalendlyPopupUrl(
  utmParams: string | null,
  prefillParams: PrefillData
) {
  const baseUrl = getBookingUrl();
  const searchParams = new URLSearchParams();

  if (prefillParams) {
    Object.entries(prefillParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });
  }

  if (utmParams) {
    try {
      const parsedUtmParams =
        typeof utmParams === "string" ? JSON.parse(utmParams) : utmParams;

      if (typeof parsedUtmParams === "object" && parsedUtmParams !== null) {
        Object.entries(parsedUtmParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            searchParams.append(key, value as string);
          }
        });
      }
    } catch (error) {
      console.error("Error parsing utmParams:", error);
    }
  }

  const finalUrl = `${baseUrl}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  return finalUrl;
}
