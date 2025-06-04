"use client";
import { Box } from "@mui/material";
import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import { AxiosError } from "axios";
import { SliderProvider, useSlider } from "../../../context/SliderContext";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import dayjs from "dayjs";
import { useNotification } from "../../../context/NotificationContext";

import { PixelAnalytics } from "./components/Analytics";
import { DashboardContacts } from "./components/DashboardContactB2B";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { hasNotification } = useNotification();
  const [showSlider, setShowSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const isCalendarOpen = Boolean(calendarAnchorEl);
  const [formattedDates, setFormattedDates] = useState<string>("");
  const [appliedDates, setAppliedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>("");
  const [typeBusiness, setTypeBusiness] = useState<"d2c" | "b2b" | "">("");
  const searchParams = useSearchParams();
  const [welcomePopup, setWelcomePopup] = useState<string | null>(null);
  const [values, setValues] = useState<DashboardContacts>({
    total_contacts_collected: 0,
    total_new_leads: 0,
    total_page_views: 0,
    total_returning_visitors: 0,
  });

  useEffect(() => {
    const storedPopup = localStorage.getItem("welcome_popup");
    setWelcomePopup(storedPopup);
  }, []);

  const handleDateLabelChange = (label: string) => {
    setSelectedDateLabel(label);
  };

  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const handleDateChange = (dates: {
    start: Date | null;
    end: Date | null;
  }) => {
    const { start, end } = dates;
    if (start && end) {
      const formattedStart = dayjs(start).format("MMM D");
      const formattedEnd = dayjs(end).format("MMM D, YYYY");

      setFormattedDates(`${formattedStart} - ${formattedEnd}`);
    } else if (start) {
      const formattedStart = dayjs(start).format("MMM D, YYYY");
      setFormattedDates(formattedStart);
    } else if (end) {
      const formattedEnd = dayjs(end).format("MMM D, YYYY");
      setFormattedDates(formattedEnd);
    } else {
      setFormattedDates("");
    }
  };

  const handleApply = (dates: { start: Date | null; end: Date | null }) => {
    if (dates.start && dates.end) {
      setAppliedDates(dates);
      setCalendarAnchorEl(null);

      handleCalendarClose();
    } else {
      setAppliedDates({ start: null, end: null });
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      const fetchData = async () => {
        try {
          const response = await axiosInstance.get("/check-user-authorization");
          if (response.data.status === "SUCCESS") {
            setShowCharts(true);
          }
          if (response.data.status === "NEED_BOOK_CALL") {
            setShowSlider(true);
          } else {
            setShowSlider(false);
          }
          let business_type = "d2c";
          const storedMe = localStorage.getItem("account_info");
          if (storedMe) {
            const storedData = JSON.parse(storedMe);
            business_type = storedData.business_type;
            setTypeBusiness(storedData.business_type);
          }
        } catch (error) {
          if (error instanceof AxiosError && error.response?.status === 403) {
            if (error.response.data.status === "NEED_BOOK_CALL") {
              setShowSlider(true);
            } else {
              setShowSlider(false);
            }
          } else {
            console.error("Error fetching data:", error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      router.push("/signin");
    }
  }, [setShowSlider, router]);

  const [tabIndex, setTabIndex] = useState(0);
  useEffect(() => {
    const fetchData = async () => {
      let business_type = "b2b";
      const storedMe = localStorage.getItem("account_info");
      if (storedMe) {
        const storedData = JSON.parse(storedMe);
        business_type = storedData.business_type;
        setTypeBusiness(storedData.business_type);
      }
      if (business_type === "b2b") {
        setTabIndex(1);
      } else {
        try {
          setLoading(true);
          const response = await axiosInstance.get("/dashboard/revenue");
          if (
            !response?.data.total_counts ||
            !response?.data.total_counts.total_revenue
          ) {
            setTabIndex(1);
            return;
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <CustomizedProgressBar />;
  }

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  return (
    <Box>
      <PixelAnalytics
        typeBusiness={typeBusiness}
        values={values}
        setValues={setValues}
        showCharts={showCharts}
        showSlider={showSlider}
        welcomePopup={welcomePopup}
        hasNotification={hasNotification}
        isCalendarOpen={isCalendarOpen}
        tabIndex={tabIndex}
        selectedDateLabel={selectedDateLabel}
        formattedDates={formattedDates}
        appliedDates={appliedDates}
        calendarAnchorEl={calendarAnchorEl}
        handleCalendarClose={handleCalendarClose}
        handleDateChange={handleDateChange}
        handleApply={handleApply}
        handleDateLabelChange={handleDateLabelChange}
        handleTabChange={handleTabChange}
        handleCalendarClick={handleCalendarClick}
      />
    </Box>
  );
};

const DashboardPage: React.FC = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <SliderProvider>
        <Dashboard />
      </SliderProvider>
    </Suspense>
  );
};

export default DashboardPage;
