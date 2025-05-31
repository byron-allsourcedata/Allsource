export function getBookingUrl(): string {
    return "https://meetings-na2.hubspot.com/mikhail-sofin/allsource";
}

export function getBookingUrlWithParams(utmParams: string | null) {
    // TODO: auto fill name and email for hubspot booking
    return getBookingUrl();
    // const baseUrl = "https://calendly.com/validateapi-allforce/30min";
    // if (!utmParams) return baseUrl;
    // const params = new URLSearchParams();
    // try {
    //     const parsed =
    //         typeof utmParams === "string" ? JSON.parse(utmParams) : utmParams;
    //     if (parsed && typeof parsed === "object") {
    //         Object.entries(parsed).forEach(([k, v]) => {
    //             if (v != null) params.append(k, String(v));
    //         });
    //     }
    // } catch {}
    // return `${baseUrl}?${params.toString()}`;
}

export function getCalendlyPopupUrl(utmParams: string | null) {
    // TODO: auto fill name and email for hubspot booking
    return getBookingUrl();
    // const baseUrl = "https://calendly.com/validateapi-allforce/30min";
    // const searchParams = new URLSearchParams();

    // if (utmParams) {
    //     try {
    //         const parsedUtmParams =
    //             typeof utmParams === "string"
    //                 ? JSON.parse(utmParams)
    //                 : utmParams;

    //         if (
    //             typeof parsedUtmParams === "object" &&
    //             parsedUtmParams !== null
    //         ) {
    //             Object.entries(parsedUtmParams).forEach(([key, value]) => {
    //                 if (value !== null && value !== undefined) {
    //                     searchParams.append(key, value as string);
    //                 }
    //             });
    //         }
    //     } catch (error) {
    //         console.error("Error parsing utmParams:", error);
    //     }
    // }

    // const finalUrl = `${baseUrl}${
    //     searchParams.toString() ? `?${searchParams.toString()}` : ""
    // }`;
    // return finalUrl;
}
