"use client";
import React, { useLayoutEffect, useRef, useState } from "react";
import axiosInstance from "../../../axios/axiosInterceptorInstance";
import {
    Box,
    Button,
    Typography,
    Modal,
    IconButton,
    Link,
    Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PopupButton } from "react-calendly";

const style = {
    position: "absolute" as "absolute",
    top: 0,
    right: 0,
    width: "40%",
    height: "100%",
    bgcolor: "background.paper",
    boxShadow: 24,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    transition: "transform 0.3s ease-in-out",
    transform: "translateX(100%)",
    "@media (max-width: 1199px)": {
        width: "50%",
        p: 2,
    },
    "@media (max-width: 900px)": {
        width: "60%",
        p: 0,
    },
    "@media (max-width: 600px)": {
        width: "100%",
        p: 0,
    },
};

const openStyle = {
    transform: "translateX(0%)",
    right: 0,
};

interface PopupProps {
    open: boolean;
    handleClose: () => void;
    handleChoosePlan: () => void;
}

const PlanSlider: React.FC<PopupProps> = ({
    open,
    handleClose,
    handleChoosePlan,
}) => {
    const calendlyPopupRef = useRef<HTMLDivElement | null>(null);
    const [utmParams, setUtmParams] = useState<string | null>(null);
    const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
    useLayoutEffect(() => {
        if (calendlyPopupRef.current) {
            fetchPrefillData();
            setRootElement(calendlyPopupRef.current);
        }
    }, []);

    const fetchPrefillData = async () => {
        try {
          const response = await axiosInstance.get('/calendly');
          const user = response.data.user;
    
          if (user) {
            const { full_name, email, utm_params } = user;
            setUtmParams(utm_params)
          }
        } catch (error) {
          setUtmParams(null);
        }
      };
    
      const calendlyPopupUrl = () => {
        const baseUrl = "https://calendly.com/maximiz/activate-free-trial";
        const searchParams = new URLSearchParams();
      
        if (utmParams) {
          try {
            const parsedUtmParams = typeof utmParams === 'string' ? JSON.parse(utmParams) : utmParams;
      
            if (typeof parsedUtmParams === 'object' && parsedUtmParams !== null) {
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
      
        const finalUrl = `${baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        return finalUrl;
      };

    return (
        <>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                sx={{ overflow: "hidden" }}
            >
                <Box sx={{ ...style, ...(open ? openStyle : {}) }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            borderBottom: "1px solid #e4e4e4",
                            p: 2, pb: 1.4,
                        }}
                    >
                        <Typography
                            className="first-sub-title"
                            sx={{
                                pt: 1,
                                textAlign: "left",
                                "@media (max-width: 600px)": {
                                    fontSize: "16px",
                                    textAlign: "left",
                                },
                                "@media (min-width: 1500px)": {
                                    fontSize: "22px !important",
                                    lineHeight: "25.2px !important",
                                },
                            }}
                        >
                            Activate your Free Trial
                        </Typography>
                        <IconButton onClick={handleClose}>
                            <CloseIcon
                                sx={{
                                    "@media (min-width: 1500px)": {
                                        fontSize: "28px !important",
                                        lineHeight: "25.2px !important",
                                    },
                                }}
                            />
                        </IconButton>
                    </Box>
                    <Divider />
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            padding: 4,
                            pt: 2,
                            display: "flex",
                            flexDirection: "column",
                            textAlign: "center",
                            alignItems: "center",
                            "@media (max-width: 960px)": { pl: 4, pr: 4 },
                            "@media (max-width: 600px)": { pl: 2, pr: 2 },
                        }}
                    >
                        <img
                            src="/slider-bookcall.png"
                            alt="Setup"
                            style={{
                                width: "44%",
                                marginBottom: "3rem",
                                marginTop: "1.9rem",
                            }}
                        />
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                height: "100%",
                                width: "100%",
                            }}
                        >
                            <Typography
                                variant="body1"
                                gutterBottom
                                className="second-sub-title"
                                sx={{
                                    color: "#4A4A4A",
                                    textAlign: "left",
                                    fontFamily: "Nunito Sans",
                                    fontWeight: "500",
                                    fontSize: "18px",
                                    lineHeight: "23.2px",
                                    marginBottom: "1.5rem",
                                    "@media (max-width: 600px)": {
                                        fontSize: "18px",
                                        lineHeight: "22px",
                                        marginBottom: "2em",
                                        mt: 2,
                                    },
                                    "@media (min-width: 1500px)": {
                                        fontSize: "22px",
                                        lineHeight: "25.2px",
                                        marginBottom: "2em",
                                    },
                                }}
                            >
                                Don&apos;t miss out on anymore revenue speak to one of our
                                specialists to get your account live
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "start",
                                    "@media (min-width: 1500px)": { gap: 1 },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        gap: 1.5,
                                        alignItems: "center",
                                    }}
                                >
                                    <CheckCircleIcon
                                        sx={{
                                            color: "rgba(110, 193, 37, 1)",
                                            fontSize: "20px",
                                            "@media (min-width: 1500px)": { fontSize: "24px" },
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        gutterBottom
                                        className="table-heading"
                                        sx={{
                                            mb: "0.5rem",
                                            "@media (max-width: 600px)": { fontSize: "16px" },
                                            "@media (min-width: 1500px)": {
                                                fontSize: "20px",
                                                lineHeight: "25.2px",
                                            },
                                        }}
                                    >
                                        Capture Anonymous visitors:
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "start", pl: 4.5 }}>
                                    <Typography
                                        className="table-data"
                                        sx={{
                                            textAlign: "left",
                                            marginBottom: "2rem",
                                            "@media (max-width: 600px)": {
                                                fontSize: "14px",
                                                lineHeight: "18px",
                                                marginBottom: "1em",
                                            },
                                            "@media (min-width: 1500px)": {
                                                fontSize: "18px",
                                                lineHeight: "19.6px",
                                                marginBottom: "2em",
                                            },
                                        }}
                                    >
                                        Once you are live within 30 minutes you will start
                                        collecting the details of your anonymous visitors.
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "start",
                                    "@media (min-width: 1500px)": { gap: 1 },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        gap: 1.5,
                                        alignItems: "center",
                                    }}
                                >
                                    <CheckCircleIcon
                                        sx={{
                                            color: "rgba(110, 193, 37, 1)",
                                            fontSize: "20px",
                                            "@media (min-width: 1500px)": { fontSize: "24px" },
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        gutterBottom
                                        className="table-heading"
                                        sx={{
                                            mb: "0.5rem",
                                            "@media (max-width: 600px)": { fontSize: "16px" },
                                            "@media (min-width: 1500px)": {
                                                fontSize: "20px",
                                                lineHeight: "25.2px",
                                            },
                                        }}
                                    >
                                        Connect your 3
                                        <span
                                            style={{ verticalAlign: "super", fontSize: "smaller" }}
                                        >
                                            rd
                                        </span>{" "}
                                        party integrations:
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "start", pl: 4.5 }}>
                                    <Typography
                                        className="table-data"
                                        sx={{
                                            textAlign: "left",
                                            marginBottom: "2rem",
                                            "@media (max-width: 600px)": {
                                                fontSize: "14px",
                                                lineHeight: "18px",
                                                marginBottom: "1em",
                                            },
                                            "@media (min-width: 1500px)": {
                                                fontSize: "18px",
                                                lineHeight: "19.6px",
                                                marginBottom: "2em",
                                            },
                                        }}
                                    >
                                        Simply connect all your 3
                                        <span
                                            style={{ verticalAlign: "super", fontSize: "smaller" }}
                                        >
                                            rd
                                        </span>{" "}
                                        party integrations such as your store or email provider to
                                        start contacting your leads.
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "start",
                                    "@media (min-width: 1500px)": { gap: 1 },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        gap: 1.5,
                                        alignItems: "center",
                                    }}
                                >
                                    <CheckCircleIcon
                                        sx={{
                                            color: "rgba(110, 193, 37, 1)",
                                            fontSize: "20px",
                                            "@media (min-width: 1500px)": { fontSize: "24px" },
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        gutterBottom
                                        className="table-heading"
                                        sx={{
                                            mb: "0.5rem",
                                            "@media (max-width: 600px)": { fontSize: "16px" },
                                            "@media (min-width: 1500px)": {
                                                fontSize: "20px",
                                                lineHeight: "25.2px",
                                            },
                                        }}
                                    >
                                        Watch the revenue roll in:
                                    </Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "start", pl: 4.5 }}>
                                    <Typography
                                        className="table-data"
                                        sx={{
                                            color: "rgba(74, 74, 74, 1)",
                                            fontFamily: "Nunito Sans",
                                            textAlign: "left",
                                            fontWeight: "400",
                                            fontSize: "16px",
                                            lineHeight: "19.6px",
                                            marginBottom: "1em",
                                            "@media (max-width: 600px)": {
                                                fontSize: "14px",
                                                lineHeight: "18px",
                                                marginBottom: "1em",
                                            },
                                            "@media (min-width: 1500px)": {
                                                fontSize: "18px",
                                                lineHeight: "19.6px",
                                                marginBottom: "4em",
                                            },
                                        }}
                                    >
                                        Within a few days start watching the sales and revenue from
                                        your account.
                                    </Typography>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "flex-end",
                                    paddingTop: "3em",
                                    maxHeight: "20em",
                                    gap: 2,
                                    "@media (max-width: 600px)": {
                                        justifyContent: "center",
                                        pb: 3,
                                        width: "100%",
                                    },

                                }}
                            >
                                <Link
                                    href={calendlyPopupUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleClose}
                                    sx={{
                                        display: "inline-block",
                                        width: "100%",
                                        textDecoration: "none",
                                        color: "#fff",
                                        padding: "1em 5em",
                                        maxHeight: "48px",
                                        fontFamily: "Nunito Sans",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        borderRadius: "4px",
                                        border: "none",
                                        lineHeight: "22.4px",
                                        backgroundColor: "#5052B2",
                                        textTransform: "none",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        "@media (max-width: 380px)": {
                                            padding: "1em 4em",
                                        },
                                    }}
                                >
                                    Get Started
                                </Link>


                                <Button
                                    variant="contained"
                                    onClick={handleChoosePlan}
                                    sx={{
                                        backgroundColor: "rgba(56, 152, 252, 1)",
                                        fontFamily: "Nunito Sans",
                                        textTransform: "none",
                                        lineHeight: "19.6px",
                                        fontWeight: "600",
                                        padding: "1em 5em",
                                        textWrap: "nowrap",
                                        fontSize: "14px",
                                        "@media (max-width: 380px)": {
                                            padding: '1em 4em'
                                        },
                                    }}
                                >
                                    Choose Plan
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default PlanSlider;
