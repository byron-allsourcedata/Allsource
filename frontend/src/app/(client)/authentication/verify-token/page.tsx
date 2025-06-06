"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
  showErrorToast,
  showInfoToast,
  showToast,
} from "@/components/ToastNotification";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

const VerifyToken = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mail = searchParams.get("mail");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          if (mail) {
            const response = await axiosInstance.get(
              `settings/account-details/change-email?token=${token}&mail=${mail}`
            );
            if (typeof window !== "undefined") {
              if (response.data.status === "SUCCESS") {
                localStorage.setItem("welcome_popup", "true");
                showToast("You have successfully verified your email");
                const newToken = response.data.token;
                localStorage.removeItem("token");
                localStorage.setItem("token", newToken);
              } else if (response.data.status === "INCORRECT_TOKEN") {
                showErrorToast("The link is incorrect or outdated");
              } else if (response.data.status === "INCORRECT_MAIL") {
                showErrorToast("The link is incorrect mail");
              }
              setTimeout(() => {
                router.push("/settings");
              }, 2500);
            }
          } else {
            const response = await axiosInstance.get(
              `/authentication/verify-token?token=${token}`
            );
            if (
              response.data.status === "SUCCESS" ||
              response.data.status === "EMAIL_ALREADY_VERIFIED"
            ) {
              if (typeof window !== "undefined") {
                if (response.data.status === "EMAIL_ALREADY_VERIFIED") {
                  localStorage.setItem("welcome_popup", "true");
                  showInfoToast("Email has already been verified");
                } else if (response.data.status === "SUCCESS") {
                  localStorage.setItem("welcome_popup", "true");
                  showToast("You have successfully verified your email");
                }
                const newToken = response.data.token;
                localStorage.removeItem("token");
                localStorage.setItem("token", newToken);

                setTimeout(() => {
                  // router.push('/account-setup');
                  router.push("/get-started");
                }, 2500);
              }
            } else if (response.data.status === "INCORRECT_TOKEN") {
              showErrorToast("The link is incorrect or outdated");
              const localtoken = localStorage.getItem("token");
              if (localtoken) {
                router.push("/get-started");
              } else {
                router.push("/signin");
              }
            }
          }
        } catch (error) {
          console.error("Error verifying token:", error);
        }
      }
    };

    verifyToken();
  }, [token, router]);

  return <div>Check token, please wait</div>;
};

const VerifyTokenWithSuspense = () => (
  <Suspense fallback={<CustomizedProgressBar />}>
    <VerifyToken />
  </Suspense>
);

export default VerifyTokenWithSuspense;
function Sleep(arg0: number) {
  throw new Error("Function not implemented.");
}
