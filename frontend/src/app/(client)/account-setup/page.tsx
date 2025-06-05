"use client";
import React, { Suspense, useState, useEffect } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Typography,
  LinearProgress,
} from "@mui/material";
import Image from "next/image";
import { styles } from "./accountStyles";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import PersonIcon from "@mui/icons-material/Person";
import { fetchUserData } from "@/services/meService";

const AccountSetup = () => {
  const [websiteLink, setWebsiteLink] = useState("");
  const [domainLink, setDomainLink] = useState("");
  const [stripeUrl, setStripeUrl] = useState("");
  const [domainName, setDomainName] = useState("");
  const [editingName, setEditingName] = useState(true);
  const { setBackButton, backButton } = useUser();
  const [errors, setErrors] = useState({
    websiteLink: "",
  });
  const router = useRouter();
  const [visibleButton, setVisibleButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const { full_name: userFullName, email: userEmail, partner } = useUser();

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true);
        const response = await axiosInterceptorInstance.get("/company-info");
        const status = response.data.status;

        switch (status) {
          case "SUCCESS":
            const domain_url = response.data.domain_url;
            if (domain_url) {
              setDomainLink(response.data.domain_url);
              setWebsiteLink(response.data.domain_url);
            }
            break;
          case "NEED_EMAIL_VERIFIED":
            router.push("/email-verificate");
            break;
          case "NEED_CHOOSE_PLAN":
            router.push("/settings?section=subscription");
            break;
          case "DASHBOARD_ALLOWED":
            router.push("/audience-dashboard");
            break;
          default:
            console.error("Unknown status:", status);
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyInfo();
  }, []);

  const getUserDataFromStorage = () => {
    const meItem =
      typeof window !== "undefined" ? sessionStorage.getItem("me") : null;
    if (meItem) {
      const meData = JSON.parse(meItem);
      setFullName(userFullName || meData.full_name);
      setEmail(userEmail || meData.email);
    }
  };

  useEffect(() => {
    getUserDataFromStorage();

    const intervalId = setInterval(() => {
      getUserDataFromStorage();
    }, 500);

    return () => clearInterval(intervalId);
  }, [userFullName, userEmail]);

  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/signin");
  };

  const validateField = (
    value: string,
    type: "email" | "website" | "organizationName"
  ): string => {
    switch (type) {
      case "email":
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRe.test(value) ? "" : "Invalid email address";
      case "website":
        const sanitizedValue = value?.replace(/^www\./, "");
        const websiteRe =
          /^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,20})([/\w .-]*)*\/?$/i;
        return websiteRe.test(sanitizedValue) ? "" : "Invalid website URL";
      case "organizationName":
        const orgName = value.trim();

        const hasLetter = /[a-zA-Zа-яА-Я0-9]/.test(orgName);

        if (!orgName) {
          return "Organization name is required";
        } else if (!hasLetter) {
          return "Organization name must contain at least one letter";
        }

        return "";
      default:
        return "";
    }
  };

  const endSetup = () => {
    if (stripeUrl) {
      router.push(stripeUrl);
    } else {
      router.push("/dashboard");
      localStorage.setItem("welcome_popup", "true");
    }
  };

  const handleSubmit = async () => {
    const newErrors = {
      websiteLink: validateField(websiteLink, "website"),
    };
    setErrors(newErrors);

    if (newErrors.websiteLink) {
      return;
    }

    try {
      const response = await axiosInterceptorInstance.post("/company-info", {
        company_website: websiteLink,
      });

      switch (response.data.status) {
        case "SUCCESS":
          const domain = websiteLink.replace(/^https?:\/\//, "");
          sessionStorage.setItem("current_domain", domain);
          setDomainName(domain);
          setEditingName(false);
          await fetchUserData();
          if (response.data.stripe_payment_url) {
            setStripeUrl(`${response.data.stripe_payment_url}`);
          }
          break;
        case "NEED_EMAIL_VERIFIED":
          router.push("/email-verificate");
          break;
        case "NEED_CHOOSE_PLAN":
          router.push("/settings?section=subscription");
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const handleWebsiteLink = (event: { target: { value: string } }) => {
    let input = event.target.value.trim();

    if (!input.startsWith("http://") && !input.startsWith("https://")) {
      input = `https://${input}`;
    }

    try {
      const url = new URL(input);

      const sanitizedInput = url.origin;

      setWebsiteLink(sanitizedInput);

      const websiteError = validateField(sanitizedInput, "website");
      setErrors((prevErrors) => ({
        ...prevErrors,
        websiteLink: websiteError,
      }));
    } catch (error) {
      setWebsiteLink(input);
      setErrors((prevErrors) => ({
        ...prevErrors,
        websiteLink: "Invalid website URL",
      }));
    }
  };

  const isFormValidFirst = () => {
    const errors = {
      websiteLink: validateField(websiteLink, "website"),
    };
    return errors.websiteLink === "";
  };

  const BorderLinearProgress = styled(LinearProgress)(() => ({
    height: 4,
    borderRadius: 0,
    backgroundColor: "#c6dafc",
    "& .MuiLinearProgress-bar": {
      borderRadius: 5,
      backgroundColor: "#4285f4",
    },
  }));

  return (
    <Box
      sx={{
        ...styles.pageContainer,
      }}
    >
      {loading && (
        <Box
          sx={{
            width: "100%",
            position: "fixed",
            top: "4.4rem",
            zIndex: 1200,
          }}
        >
          <BorderLinearProgress variant="indeterminate" />
        </Box>
      )}

      <Box sx={{ ...styles.headers, overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            "@media (max-width: 600px)": {
              width: "100%",
            },
          }}
        >
          <Box sx={styles.logo}>
            <Image
              src="/logo.svg"
              priority
              alt="logo"
              height={30}
              width={130}
            />
          </Box>
          <Button
            aria-controls={open ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleProfileMenuClick}
            sx={{
              display: "none",
              minWidth: "32px",
              padding: "6px",
              color: "rgba(128, 128, 128, 1)",
              border: "1px solid rgba(184, 184, 184, 1)",
              borderRadius: "3.27px",
              "&:hover": {
                border: "1px solid rgba(56, 152, 252, 1)",
                "& .MuiSvgIcon-root": {
                  color: "rgba(56, 152, 252, 1)",
                },
              },
              "@media (max-width: 600px)": {
                display: "flex",
              },
            }}
          >
            <PersonIcon sx={{ fontSize: "22px" }} />
          </Button>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleProfileMenuClose}
            MenuListProps={{
              "aria-labelledby": "profile-menu-button",
            }}
            sx={{
              mt: 0.5,
              ml: -1,
            }}
          >
            <Box
              sx={{
                paddingTop: 1,
                paddingLeft: 2,
                paddingRight: 2,
                paddingBottom: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Nunito Sans",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: "19.6px",
                  color: "rgba(0, 0, 0, 0.89)",
                  mb: 0.25,
                }}
              >
                {fullName}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  fontFamily: "Nunito Sans",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: "19.6px",
                  color: "rgba(0, 0, 0, 0.89)",
                }}
              >
                {email}
              </Typography>
            </Box>
            <MenuItem
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: "19.6px",
              }}
              onClick={handleSignOut}
            >
              Sign Out
            </MenuItem>
          </Menu>
        </Box>

        <Button
          aria-controls={open ? "profile-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleProfileMenuClick}
          sx={{
            minWidth: "32px",
            padding: "6px",
            // mr: '1.5rem',
            // mb: '1.125rem',
            color: "rgba(128, 128, 128, 1)",
            border: "1px solid rgba(184, 184, 184, 1)",
            borderRadius: "3.27px",
            "&:hover": {
              border: "1px solid rgba(56, 152, 252, 1)",
              "& .MuiSvgIcon-root": {
                color: "rgba(56, 152, 252, 1)",
              },
            },
            "@media (max-width: 600px)": {
              display: "none",
            },
          }}
        >
          <PersonIcon sx={{ fontSize: "22px" }} />
        </Button>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          MenuListProps={{
            "aria-labelledby": "profile-menu-button",
          }}
          sx={{
            mt: 0.5,
            ml: -1,
          }}
        >
          <Box
            sx={{
              paddingTop: 1,
              paddingLeft: 2,
              paddingRight: 2,
              paddingBottom: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: "19.6px",
                color: "rgba(0, 0, 0, 0.89)",
                mb: 0.25,
              }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: "19.6px",
                color: "rgba(0, 0, 0, 0.89)",
              }}
            >
              {email}
            </Typography>
          </Box>
          <MenuItem
            sx={{
              fontFamily: "Nunito Sans",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "19.6px",
            }}
            onClick={handleSignOut}
          >
            Sign Out
          </MenuItem>
        </Menu>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box sx={{ ...styles.formContainer, overflow: "hidden", marginTop: 0 }}>
          <Box
            sx={{
              ...styles.form,
              overflow: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWwidth: "none",
            }}
          >
            <Box
              sx={{
                "@media (max-width: 600px)": {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  pb: 1,
                },
              }}
            >
              <Typography
                variant="h5"
                component="h1"
                className="heading-text"
                sx={styles.title}
              >
                Transform your marketing with AI-powered data
              </Typography>
              <Typography
                variant="body1"
                component="h2"
                className="first-sub-title"
                sx={styles.subtitle}
              >
                Free trial, fast setup
              </Typography>
            </Box>
            {
              <>
                <Typography
                  variant="body1"
                  component="h3"
                  className="first-sub-title"
                  sx={styles.text}
                >
                  Share your primary company website
                </Typography>

                <TextField
                  fullWidth
                  label="Enter website link"
                  variant="outlined"
                  placeholder={isFocused ? "example.com" : ""}
                  sx={styles.formField}
                  InputLabelProps={{
                    className: "form-input-label",
                    focused: false,
                  }}
                  value={
                    websiteLink
                      ? websiteLink.replace(/^https?:\/\//, "")
                      : isFocused
                        ? websiteLink.replace(/^https?:\/\//, "")
                        : `https://${websiteLink.replace(/^https?:\/\//, "")}`
                  }
                  onChange={domainLink ? undefined : handleWebsiteLink}
                  onFocus={domainLink ? undefined : handleFocus}
                  onBlur={domainLink ? undefined : handleBlur}
                  disabled={!!domainLink}
                  error={!!errors.websiteLink}
                  helperText={errors.websiteLink}
                  InputProps={{
                    className: "form-input",
                    startAdornment: isFocused && !websiteLink && (
                      <InputAdornment position="start">https://</InputAdornment>
                    ),
                  }}
                />

                <Typography
                  variant="body1"
                  component="h2"
                  className="first-sub-title"
                  sx={styles.subtitle}
                >
                  You can add more domains later
                </Typography>

                <Button
                  className="hyperlink-blue"
                  fullWidth
                  variant="contained"
                  sx={{
                    ...styles.submitButton,
                    opacity: isFormValidFirst() ? 1 : 0.2,
                    pointerEvents: isFormValidFirst() ? "auto" : "none",
                    "&.Mui-disabled": {
                      backgroundColor: "rgba(56, 152, 252, 1)",
                    },
                  }}
                  onClick={() => {
                    handleSubmit();
                    endSetup();
                  }}
                  disabled={!isFormValidFirst()}
                >
                  Get Started
                </Button>
              </>
            }
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const AccountSetupPage = () => {
  return (
    <Suspense fallback={<CustomizedProgressBar />}>
      <AccountSetup />
    </Suspense>
  );
};

export default AccountSetupPage;