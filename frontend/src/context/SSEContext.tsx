"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import CustomNotification from "@/components/CustomNotification";
import PixelPopup from "@/components/PixelPopup";

interface Data {
  num: number;
}

interface SSEContextType {
  data: Data | null;
  newNotification: boolean;
  NotificationData: { id: number; text: string } | null;
  sourceProgress: Record<
    string,
    { total: number; processed: number; matched: number }
  >;
  smartLookaLikeProgress: Record<string, { total: number; processed: number }>;
  smartAudienceProgress: Record<string, { processed: number }>;
  validationProgress: Record<string, { total: number }>;
}

interface SSEProviderProps {
  children: ReactNode;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

export const SSEProvider: React.FC<SSEProviderProps> = ({ children }) => {
  const [data, setData] = useState<Data | null>(null);
  const [newNotification, setNewNotifications] = useState(false);
  const [showPixel, setShowPixel] = useState(false);
  const [NotificationData, setLatestNotification] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [sourceProgress, setSourceProgress] = useState<
    Record<string, { total: number; processed: number; matched: number }>
  >({});
  const [smartLookaLikeProgress, setLookaLikeProgress] = useState<
    Record<string, { total: number; processed: number }>
  >({});
  const [smartAudienceProgress, setSmartAudienceProgress] = useState<
    Record<string, { processed: number }>
  >({});
  const [validationProgress, setValidationProgress] = useState<
    Record<string, { total: number }>
  >({});

  const updateLookalikeProgress = (
    lookalike_id: string,
    total: number,
    processed: number
  ) => {
    setLookaLikeProgress((prev) => ({
      ...prev,
      [lookalike_id]: { total, processed },
    }));
  };

  const updateSmartAudienceProgress = (
    smart_audience_id: string,
    processed: number
  ) => {
    setSmartAudienceProgress((prev) => ({
      ...prev,
      [smart_audience_id]: { processed },
    }));
  };

  const updateSourceProgress = (
    source_id: string,
    total: number,
    processed: number,
    matched: number
  ) => {
    setSourceProgress((prev) => ({
      ...prev,
      [source_id]: { total, processed, matched },
    }));
  };

  const updateValidationProgress = (
    smart_audience_id: string,
    total: number
  ) => {
    setValidationProgress((prev) => ({
      ...prev,
      [smart_audience_id]: { total },
    }));
  };

  const handleNotificationDismiss = () => {
    setNewNotifications(false);
    setLatestNotification(null);
  };

  const url = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
    const evtSource = new EventSource(`${url}event-source?token=${token}`);
    evtSource.onmessage = (event) => {
      if (event.data) {
        const data = JSON.parse(event.data);
        if (data.status === "PIXEL_CODE_PARSE_FAILED") {
          showErrorToast("Could not find pixel code on your site");
        } else if (data.notification_id && data.notification_text) {
          setLatestNotification({
            id: data.notification_id,
            text: data.notification_text,
          });
        } else if (data.update_subscription && data.status) {
          showToast(`Subscription updated ${data.status}!`);
        } else if (data.status == "ZAPIER_CONNECTED") {
          showToast("Zapier has been successfully integrated!");
          const currentPath = window.location.pathname;
          if (currentPath === "/account-setup") {
            window.location.href = "/dashboard";
          } else {
            window.location.reload();
          }
        } else if (
          data.status == "PIXEL_CODE_INSTALLED" &&
          data.need_reload_page
        ) {
          setShowPixel(true);
        } else if (data.status == "SOURCE_PROCESSING_PROGRESS") {
          const { total, processed, source_id, matched } = data.data;
          if (!source_id) {
            console.error("source_id is undefined");
            return;
          }

          updateSourceProgress(source_id, total, processed, matched);
        } else if (data.status == "AUDIENCE_VALIDATION_PROGRESS") {
          const { total, smart_audience_id } = data.data;
          if (!smart_audience_id) {
            console.error("smart_audience_id is undefined");
            return;
          }

          updateValidationProgress(smart_audience_id, total);
        } else if (data.status == "AUDIENCE_LOOKALIKES_PROGRESS") {
          const { lookalike_id, total, processed } = data.data;
          if (!lookalike_id) {
            console.error("source_id is undefined");
            return;
          }

          updateLookalikeProgress(lookalike_id, total, processed);
        } else if (data.status === "AUDIENCE_SMARTS_PROGRESS") {
          const { smart_audience_id, processed } = data.data;
          if (!smart_audience_id) {
            console.error("source_id is undefined");
            return;
          }

          updateSmartAudienceProgress(smart_audience_id, processed);
        } else {
          if (data.percent) {
            const meItem = sessionStorage.getItem("me");
            const meData = meItem ? JSON.parse(meItem) : {};
            meData.percent_steps = data.percent;
            sessionStorage.setItem("me", JSON.stringify(meData));
          }
          setData(data);
          // window.location.reload();
        }
      }
    };

    evtSource.onerror = (error) => {
      evtSource.close();
    };

    return () => {
      evtSource.close();
    };
  }, [url]);

  const handleClosePixel = () => {
    setShowPixel(false);
    window.location.reload();
  };

  return (
    <SSEContext.Provider
      value={{
        data,
        newNotification,
        NotificationData,
        sourceProgress,
        smartLookaLikeProgress,
        smartAudienceProgress,
        validationProgress,
      }}
    >
      {showPixel && <PixelPopup open={showPixel} onClose={handleClosePixel} />}
      {children}
    </SSEContext.Provider>
  );
};

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within a SSEProvider");
  }
  return context;
};
