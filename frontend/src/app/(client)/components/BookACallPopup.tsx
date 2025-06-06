"use client";
import React from "react";
import { Box, Button, Typography, Drawer, Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CustomButton } from "@/components/ui";
import {  useBookingUrl } from "@/services/booking";
import axiosInstance from '@/axios/axiosInterceptorInstance';

export interface LeftMenuItem {
  Icon: React.ElementType;
  title: string;
  subtitle: string;
}

export interface LeftMenuImage {
  url: string;
  width?: number;
  height: number;
}

export interface LeftMenuProps {
  header: string;
  subtitle?: string;
  items: LeftMenuItem[];
  image?: LeftMenuImage;
}

type Props = {
  open: boolean;
  handleClose: () => void;
  leftMenu?: LeftMenuProps;
};

export const BookACallPopup: React.FC<Props> = ({
  open,
  handleClose,
  leftMenu
}) => {
  const router = useRouter();
  const bookingUrl = useBookingUrl(axiosInstance)

  const handleBookACall = () => {
    window.open(bookingUrl, "_blank");
  };

  const handleInstallUpgrade = () => {
    router.push('/settings?section=subscription');
  };

  if (!open) return null;
  return (
    <>
      <Backdrop
        open={open}
        onClick={handleClose}
        sx={{ zIndex: 1200, color: "#fff" }}
      />
      <Drawer
        anchor="right"
        open={open}
        variant="persistent"
        PaperProps={{
          sx: {
            position: "fixed",
            display: "flex",
            zIndex: 1300,
            top: 0,
            bottom: 0,
            "@media (max-width: 600px)": {
              width: "100%",
            },
          },
        }}
      >
        <Box sx={{ width: "100%", display: "flex", height: "100%", }}>
          {leftMenu && (
            <Box
              sx={{
                height: "100%",
                bgcolor: "rgba(245, 248, 253, 1)",
                p: 4,
                overflowY: "auto",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  fontSize: "20px",
                  mb: 1,
                }}
              >
                {leftMenu.header}
              </Typography>
              {leftMenu.subtitle && (
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontFamily: "Nunito Sans",
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "rgba(0,0,0,0.6)",
                    mb: 3,
                  }}
                >
                  {leftMenu.subtitle}
                </Typography>
              )}
              {leftMenu.items.map((it, i) => {
                const Icon = it.Icon;
                return (
                  <Box
                    key={i}
                    sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "rgba(56, 152, 252, 1)",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ color: "rgba(255, 255, 255, 1)", fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Nunito Sans",
                          fontWeight: 600,
                          fontSize: "16px",
                        }}
                      >
                        {it.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Nunito Sans",
                          fontWeight: 400,
                          fontSize: "14px",
                          color: "rgba(0,0,0,0.6)",
                        }}
                      >
                        {it.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
              {leftMenu.image && (
                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Image
                    src={leftMenu.image.url}
                    alt="Image"
                    width={leftMenu.image.width ?? 200}
                    height={leftMenu.image.height ?? 200}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </Box>
              )}
            </Box>
          )}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "25px 16px",
              }}
            >
              <CloseIcon
                sx={{ cursor: "pointer" }}
                onClick={() => handleClose()}
              />
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  flexDirection: "column",
                  padding: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                    margin: "0 auto",
                    width: 120,
                    height: 120,
                    mb: 1,
                    borderRadius: "50%",
                    backgroundColor: "#3898FC",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src="/katie_jones.svg"
                    alt="Katie Johns"
                    width={120}
                    height={120}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>

                <Typography
                  sx={{ textAlign: "center", fontWeight: "bold" }}
                  variant="h6"
                >
                  Katie Johns
                </Typography>
                <Typography
                  sx={{ textAlign: "center", color: "gray" }}
                  variant="subtitle1"
                >
                  Your Expert
                </Typography>
              </Box>

              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 2,
                  gap: 2,
                }}
              >
                <Box sx={{ width: "100%", px: 2, minWidth: 430 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: "Nunito Sans",
                        fontWeight: 600,
                        fontSize: "16px",
                        lineHeight: "20px",
                        letterSpacing: "0%",
                        textAlign: "left",
                      }}
                    >
                      Skip the Struggle - Book Your Guided Setup
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: "Nunito Sans",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0%",
                        color: "rgba(0, 0, 0, 0.6)",
                        textAlign: "left",
                        mt: 1,
                      }}
                    >
                      Get personalized platform training and fix setup issues.
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                    {[
                      "Platform basics explained clearly",
                      "Your specific questions answered",
                      "Troubleshooting for any blockers",
                    ].map((text) => (
                      <Box key={text} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Image
                          src="/success-icon.svg"
                          alt="success-icon"
                          width={16}
                          height={16}
                          style={{ objectFit: "cover" }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{ textAlign: "left" }}
                        >
                          {text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "flex", textAlign: "left", mb: 2,  gap: 2 }}>
                    <CustomButton
                      onClick={handleInstallUpgrade}
                      variant="outlined"
                      sx={{
                        width: "50%",
                        py: 1.5,
                      }}
                    >
                      Install Upgrade
                    </CustomButton>
                    <CustomButton
                      onClick={handleBookACall}
                      variant="contained"
                      sx={{
                        width: "50%",
                        py: 1.5,
                      }}
                    >
                      Book a consultations
                    </CustomButton>
                  </Box>

                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontFamily: "Nunito Sans",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0%",
                      color: "rgba(0, 0, 0, 0.6)",
                      textAlign: "left",
                    }}
                  >
                    You can pick date and time in the next step
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};
