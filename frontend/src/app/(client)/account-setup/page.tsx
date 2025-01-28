"use client";
import React, { Suspense, useState, useEffect } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { styles } from "./accountStyles";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import PersonIcon from '@mui/icons-material/Person';
import { fetchUserData } from '@/services/meService';

const AccountSetup = () => {
  const [organizationName, setOrganizationName] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [domainLink, setDomainLink] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState("");
  const [typeBusiness, setTypeBusiness] = useState("");
  const [selectedVisits, setSelectedVisits] = useState("");
  const [selectedRoles, setSelectedRoles] = useState("");
  const { setBackButton, backButton } = useUser()
  const [errors, setErrors] = useState({
    websiteLink: "",
    organizationName: "",
    selectedEmployees: "",
    selectedVisits: "",
    typeBusiness: ""

  });
  const router = useRouter();
  const [visibleButton, setVisibleButton] = useState(false)
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const { full_name: userFullName, email: userEmail, partner } = useUser();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const getUserDataFromStorage = () => {
    const meItem = typeof window !== 'undefined' ? sessionStorage.getItem('me') : null;
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

  const [activeTab, setActiveTab] = useState(2);

  useEffect(() => {
    const parent_token = localStorage.getItem("parent_token");
    setVisibleButton(!!parent_token);
  }, []);

  useEffect(() => {
    console.log(activeTab)
  }, [activeTab])

  const handleReturnToMain = async () => {
    const parent_token = localStorage.getItem('parent_token');
    const parent_domain = sessionStorage.getItem('parent_domain')
    if (parent_token) {
      await new Promise<void>((resolve) => {
        sessionStorage.clear
        localStorage.removeItem('parent_token');
        localStorage.setItem('token', parent_token);
        sessionStorage.setItem('current_domain', parent_domain || '')
        fetchUserData()
        setBackButton(false)
        setTimeout(() => {
          resolve();
        }, 0);
      });


    }

    router.push("/partners");
  };

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await axiosInterceptorInstance.get("/company-info");

        const status = response.data.status;
        const domain_url = response.data.domain_url
        if (domain_url) {
          setWebsiteLink(domain_url)
          setDomainLink(domain_url)
        }

        switch (status) {
          case "SUCCESS":
            break;
          case "NEED_EMAIL_VERIFIED":
            router.push("/email-verificate");
            break;
          case "NEED_CHOOSE_PLAN":
            router.push("/settings?section=subscription");
            break;
          case "DASHBOARD_ALLOWED":
            router.push("/dashboard");
            break;
          default:
            console.error("Unknown status:", status);
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
      }
    };
    fetchCompanyInfo();
  }, [router]);

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

  const getButtonStyles = (isSelected: boolean): any => {
    return isSelected
      ? {
        ...styles.employeeButton,
        backgroundColor: "#fde2e3",
        color: "#202124 !important",
        pointerEvents: 'none',
        border: '1px solid #f45745'
      }
      : { ...styles.employeeButton, color: "#707071" };
  };

  const getButtonVisitsStyles = (isSelected: boolean): any => {
    return isSelected
      ? {
        ...styles.visitButton,
        backgroundColor: "#fde2e3",
        color: "#202124 !important",
        pointerEvents: 'none',
        border: '1px solid #f45745'
      }
      : { ...styles.visitButton, color: "#707071" };
  };

  const getButtonRolesStyles = (isSelected: boolean): any => {
    return isSelected
      ? {
        ...styles.roleButton,
        backgroundColor: "#fde2e3",
        color: "#202124 !important",
        pointerEvents: 'none',
        border: '1px solid #f45745'
      }
      : { ...styles.roleButton, color: "#707071" };
  };

  const handleEmployeeRangeChange = (label: string) => {
    setSelectedEmployees(label);
    setErrors({ ...errors, selectedEmployees: "" });
  };

  const handleTypeBusinessChange = (label: string) => {
    setTypeBusiness(label);
    setErrors({ ...errors, typeBusiness: "" });
  };

  const handleVisitsRangeChange = (label: string) => {
    setSelectedVisits(label);
    setErrors({ ...errors, selectedVisits: "" });
  };
  const handleRolesChange = (label: string) => {
    setSelectedRoles(label);
    setErrors({ ...errors, selectedVisits: "" });
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
        const sanitizedValue = value.replace(/^www\./, '');
        const websiteRe = /^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,20})([/\w .-]*)*\/?$/i;
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

  const handleSkip = () => {
    handleNextClick()
  }


  const handleSubmit = async () => {
    const newErrors = {
      websiteLink: validateField(websiteLink, "website"),
      organizationName: validateField(organizationName, "organizationName"),
      selectedEmployees: selectedEmployees ? "" : "Please select number of employees",
      selectedVisits: selectedVisits ? "" : "Please select number of visits",
      selectedRoles: selectedRoles ? "" : "Please select your`s role",
      typeBusiness: typeBusiness ? "" : "Please select your`s type business",
    };
    setErrors(newErrors);

    if (
      newErrors.websiteLink ||
      newErrors.organizationName ||
      newErrors.selectedEmployees ||
      newErrors.selectedRoles ||
      newErrors.selectedVisits
    ) {
      return;
    }

    try {
      const response = await axiosInterceptorInstance.post("/company-info", {
        organization_name: organizationName.trim(),
        company_website: websiteLink,
        company_role: selectedRoles,
        monthly_visits: selectedVisits,
        employees_workers: selectedEmployees,
        type_business: typeBusiness.toLowerCase()
      });

      switch (response.data.status) {
        case "SUCCESS":
          sessionStorage.setItem('current_domain', websiteLink.replace(/^https?:\/\//, ""))
          await fetchUserData();
          if (response.data.stripe_payment_url) {
            router.push(`${response.data.stripe_payment_url}`)
          } else {
            router.push(partner ? '/partners' : '/dashboard');
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
  



  const isFormValid = () => {
    const errors = {
      websiteLink: validateField(websiteLink, "website"),
      organizationName: validateField(organizationName, "organizationName"),
      selectedVisits: selectedVisits ? "" : "Please select number of visits",
    };

    return (
      !errors.websiteLink && !errors.organizationName && !errors.selectedVisits
    );
  };

  const isFormBusinessValid = () => {
    const errors = {
      selectedEmployees: selectedEmployees ? "" : "Please select a number of employees",
      selectedRoles: selectedRoles ? "" : "Please select your role",
    };

    return !errors.selectedRoles && !errors.selectedEmployees;
  };

  const ranges = [
    { min: 1, max: 10, label: "1-10" },
    { min: 11, max: 50, label: "11-50" },
    { min: 51, max: 100, label: "51-100" },
    { min: 101, max: 250, label: "101-250" },
    { min: 251, max: 500, label: "251-500" },
    { min: 501, max: Infinity, label: ">1k" },
  ];
  const range_typeBusiness = [
    { label: "B2B" },
    { label: "D2C" }
  ];
  const method_installingPixel = [
    { label: "Manually", src: "install_manually.svg" },
    { label: "Google Tag Manager", src: "install_gtm.svg" },
    { label: "Shopify", src: "install_cms1.svg" },
    { label: "WordPress", src: "install_cms2.svg" },
    { label: "Bigcommerce", src: "bigcommerce-icon.svg" },
  ];
  const roles = [
    { label: "Digital Marketer" },
    { label: "CEO" },
    { label: "Data Analyst" },
    { label: "Product Manager" },
    { label: "Engineer" },
    { label: "Consultant" },
    { label: "UX Researcher" },
    { label: "Product Designer" },
    { label: "Content Designer" },
    { label: "Other" },
  ];
  const ranges_visits = [
    { min: 1, max: 10, label: "0-10K" },
    { min: 11, max: 50, label: "10-50K" },
    { min: 51, max: 100, label: "50-100K" },
    { min: 101, max: 500, label: "100-250K" },
    { min: 501, max: Infinity, label: ">250K" },
  ];

  const handleBackClick = () => {
    setActiveTab((prev) => prev - 1);
  };

  const handleNextClick = () => {
    setActiveTab((prev) => prev + 1);
  };

  return (
    <Box sx={styles.pageContainer}>
      <Box sx={styles.headers}>
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
            <Image src="/logo.svg" alt="logo" height={30} width={50} />
          </Box>
          {(visibleButton || backButton) && (
            <Button
              onClick={handleReturnToMain}
              sx={{
                fontFamily: "Nunito Sans",
                fontSize: "14px",
                fontWeight: 600,
                mb: 2,
                ml: 12,
                lineHeight: "19.1px",
                textAlign: "left",
                textDecoration: "underline",
                textTransform: 'none',
                color: "rgba(80, 82, 178, 1)",
                position: 'absolute',

              }}
            >
              Return to main
            </Button>
          )}
          <Button
            aria-controls={open ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleProfileMenuClick}
            sx={{
              display: 'none',
              minWidth: '32px',
              padding: '6px',
              mr: 3,
              mb: '1.125rem',
              color: 'rgba(128, 128, 128, 1)',
              border: '1px solid rgba(184, 184, 184, 1)',
              borderRadius: '3.27px',
              '&:hover': {
                border: '1px solid rgba(80, 82, 178, 1)',
                '& .MuiSvgIcon-root': {
                  color: 'rgba(80, 82, 178, 1)'
                }
              },
              "@media (max-width: 600px)": {
                display: 'flex'
              },
            }}
          >
            <PersonIcon sx={{ fontSize: '22px' }} />
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
              ml: -1
            }}
          >
            <Box sx={{ paddingTop: 1, paddingLeft: 2, paddingRight: 2, paddingBottom: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Nunito Sans',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '19.6px',
                  color: 'rgba(0, 0, 0, 0.89)',
                  mb: 0.25
                }}
              >
                {fullName}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  fontFamily: 'Nunito Sans',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: '19.6px',
                  color: 'rgba(0, 0, 0, 0.89)',
                }}
              >
                {email}
              </Typography>
            </Box>
            <MenuItem
              sx={{
                fontFamily: 'Nunito Sans',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '19.6px',
              }}
              onClick={handleSignOut}
            >
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
        <Box sx={{ ...styles.nav, position: "relative" }}>
          <Button
            className="hyperlink-red"
            variant="outlined"
            onClick={handleBackClick}
            sx={{
              position: "absolute",
              left: -120,
              top: 7,
              marginRight: 2,
              visibility: activeTab === 0 ? 'hidden' : 'visible',
              color: "#202124 !important",
              border: "none",
              textTransform: "none",
              "&:hover": {
                border: "1px",
                backgroundColor: "transparent",
                "& .MuiSvgIcon-root": {
                  transform: "translateX(-7px)",
                },
              },
              "@media (max-width: 600px)": {
                display: "flex",
                mr: 0,
                position: "inherit",
                left: 0,
                top: 0,
              },
              "@media (max-width: 400px)": {
                display: "flex",
                mr: 0,
                position: "inherit",
                left: 0,
                top: 0,
                padding: activeTab === 0 ? 0 : 1.25
              },
            }}
          >
            <ArrowBackIcon
              sx={{
                color: "rgba(50, 50, 50, 1)",
                transition: "transform 0.4s ease",
              }}
            />
            Back
          </Button>
          <Tabs
            value={activeTab}
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "rgba(244, 87, 69, 1)",
              },
            }}
          >
            <Tab
              className="tab-heading"
              label="Create Account"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                marginRight: 1.5,
                marginLeft: (visibleButton || backButton) ? 0: 2.5,
                color:
                  activeTab === 0
                    ? "#F45745"
                    : "#707071",
                "&.Mui-selected": {
                  color: "#F45745",
                },
                "@media (max-width: 400px)": {
                  marginLeft: 0
                },
              }}
            />
            <Tab
              className="tab-heading"
              label="Business Info"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                marginRight: 1.5,
                color:
                  activeTab === 1
                    ? "#F45745"
                    : "#707071",
                "&.Mui-selected": {
                  color: "#F45745",
                },
              }}
            />
            <Tab
              className="tab-heading"
              label="Pixel Installation"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                marginRight: 1.5,
                color:
                  activeTab === 2
                    ? "#F45745"
                    : "#707071",
                "&.Mui-selected": {
                  color: "#F45745",
                },
              }}
            />
            {/* <Tab
              className="tab-heading"
              label="Integrations"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                color:
                  activeTab === 1
                    ? "#F45745"
                    : "#707071",
                "&.Mui-selected": {
                  color: "#F45745",
                },
              }}
            /> */}
          </Tabs>
        </Box>

        <Button
          aria-controls={open ? "profile-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleProfileMenuClick}
          sx={{
            minWidth: '32px',
            padding: '6px',
            mr: '1.5rem',
            mb: '1.125rem',
            color: 'rgba(128, 128, 128, 1)',
            border: '1px solid rgba(184, 184, 184, 1)',
            borderRadius: '3.27px',
            '&:hover': {
              border: '1px solid rgba(80, 82, 178, 1)',
              '& .MuiSvgIcon-root': {
                color: 'rgba(80, 82, 178, 1)'
              }
            },
            "@media (max-width: 600px)": {
              display: 'none'
            },
          }}
        >
          <PersonIcon sx={{ fontSize: '22px' }} />
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
            ml: -1
          }}
        >
          <Box sx={{ paddingTop: 1, paddingLeft: 2, paddingRight: 2, paddingBottom: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Nunito Sans',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '19.6px',
                color: 'rgba(0, 0, 0, 0.89)',
                mb: 0.25
              }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                fontFamily: 'Nunito Sans',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '19.6px',
                color: 'rgba(0, 0, 0, 0.89)',
              }}
            >
              {email}
            </Typography>
          </Box>
          <MenuItem
            sx={{
              fontFamily: 'Nunito Sans',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '19.6px',
            }}
            onClick={handleSignOut}
          >
            Sign Out
          </MenuItem>
        </Menu>
      </Box>
      <Box sx={styles.formContainer}>
        <Box sx={styles.form}>
          <Box
            sx={{
              "@media (max-width: 600px)": {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pb: 1
              },
            }}
          >
            <Typography variant="h5" component="h1" className="heading-text" sx={styles.title}>
              Welcome {fullName},
            </Typography>
            <Typography variant="body1" component="h2" className="first-sub-title" sx={styles.subtitle}>
              Let&apos;s set up your account
            </Typography>
          </Box>
          {activeTab === 0 && (
            <>
              <Typography variant="body1" component="h3" className="first-sub-title" sx={styles.text}>
                What is your organization&apos;s name
              </Typography>
              <TextField
                InputProps={{ className: "form-input" }}
                fullWidth
                label="Organization name"
                variant="outlined"
                margin="normal"
                sx={styles.formField}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                error={!!errors.organizationName}
                helperText={errors.organizationName}
                InputLabelProps={{
                  className: "form-input-label",
                  focused: false
                }}
              />
              <Typography variant="body1" component="h3" className="first-sub-title" sx={styles.text}>
                Share your company website
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

              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                How many monthly visits to your website?
              </Typography>
              {errors.selectedEmployees && (
                <Typography variant="body2" color="error">
                  {errors.selectedEmployees}
                </Typography>
              )}
              <Box className="form-input" sx={styles.visitsButtons}>
                {ranges_visits.map((range, index) => (
                  <Button
                    className="form-input"
                    key={index}
                    variant="outlined"
                    onClick={() => handleVisitsRangeChange(range.label)}
                    onTouchStart={() => handleVisitsRangeChange(range.label)}
                    onMouseDown={() => handleVisitsRangeChange(range.label)}
                    sx={getButtonVisitsStyles(selectedVisits === range.label)}
                  >
                    {range.label}
                  </Button>
                ))}
              </Box>
              <Button
                className='hyperlink-red'
                fullWidth
                variant="contained"
                sx={{
                  ...styles.submitButton,
                  opacity: isFormValid() ? 1 : 0.6,
                  pointerEvents: isFormValid() ? "auto" : "none",
                  backgroundColor: isFormValid()
                    ? "rgba(244, 87, 69, 1)"
                    : "rgba(244, 87, 69, 0.4)",
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(244, 87, 69, 0.6)",
                    color: "#fff",
                  },
                }}
                onClick={handleNextClick}
                disabled={!isFormValid()}
              >
                Next
              </Button>
            </>
          )}
          {activeTab === 1 && (
            <>
              {/* Business info */}
              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                How many employees work at your organization
              </Typography>
              {errors.selectedEmployees && (
                <Typography variant="body2" color="error">
                  {errors.selectedEmployees}
                </Typography>
              )}
              <Box sx={styles.employeeButtons}>
                {ranges.map((range, index) => (
                  <Button
                    className="form-input"
                    key={index}
                    variant="outlined"
                    onClick={() => handleEmployeeRangeChange(range.label)}
                    onTouchStart={() => handleEmployeeRangeChange(range.label)}
                    onMouseDown={() => handleEmployeeRangeChange(range.label)}
                    sx={getButtonStyles(selectedEmployees === range.label)}
                  >
                    <Typography className="form-input" sx={{ padding: '3px' }}> {range.label}</Typography>
                  </Button>
                ))}
              </Box>
              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                Select the type of business you have
              </Typography>
              {errors.typeBusiness && (
                <Typography variant="body2" color="error">
                  {errors.typeBusiness}
                </Typography>
              )}
              <Box sx={styles.employeeButtons}>
                {range_typeBusiness.map((range, index) => (
                  <Button
                    className="form-input"
                    key={index}
                    variant="outlined"
                    onClick={() => handleTypeBusinessChange(range.label)}
                    onTouchStart={() => handleTypeBusinessChange(range.label)}
                    onMouseDown={() => handleTypeBusinessChange(range.label)}
                    sx={getButtonStyles(typeBusiness === range.label)}
                  >
                    <Typography className="form-input" sx={{ padding: '3px' }}> {range.label}</Typography>
                  </Button>
                ))}
              </Box>
              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                Whats your role?
              </Typography>
              {errors.selectedEmployees && (
                <Typography variant="body2" color="error">
                  {errors.selectedEmployees}
                </Typography>
              )}
              <Box sx={styles.rolesButtons}>
                {roles.map((range, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    onClick={() => handleRolesChange(range.label)}
                    onTouchStart={() => handleRolesChange(range.label)}
                    onMouseDown={() => handleRolesChange(range.label)}
                    sx={getButtonRolesStyles(selectedRoles === range.label)}
                  >
                    <Typography className="form-input" sx={{ padding: '3px' }}> {range.label}</Typography>
                  </Button>
                ))}
              </Box>
              <Button
                className='hyperlink-red'
                fullWidth
                variant="contained"
                sx={{
                  ...styles.submitButton,
                  opacity: isFormValid() ? 1 : 0.6,
                  pointerEvents: isFormValid() ? "auto" : "none",
                  backgroundColor: isFormValid()
                    ? "rgba(244, 87, 69, 1)"
                    : "rgba(244, 87, 69, 0.4)",
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(244, 87, 69, 0.6)",
                    color: "#fff",
                  },
                }}
                onClick={handleNextClick}
                disabled={!isFormBusinessValid()}
              >
                Next
              </Button>
            </>
          )}
          {activeTab === 2 && (
            <>
              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                Select how you would like to install the pixel
              </Typography>
              {errors.selectedEmployees && (
                <Typography variant="body2" color="error">
                  {errors.selectedEmployees}
                </Typography>
              )}
              <Box sx={{...styles.rolesButtons, display: "grid", gridTemplateColumns: "1fr 1fr"}}>
                {method_installingPixel.map((range, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      onClick={() => handleRolesChange(range.label)}
                      onTouchStart={() => handleRolesChange(range.label)}
                      onMouseDown={() => handleRolesChange(range.label)}
                      sx={{...getButtonRolesStyles(selectedRoles === range.label), gap: "8px", justifyContent: "flex-start", p: "12px"}}
                    >
                      <Image src={range.src} alt="Method install pixel" width={24} height={24}/>
                      <Typography className="form-input" style={{color: "rgba(112, 112, 113, 1)", lineHeight: "19.6px" }}> {range.label}</Typography>
                    </Button>
                ))}
              </Box>
              <Button
                className='hyperlink-red'
                fullWidth
                variant="contained"
                sx={{
                  ...styles.submitButton,
                  opacity: isFormValid() ? 1 : 0.6,
                  pointerEvents: isFormValid() ? "auto" : "none",
                  backgroundColor: isFormValid()
                    ? "rgba(244, 87, 69, 1)"
                    : "rgba(244, 87, 69, 0.4)",
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(244, 87, 69, 0.6)",
                    color: "#fff",
                  },
                }}
                onClick={handleNextClick}
                disabled={!isFormBusinessValid()}
              >
                Next
              </Button>
              <Button
                className='hyperlink-red'
                fullWidth
                variant="contained"
                sx={{
                  ...styles.submitButton,
                  opacity: isFormValid() ? 1 : 0.6,
                  pointerEvents: isFormValid() ? "auto" : "none",
                  color: isFormValid()
                    ? "rgba(244, 87, 69, 1)"
                    : "rgba(244, 87, 69, 0.4)",
                  "&.Mui-disabled": {
                    color: "rgba(244, 87, 69, 0.6)",
                    backgroundColor: "#fff",
                  },
                }}
                onClick={handleSkip}
                disabled={!isFormBusinessValid()}
              >
                Skip
              </Button>
            </>
          )}
          {/* {activeTab === 3 && (
            <>
              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                How many employees work at your organization
              </Typography>
              {errors.selectedEmployees && (
                <Typography variant="body2" color="error">
                  {errors.selectedEmployees}
                </Typography>
              )}
              <Box sx={styles.employeeButtons}>
                {ranges.map((range, index) => (
                  <Button
                    className="form-input"
                    key={index}
                    variant="outlined"
                    onClick={() => handleEmployeeRangeChange(range.label)}
                    onTouchStart={() => handleEmployeeRangeChange(range.label)}
                    onMouseDown={() => handleEmployeeRangeChange(range.label)}
                    sx={getButtonStyles(selectedEmployees === range.label)}
                  >
                    <Typography className="form-input" sx={{ padding: '3px' }}> {range.label}</Typography>
                  </Button>
                ))}
              </Box>
              <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                Whats your role?
              </Typography>
              {errors.selectedEmployees && (
                <Typography variant="body2" color="error">
                  {errors.selectedEmployees}
                </Typography>
              )}
              <Box sx={styles.rolesButtons}>
                {roles.map((range, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    onClick={() => handleRolesChange(range.label)}
                    onTouchStart={() => handleRolesChange(range.label)}
                    onMouseDown={() => handleRolesChange(range.label)}
                    sx={getButtonRolesStyles(selectedRoles === range.label)}
                  >
                    <Typography className="form-input" sx={{ padding: '3px' }}> {range.label}</Typography>
                  </Button>
                ))}
              </Box>
              <Button
                className='hyperlink-red'
                fullWidth
                variant="contained"
                sx={{
                  ...styles.submitButton,
                  opacity: isFormValid() ? 1 : 0.6,
                  pointerEvents: isFormValid() ? "auto" : "none",
                  backgroundColor: isFormValid()
                    ? "rgba(244, 87, 69, 1)"
                    : "rgba(244, 87, 69, 0.4)",
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(244, 87, 69, 0.6)",
                    color: "#fff",
                  },
                }}
                onClick={handleSubmit}
                disabled={!isFormBusinessValid()}
              >
                Next
              </Button>
            </>
          )} */}
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
