import useAxios from "axios-hooks";

export const useAxiosHook = (baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || "") => {
  const [{ data, loading, error }, execute] = useAxios(
    {
      baseURL,
    },
    { manual: true }
  );

  const sendRequest = async ({
    url,
    method = "GET",
    data = null,
    params = null,
  }: {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    params?: Record<string, any> | null;
  }) => {
    const accessToken = localStorage.getItem("token");
    let currentDomain = sessionStorage.getItem("current_domain");

    if (!currentDomain && accessToken) {
      try {
        const response = await execute({
          url: "/domains/",
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response?.status === 200 && response.data.length > 0) {
          currentDomain = response.data[0].domain;
          if(currentDomain) {
            sessionStorage.setItem("current_domain", currentDomain);
          }
        }
      } catch (error) {
        console.error("Error fetching domain:", error);
      }
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      headers.Authorization = `Bearer`;
    }
    if (currentDomain) {
      headers.CurrentDomain = currentDomain;
    }

    return execute({
      url,
      method,
      data,
      params,
      headers,
    });
  };

  return {
    data,
    loading,
    error,
    sendRequest,
  };
};
