"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  IconButton,
  Divider,
  Grid,
  Link,
  Input,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import CustomTooltip from "@/components/customToolTip";
import { styles } from "../../../../css/cmsStyles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import {
  showErrorToast,
  showToast,
} from "../../../../components/ToastNotification";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useHints } from "@/context/HintsContext";
import HintCard from "@/app/(client)/components/HintCard";

interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string;
}

const style = {
  bgcolor: "background.paper",
  p: 3,
  mt: 2,
  borderRadius: 2,
  border: "1px solid rgba(231, 231, 233, 1)",
  width: "100%",
  boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.08)",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease-in-out",
  transform: "translateX(100%)",
  "@media (max-width: 600px)": {
    width: "100%",
    height: "100%",
    p: 2,
  },
};

const openStyle = {
  transform: "translateX(0%)",
  right: 0,
};

const typographyStyles = {
  textTransform: "none",
  fontFamily: "Nunito Sans",
  fontSize: "14px",
  fontWeight: "500",
  lineHeight: "19.6px",
  color: "rgba(74, 74, 74, 1) !important",
  textWrap: "nowrap",
  paddingTop: "1em",
  paddingBottom: "0.75em",
};

const buttonStyles = (platform?: boolean) => ({
  backgroundColor: platform ? "rgba(240, 242, 245, 1)" : "#fff",
  display: "flex",
  flexDirection: "column",
  padding: "1em",
  borderColor: "rgba(228, 228, 228, 1)",
  border: platform
    ? "1px solid rgba(56, 152, 252, 1)"
    : "1px solid rgba(228, 228, 228, 1)",
  width: "100%",
});

const buttonGoogle = (platform?: boolean) => ({
  backgroundColor: platform ? "rgba(240, 242, 245, 1)" : "#fff",
  display: "flex",
  flexDirection: "column",
  padding: "1em 2em 1.5em 1em",
  borderColor: "rgba(228, 228, 228, 1)",
  border: platform
    ? "1px solid rgba(56, 152, 252, 1)"
    : "1px solid rgba(228, 228, 228, 1)",
  width: "100%",
});

const typographyGoogle = {
  textTransform: "none",
  color: "rgba(74, 74, 74, 1) !important",
  textWrap: "wrap",
  paddingTop: "1em",
  paddingBottom: "0.25em",
};

const maintext = {
  fontFamily: "Nunito Sans",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "19.6px",
  color: "rgba(0, 0, 0, 1)",
  paddingTop: "1em",
  paddingBottom: "0.75em",
};

const subtext = {
  fontFamily: "Nunito Sans",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "19.6px",
  textAlign: "center",
  color: "rgba(74, 74, 74, 1)",
  paddingTop: "0.25em",
  "@media (max-width: 600px)": { textAlign: "left", fontSize: "14px" },
};

interface CmsData {
  manual?: string;
  pixel_client_id?: string;
}

interface PopupProps {
  open: boolean;
  handleClose: () => void;
  pixelCode: string;
  pixel_client_id: string;
}

const Popup: React.FC<PopupProps> = ({ open, pixelCode, pixel_client_id }) => {
  const { changePixelSetupHint, pixelSetupHints, resetPixelSetupHints } =
    useHints();
  const [showHint, setShowHint] = useState(true);
  const [selectedCMS, setSelectedCMS] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string>("Install on CMS");
  const [shop_domain, setDomain] = useState<string>(() => {
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("current_domain")
    ) {
      return sessionStorage.getItem("current_domain") || "";
    }
    return "";
  });
  const [access_token, setAccessToken] = useState("");
  const [accessTokenExists, setAccessTokenExists] = useState(false);
  const [storeHash, setstoreHash] = useState("");
  const [storeHashError, setStoreHashError] = useState(false);
  const sourcePlatform = useMemo(() => {
    if (typeof window !== "undefined") {
      const savedMe = sessionStorage.getItem("me");
      if (savedMe) {
        try {
          const parsed = JSON.parse(savedMe);
          return parsed.source_platform || "";
        } catch (error) {}
      }
    }
    return "";
  }, [typeof window !== "undefined" ? sessionStorage.getItem("me") : null]);
  const [errors, setErrors] = useState({
    access_token: "",
    shop_domain: "",
  });

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response_shopify = await axiosInstance.get(
          "/integrations/credentials/shopify"
        );
        if (response_shopify.status === 200) {
          setDomain(response_shopify.data.shop_domain);
          setAccessToken(response_shopify.data.access_token);
          if (response_shopify.data.access_token) {
            setAccessTokenExists(true);
          }
        }
      } catch (error) {}
      try {
        const response_big_commerce = await axiosInstance.get(
          "/integrations/credentials/bigcommerce"
        );
        if (response_big_commerce.status === 200) {
          setstoreHash(response_big_commerce.data.shop_domain);
          if (response_big_commerce.data.shop_domain) {
            setAccessTokenExists(true);
          }
        }
      } catch (error) {}

      if (sourcePlatform === "shopify") {
        setSelectedCMS("Shopify");
        setHeaderTitle("Shopify settings");
      } else if (sourcePlatform === "big_commerce") {
        setSelectedCMS("Bigcommerce");
        setHeaderTitle("Bigcommerce settings");
      }
    };
    fetchCredentials();
  }, []);

  const [isFocused, setIsFocused] = useState(true);
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pixel_client_id);
    showToast("Site ID copied to clipboard!");
  };

  const handleStoreHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setstoreHash(value);
    setStoreHashError(!!value);
  };

  const handleButtonClick = async (cms: string) => {
    setSelectedCMS(cms);
    setShowHint(false);
    setHeaderTitle(`Install with ${cms}`);
  };

  const handleBackClick = () => {
    setSelectedCMS(null);
    setHeaderTitle("Install on CMS");
  };

  const validateField = (
    value: string | undefined,
    type: "access_token" | "shop_domain"
  ): string => {
    const stringValue = value ? value.trim() : "";

    switch (type) {
      case "access_token":
        return stringValue ? "" : "Access Token is required";
      case "shop_domain":
        return stringValue ? "" : "Shop Domain is required";
      default:
        return "";
    }
  };

  const handleSubmitBigcommerce = async () => {
    const response = await axiosInstance.get(
      "/integrations/bigcommerce/oauth",
      { params: { store_hash: storeHash } }
    );
    window.location.href = response.data.url;
  };

  const handleSubmit = async () => {
    const newErrors = {
      access_token: validateField(access_token, "access_token"),
      shop_domain: validateField(shop_domain, "shop_domain"),
    };
    setErrors(newErrors);

    if (newErrors.access_token || newErrors.shop_domain) {
      return;
    }

    const accessToken = localStorage.getItem("token");
    if (!accessToken) return;

    const body: Record<string, any> = {
      shopify: {
        shop_domain: shop_domain.trim(),
        access_token: access_token.trim(),
      },
      pixel_install: true,
    };

    try {
      const response = await axiosInstance.post("/integrations/", body, {
        params: {
          service_name: "shopify",
        },
      });

      if (response.status === 200) {
        showToast("Successfully installed pixel");
      } else {
        showErrorToast("Failed to install pixel");
      }
    } catch (error) {
      showErrorToast("An error occurred while installing the pixel");
    }
  };

  const handleInstallButtonClick = () => {
    let url = shop_domain.trim();

    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
      }

      const hasQuery = url.includes("?");
      const newUrl =
        url +
        (hasQuery ? "&" : "?") +
        "mff=true" +
        "&api=https://api-dev.maximiz.ai";
      window.open(newUrl, "_blank");
    }
  };

  const isFormValid = () => {
    const errors = {
      access_token: validateField(access_token, "access_token"),
      shop_domain: validateField(shop_domain, "shop_domain"),
    };

    return !errors.shop_domain && !errors.access_token;
  };

  const hintCards: HintCardInterface[] = [
    {
      description:
        "Click on your platform (Shopify, WordPress, or BigCommerce) to see a step-by-step guide for installing the pixel. Follow the instructions to complete the setup.",
      title: "Choose CMS",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/allsource/install-pixel",
    },
    {
      description:
        "Enter your Shopify store domain in the provided field. We've prefilled it based on your earlier selection, but you can choose a different one if needed. Note: if you change the domain here, make sure to also update it in the domain selection step.",
      title: "Enter Shop Domain",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify",
    },
    {
      description:
        "Enter your Shopify API access token. This token is required for secure communication between your store and our application. You can get the token in your Shopify admin under “Settings” → “Apps and sales channels” → “Develop app” → “Admin API”.",
      title: "Enter a Shopify Access Token",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify",
    },
    {
      description: `Click the "Install" button, and we’ll automatically inject our script into your Shopify store. No further action is needed — the setup completes automatically.`,
      title: "Install the Script",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify",
    },
    {
      description: `Add our official Allsource Pixel plugin to your WordPress site. This allows for seamless pixel integration without manual setup.`,
      title: "Install the Plugin",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress",
    },
    {
      description: `Enter your Site ID during the checkout process. This connects your site to Allsource for accurate event tracking.`,
      title: "Enter Your Site ID",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress",
    },
    {
      description: `Check if Allsource is receiving data from your site. If everything is set up correctly, events will start appearing automatically.`,
      title: "Verify Connection",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress",
    },
    {
      description: `Enter your unique BigCommerce Store Hash in the designated field. This helps our system identify your store. You can find the Store Hash in your admin panel URL — it's the part between /stores/ and /manage.`,
      title: "Enter Store Hash",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress",
    },
    {
      description: `Once you’ve submitted the required information, click “Install”. We’ll automatically add our script to your BigCommerce store. No further action is needed on your part.`,
      title: "Script Installation",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress",
    },
  ];

  return (
    <Box sx={{ ...style, ...(open ? openStyle : {}), zIndex: 1200 }}>
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            justifyContent: "start",
          }}
        >
          <Image src="/1.svg" alt="1" width={20} height={20} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Nunito Sans', sans-serif",
              fontSize: "16px",
              width: "100%",
              fontWeight: 600,
              color: "rgba(33, 43, 54, 1)",
              lineHeight: "21.82px",
              letterSpacing: "0.5px",
              textShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              alignSelf: "flex-start",
              "@media (max-width: 600px)": {
                fontSize: "14px",
                textAlign: "left",
              },
            }}
          >
            Choose CMS
          </Typography>
          {pixelSetupHints[5].show && showHint && (
            <HintCard
              card={hintCards[0]}
              positionLeft={350}
              positionTop={50}
              isOpenBody={pixelSetupHints[5].showBody}
              toggleClick={() => changePixelSetupHint(5, "showBody", "toggle")}
              closeClick={() => changePixelSetupHint(5, "showBody", "close")}
            />
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "2em 0em 0em 0em",
            justifyContent: "start",
            gap: 3,
            "@media (max-width: 900px)": {
              flexDirection: "column",
            },
            "@media (max-width: 600px)": {
              flexDirection: "column",
            },
          }}
        >
          <Grid item xs={12} md={6} sx={{ width: "100%" }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleButtonClick("Shopify")}
              sx={{
                ...buttonGoogle(selectedCMS === "Shopify"),
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 2,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              >
                <CustomTooltip
                  title={"Quickly integrate using Shopify for seamless setup."}
                  linkText="Learn more"
                  linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-shopify"
                />
              </Box>
              <Image
                src={"/install_cms1.svg"}
                alt="Install on Shopify"
                width={38}
                height={38}
                style={{ marginBottom: 12 }}
              />
              <Typography className="second-sub-title" sx={typographyGoogle}>
                Shopify
              </Typography>
            </Button>
          </Grid>

          {sourcePlatform !== "shopify" && (
            <>
              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  width: "100%",
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleButtonClick("WordPress")}
                  sx={{
                    ...buttonStyles(selectedCMS === "WordPress"),
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 2,
                    "@media (max-width: 600px)": {
                      width: "90%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "start",
                      gap: 1,
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  >
                    <CustomTooltip
                      title={
                        "Quickly integrate using Wordpress for seamless setup."
                      }
                      linkText="Learn more"
                      linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-wordpress"
                    />
                  </Box>
                  <Image
                    src={"/install_cms2.svg"}
                    alt="Install on WordPress"
                    width={38}
                    height={38}
                  />
                  <Typography
                    className="second-sub-title"
                    sx={{ ...typographyStyles, pt: 1.75 }}
                  >
                    WordPress
                  </Typography>
                </Button>
              </Grid>

              <Grid
                item
                xs={12}
                md={6}
                sx={{
                  width: "100%",
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleButtonClick("Bigcommerce")}
                  sx={{
                    ...buttonStyles(selectedCMS === "Bigcommerce"),
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 2,
                    "@media (max-width: 600px)": {
                      width: "90%",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "start",
                      gap: 1,
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  >
                    <CustomTooltip
                      title={
                        "Quickly integrate using Bigcommerce for seamless setup."
                      }
                      linkText="Learn more"
                      linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/how-to-integrate-bigcommerce"
                    />
                  </Box>
                  <Image
                    src={"/bigcommerce-icon.svg"}
                    alt="Install on Bigcommerce"
                    width={38}
                    height={38}
                  />
                  <Typography
                    className="second-sub-title"
                    sx={{ ...typographyStyles, pt: 1.75 }}
                  >
                    Bigcommerce
                  </Typography>
                </Button>
              </Grid>
            </>
          )}
        </Box>
        {selectedCMS && (
          <>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                height: "100%",
              }}
            >
              {selectedCMS === "Shopify" ? (
                <>
                  <Box
                    sx={{
                      flex: 1,
                      paddingBottom: "1em",
                      minHeight: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 0,
                        justifyContent: "start",
                      }}
                    >
                      <Image src="/2.svg" alt="1" width={20} height={20} />
                      {sourcePlatform !== "shopify" && (
                        <Typography
                          className="first-sub-title"
                          sx={{
                            ...maintext,
                            textAlign: "left",
                            padding: "1em 0em 1em 1em",
                            fontWeight: "500",
                          }}
                        >
                          Enter your Shopify shop domain in the designated
                          field. This allows our system to identify your store.
                        </Typography>
                      )}
                    </Box>
                    <Box
                      component="pre"
                      sx={{
                        display: "flex",
                        width: "60%",
                        justifyContent: "center",
                        position: "relative",
                        margin: 0,
                        pl: 4.25,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Shop Domain"
                        variant="outlined"
                        placeholder="Enter your Shop Domain"
                        margin="normal"
                        value={
                          isFocused
                            ? shop_domain
                              ? shop_domain.replace(/^https?:\/\//, "")
                              : ""
                            : shop_domain
                            ? `https://${shop_domain.replace(
                                /^https?:\/\//,
                                ""
                              )}`
                            : "https://"
                        }
                        sx={styles.formField}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        InputProps={{ sx: styles.formInput }}
                        onChange={(e) => setDomain(e.target.value)}
                        InputLabelProps={{ sx: styles.inputLabel }}
                        disabled={sourcePlatform === "shopify"}
                      />
                      {pixelSetupHints[6].show && (
                        <HintCard
                          card={hintCards[1]}
                          positionLeft={420}
                          positionTop={35}
                          isOpenBody={pixelSetupHints[6].showBody}
                          toggleClick={() =>
                            changePixelSetupHint(6, "showBody", "toggle")
                          }
                          closeClick={() =>
                            changePixelSetupHint(6, "showBody", "close")
                          }
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "start",
                      }}
                    >
                      <Image src="/3.svg" alt="3" width={20} height={20} />
                      {sourcePlatform !== "shopify" && (
                        <Typography
                          className="first-sub-title"
                          sx={{
                            ...maintext,
                            textAlign: "left",
                            padding: "1em 0em 1em 1em",
                            fontWeight: "500",
                          }}
                        >
                          Enter your Shopify API access token. This token is
                          necessary for secure communication between your
                          Shopify store and our application.
                        </Typography>
                      )}
                    </Box>
                    <Box
                      component="pre"
                      sx={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "center",
                        position: "relative",
                        margin: 0,
                        pl: 4.25,
                      }}
                    >
                      <TextField
                        InputProps={{ sx: styles.formInput }}
                        fullWidth
                        label="Access Token"
                        variant="outlined"
                        placeholder="Enter your Access Token"
                        margin="normal"
                        sx={styles.formField}
                        value={access_token}
                        onChange={(e) => setAccessToken(e.target.value)}
                        InputLabelProps={{ sx: styles.inputLabel }}
                        disabled={
                          sourcePlatform === "shopify" && accessTokenExists
                        }
                      />
                      {pixelSetupHints[7].show && (
                        <HintCard
                          card={hintCards[2]}
                          positionLeft={660}
                          positionTop={35}
                          isOpenBody={pixelSetupHints[7].showBody}
                          toggleClick={() =>
                            changePixelSetupHint(7, "showBody", "toggle")
                          }
                          closeClick={() =>
                            changePixelSetupHint(7, "showBody", "close")
                          }
                        />
                      )}
                    </Box>
                    {sourcePlatform !== "shopify" && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "start",
                        }}
                      >
                        <Image src="/4.svg" alt="4" width={20} height={20} />
                        <Typography
                          className="first-sub-title"
                          sx={{
                            ...maintext,
                            textAlign: "left",
                            padding: "2em 1em 1em",
                            fontWeight: "500",
                            "@media (max-width: 600px)": { padding: "1em" },
                          }}
                        >
                          Once you have submitted the required information, our
                          system will automatically install the script on your
                          Shopify store. You don’t need to take any further
                          action.
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: "0em 2.25em",
                        overflow: "visible",
                      }}
                    >
                      {sourcePlatform === "shopify" && accessTokenExists ? (
                        <Typography
                          sx={{
                            color: "#333",
                            fontWeight: "500",
                            fontSize: 16,
                            textAlign: "center",
                            padding: "0.5em",
                            backgroundColor: "transparent",
                            borderRadius: 2,
                            marginTop: "auto",
                          }}
                        >
                          Pixel Installed
                        </Typography>
                      ) : (
                        <Box position="relative">
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              ...styles.submitButton,
                              marginTop: "auto",
                              maxWidth: "88px",
                              minHeight: "40px",
                              opacity: isFormValid() ? 1 : 0.6,
                              pointerEvents: isFormValid() ? "auto" : "none",
                              backgroundColor: isFormValid()
                                ? "rgba(56, 152, 252, 1)"
                                : "rgba(56, 152, 252, 0.6)",
                              "&.Mui-disabled": {
                                backgroundColor: "rgba(56, 152, 252, 0.6)",
                                color: "#fff",
                              },
                            }}
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                          >
                            Install
                          </Button>
                          {pixelSetupHints[8].show && (
                            <HintCard
                              card={hintCards[3]}
                              positionLeft={110}
                              positionTop={15}
                              isOpenBody={pixelSetupHints[8].showBody}
                              toggleClick={() =>
                                changePixelSetupHint(8, "showBody", "toggle")
                              }
                              closeClick={() =>
                                changePixelSetupHint(8, "showBody", "close")
                              }
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </>
              ) : selectedCMS === "WordPress" ? (
                <>
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      overflow: "visible",
                      paddingBottom: "2em",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "1em 0em 0em 0em",
                        justifyContent: "start",
                      }}
                    >
                      <Image src="/2.svg" alt="2" width={20} height={20} />
                      <Typography
                        className="first-sub-title"
                        sx={{
                          ...maintext,
                          textAlign: "center",
                          padding: "1em 0em 1em 1em",
                          fontWeight: "500",
                          "@media (max-width: 600px)": { textAlign: "left" },
                        }}
                      >
                        Add our offical Allsource pixel plugin to your Wordpress
                        site.
                      </Typography>
                    </Box>
                    <Box position="relative">
                      <Button
                        component={Link}
                        href="https://wordpress.org/plugins/allsource"
                        target="_blank"
                        variant="outlined"
                        sx={{
                          ml: 5,
                          backgroundColor: "rgba(56, 152, 252, 1)",
                          color: "rgba(255, 255, 255, 1)",
                          textTransform: "none",
                          padding: "1em 2em",
                          border: "1px solid rgba(56, 152, 252, 1)",
                          "&:hover": {
                            backgroundColor: "rgba(56, 152, 252, 1)",
                          },
                        }}
                      >
                        <Typography
                          className="second-sub-title"
                          sx={{
                            fontSize: "14px !important",
                            color: "#fff !important",
                            textAlign: "left",
                            textWrap: "wrap",
                          }}
                        >
                          Get plugin
                        </Typography>
                      </Button>
                      {pixelSetupHints[9].show && (
                        <HintCard
                          card={hintCards[4]}
                          positionLeft={190}
                          positionTop={20}
                          isOpenBody={pixelSetupHints[9].showBody}
                          toggleClick={() =>
                            changePixelSetupHint(9, "showBody", "toggle")
                          }
                          closeClick={() =>
                            changePixelSetupHint(9, "showBody", "close")
                          }
                        />
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "1em 0em 0em 0em",
                        justifyContent: "start",
                        maxWidth: "100%",
                        "@media (max-width: 600px)": { maxWidth: "95%" },
                      }}
                    >
                      <Box sx={{ paddingBottom: 11.5 }}>
                        <Image src="/3.svg" alt="3" width={20} height={20} />
                      </Box>
                      <Typography
                        className="first-sub-title"
                        sx={{
                          ...maintext,
                          textAlign: "left",
                          padding: "1em",
                          fontWeight: "500",
                          maxWidth: "95%",
                          overflowWrap: "break-word",
                          wordWrap: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        Enter your site ID:{" "}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            position: "relative",
                            overflow: "visible",
                            gap: 1,
                          }}
                        >
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor: "#ffffff",
                              border: "1px solid rgba(228, 228, 228, 1)",
                              borderRadius: "10px",
                              maxHeight: "10em",
                              overflowY: "auto",
                              position: "relative",
                              padding: "0.75em",
                              maxWidth: "100%",
                              "@media (max-width: 600px)": {
                                maxHeight: "14em",
                              },
                            }}
                          >
                            <code
                              style={{
                                color: "#000000",
                                fontSize: "12px",
                                fontWeight: 600,
                                fontFamily: "Nunito Sans",
                                textWrap: "nowrap",
                              }}
                            >
                              {pixel_client_id}
                            </code>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              padding: "0px",
                              position: "relative",
                            }}
                          >
                            <IconButton onClick={handleCopyToClipboard}>
                              <ContentCopyIcon />
                            </IconButton>
                          </Box>
                          {pixelSetupHints[10].show && (
                            <HintCard
                              card={hintCards[5]}
                              positionLeft={540}
                              positionTop={35}
                              isOpenBody={pixelSetupHints[10].showBody}
                              toggleClick={() =>
                                changePixelSetupHint(10, "showBody", "toggle")
                              }
                              closeClick={() =>
                                changePixelSetupHint(10, "showBody", "close")
                              }
                            />
                          )}
                        </Box>
                        during the checkout process
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "1em 0em 0em 0em",
                        justifyContent: "start",
                      }}
                    >
                      <Image src="/4.svg" alt="4" width={20} height={20} />
                      <Typography
                        className="first-sub-title"
                        sx={{
                          ...maintext,
                          textAlign: "left",
                          padding: "1em",
                          fontWeight: "500",
                        }}
                      >
                        Verify if Allsource is receiving data from your site
                      </Typography>
                    </Box>
                    <Box position="relative">
                      <Button
                        onClick={handleInstallButtonClick}
                        variant="outlined"
                        sx={{
                          ml: 5,
                          backgroundColor: "rgba(255, 255, 255, 1)",
                          textTransform: "none",
                          padding: "1em 2em",
                          border: "1px solid rgba(56, 152, 252, 1)",
                        }}
                      >
                        <Typography
                          className="second-sub-title"
                          sx={{
                            fontSize: "14px !important",
                            color: "rgba(56, 152, 252, 1) !important",
                            lineHeight: "22.4px",
                            textAlign: "left",
                            textWrap: "wrap",
                          }}
                        >
                          View installation
                        </Typography>
                      </Button>
                      {pixelSetupHints[11].show && (
                        <HintCard
                          card={hintCards[6]}
                          positionLeft={235}
                          positionTop={20}
                          isOpenBody={pixelSetupHints[11].showBody}
                          toggleClick={() =>
                            changePixelSetupHint(11, "showBody", "toggle")
                          }
                          closeClick={() =>
                            changePixelSetupHint(11, "showBody", "close")
                          }
                        />
                      )}
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      paddingBottom: "1em",
                      overflow: "visible",
                      height: "100%",
                    }}
                  >
                    {(sourcePlatform !== "big_commerce" ||
                      !accessTokenExists) && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 0,
                          justifyContent: "start",
                        }}
                      >
                        <Image src="/2.svg" alt="2" width={20} height={20} />
                        <Typography
                          className="first-sub-title"
                          sx={{
                            ...maintext,
                            textAlign: "left",
                            padding: "1em 0em 1em 1em",
                            fontWeight: "500",
                          }}
                        >
                          Enter your Bigcommerce store hash in the designated
                          field. This allows our system to identify your store.
                        </Typography>
                      </Box>
                    )}

                    <Box
                      component="pre"
                      position="relative"
                      sx={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "center",
                        overflow: "visible",
                        margin: 0,
                        pl: 4.25,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Store Hash"
                        variant="outlined"
                        placeholder="Enter your Store Hash"
                        margin="normal"
                        value={storeHash}
                        sx={styles.formField}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={
                          sourcePlatform === "big_commerce" && accessTokenExists
                        }
                        InputProps={{ sx: styles.formInput }}
                        onChange={handleStoreHashChange}
                        InputLabelProps={{ sx: styles.inputLabel }}
                      />
                      {pixelSetupHints[12].show && (
                        <HintCard
                          card={hintCards[7]}
                          positionLeft={660}
                          positionTop={35}
                          isOpenBody={pixelSetupHints[12].showBody}
                          toggleClick={() =>
                            changePixelSetupHint(12, "showBody", "toggle")
                          }
                          closeClick={() =>
                            changePixelSetupHint(12, "showBody", "close")
                          }
                        />
                      )}
                    </Box>
                    {(sourcePlatform !== "big_commerce" ||
                      !accessTokenExists) && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "start",
                        }}
                      >
                        <Image src="/3.svg" alt="3" width={20} height={20} />
                        <Typography
                          className="first-sub-title"
                          sx={{
                            ...maintext,
                            textAlign: "left",
                            padding: "2em 1em 1em",
                            fontWeight: "500",
                            "@media (max-width: 600px)": { padding: "1em" },
                          }}
                        >
                          Once you have submitted the required information, our
                          system will automatically install the script on your
                          Bigcommerce store. You don’t need to take any further
                          action.
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        maxHeight: "100%",
                        padding: "0em 1em",
                        pl: 4.25,
                      }}
                    >
                      {sourcePlatform === "big_commerce" &&
                      accessTokenExists ? (
                        <Typography
                          sx={{
                            color: "#333",
                            fontWeight: "500",
                            fontSize: 16,
                            textAlign: "center",
                            padding: "0.5em",
                            backgroundColor: "transparent",
                            borderRadius: 2,
                            marginTop: "auto",
                          }}
                        >
                          Pixel Installed
                        </Typography>
                      ) : (
                        <Box position="relative">
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              ...styles.submitButton,
                              marginTop: "auto",
                              maxWidth: "88px",
                              minHeight: "40px",
                              pointerEvents: !!storeHash ? "auto" : "none",
                              backgroundColor: "rgba(56, 152, 252, 1)",
                              "&.Mui-disabled": {
                                backgroundColor: "rgba(56, 152, 252, 0.3)",
                                color: "#fff",
                              },
                            }}
                            onClick={handleSubmitBigcommerce}
                            disabled={!storeHash}
                          >
                            Install
                          </Button>
                          {pixelSetupHints[13]?.show && (
                            <HintCard
                              card={hintCards[8]}
                              positionLeft={110}
                              positionTop={15}
                              isOpenBody={pixelSetupHints[13].showBody}
                              toggleClick={() =>
                                changePixelSetupHint(13, "showBody", "toggle")
                              }
                              closeClick={() =>
                                changePixelSetupHint(13, "showBody", "close")
                              }
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Popup;
