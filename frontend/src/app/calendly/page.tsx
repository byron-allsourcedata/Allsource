// pages/calendly.tsx
'use client';
import React from "react";
import { useCalendlyEventListener, InlineWidget } from "react-calendly";

const CalendlyPage: React.FC = () => {
  useCalendlyEventListener({
    onProfilePageViewed: () => console.log("onProfilePageViewed"),
    onDateAndTimeSelected: () => console.log("onDateAndTimeSelected"),
    onEventTypeViewed: () => console.log("onEventTypeViewed"),
    onEventScheduled: (e) => console.log(e),
  });

  return (
    <div className="App">
      <h1>Calendly Integration Test</h1>
      <InlineWidget url="https://calendly.com/nickit-schatalow09/maximiz" />
    </div>
  );
};

export default CalendlyPage;
