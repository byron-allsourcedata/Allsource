"use client";
import React, { Suspense, ChangeEvent, useState, useEffect } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Link,
  Divider,
  TextField,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { styles } from "./accountStyles";
import GoogleTagPopup from '../dashboard/components/GoogleTagPopup';
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "../../../context/UserContext";
import axiosInterceptorInstance from "../../../axios/axiosInterceptorInstance";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import PersonIcon from '@mui/icons-material/Person';
import MetaConnectButton from "@/components/MetaConnectButton";
import KlaviyoIntegrationPopup from "@/components/KlaviyoIntegrationPopup";
import OmnisendConnect from "@/components/OmnisendConnect";
import MailchimpConnect from "@/components/MailchimpConnect";
import AttentiveIntegrationPopup from "@/components/AttentiveIntegrationPopup";
import SendlaneConnect from "@/components/SendlaneConnect";
import ZapierConnectPopup from "@/components/ZapierConnectPopup";
import SlackConnectPopup from "@/components/SlackConnectPopup";
import ShopifySettings from "@/components/ShopifySettings";
import BCommerceConnect from "@/components/Bcommerce";
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '@/axios/axiosInterceptorInstance';
import { showErrorToast, showToast } from '@/components/ToastNotification';
import { fetchUserData } from '@/services/meService';

const AccountSetup = () => {
  const [organizationName, setOrganizationName] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [domainLink, setDomainLink] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState("");
  const [typeBusiness, setTypeBusiness] = useState("");
  const [selectedVisits, setSelectedVisits] = useState("");
  const [selectedRoles, setSelectedRoles] = useState("");
  const [selectedMethodInstall, setSelectedMethodInstall] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState("");
  const [pixelCode, setPixelCode] = useState('');
  const [stripeUrl, setStripeUrl] = useState('');
  const [domainName, setDomainName] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [bigcommerceHash, setBigcommerceHash] = useState("");
  const [wordPressId, setWordPressId] = useState("");
  const [integrationsCredentials, setIntegrationsCredentials] = useState<IntegrationCredentials[]>([]);
  const [editingName, setEditingName] = useState(true)
  const [manuallInstall, setManuallInstall] = useState(false)
  const [shopifyInstall, setShopifyInstall] = useState(false)
  const [bigcommerceInstall, setBigcommerceInstall] = useState(false)
  const [wordpressInstall, setWordpressInstall] = useState(false)
  const [googletagInstall, setGoogletagInstall] = useState(false)
  const [sendlanePopupOpen, setSendlanePopupOpen] = useState(false)
  const [mailChimpPopupOpen, setMailchimpPopupOpen] = useState(false)
  const [attentivePopupOpen, setAttentivePopupOpen] = useState(false)
  const [slackPopupOpen, setSlackPopupOpen] = useState(false)
  const [klaviyoPopupOpen, setKlaviyoPopupOpen] = useState(false)
  const [zapierPopupOpen, setZapierPopupOpen] = useState(false)
  const [omnisendPopupOpen, setOmnisendPopupOpen] = useState(false)
  const [metaPopupOpen, setMetaPopupOpen] = useState(false)
  const [opengoogle, setGoogleOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cmsData, setCmsData] = useState<CmsData>({});
  const { setBackButton, backButton } = useUser()
  const [errors, setErrors] = useState({
    websiteLink: "",
    organizationName: "",
    selectedEmployees: "",
    selectedVisits: "",
    typeBusiness: "",
    selectedMethodInstall: "",
    selectedIntegration: ""

  });
  const router = useRouter();
  const [visibleButton, setVisibleButton] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [emailDeveloper, setEmailDeveloper] = useState<string>();
  const [activeTab, setActiveTab] = useState(0);
  const { full_name: userFullName, email: userEmail, partner } = useUser();

  interface CmsData {
    manual?: string;
    pixel_client_id?: string;
  }

  interface IntegrationCredentials {
    access_token: string;
    service_name: string;
    is_with_suppresions?: boolean;
    error_message?: string
    is_failed?: boolean
    id?: number
    ad_account_id?: string
    shop_domain?: string
    data_center?: string
  }

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true)
        const response = await axiosInterceptorInstance.get("/company-info");
        const status = response.data.status;
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
            setActiveTab(2)
            break;
          default:
            console.error("Unknown status:", status);
        }
      } catch (error) {
        console.error("Error fetching company info:", error);
      }
      finally{
        setLoading(false)
      }
    };
    const handleRedirect = async () => {
      const query = new URLSearchParams(window.location.search);
      const authorizationCode = query.get('code');

      if (authorizationCode) {
        try {
          setGoogleOpen(true);
        } catch (error) {
        }
      }
    };

    handleRedirect();
    fetchCompanyInfo();
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

  useEffect(() => {
    const parent_token = localStorage.getItem("parent_token");
    setVisibleButton(!!parent_token);
  }, []);

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


  const fetchEditDomain = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.put(`install-pixel/update-domain`, { new_domain: domainName.replace(/^https?:\/\//, "") }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        showToast('Domain name successfully updated!');
      }
    }
    catch {
    }
    finally {
      setLoading(false)
    }
  }

  // useEffect(() => {
  //   const fetchCompanyInfo = async () => {
  //     try {
  //       const response = await axiosInterceptorInstance.get("/company-info");

  //       const status = response.data.status;
  //       const domain_url = response.data.domain_url
  //       if (domain_url) {
  //         setWebsiteLink(domain_url)
  //         setDomainLink(domain_url)
  //       }

  //       switch (status) {
  //         case "SUCCESS":
  //           break;
  //         case "NEED_EMAIL_VERIFIED":
  //           router.push("/email-verificate");
  //           break;
  //         case "NEED_CHOOSE_PLAN":
  //           router.push("/settings?section=subscription");
  //           break;
  //         case "DASHBOARD_ALLOWED":
  //           router.push("/dashboard");
  //           break;
  //         default:
  //           console.error("Unknown status:", status);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching company info:", error);
  //     }
  //   };
  //   fetchCompanyInfo();
  // }, [router]);

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

  const maintext = {
    textAlign: 'left',
    color: 'rgba(32,33, 36, 1) !important',
    padding: '0em 0em 0em 1em',
  };

  const subtext = {
    fontFamily: 'Nunito Sans',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '16.8px',
    textAlign: 'left',
    color: 'rgba(0, 0, 0, 1)',
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
  const handleMethodInstall = (label: string) => {
    setSelectedMethodInstall(label);
    setErrors({ ...errors, selectedMethodInstall: "" });
  };
  const handleIntegration = (label: string) => {
    setSelectedIntegration(label);
    setErrors({ ...errors, selectedIntegration: "" });
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
    if (activeTab === 3) {
      endSetup()
    }
    else {
      setActiveTab((prev) => prev + 1);
    }

  }

  const endSetup = () => {
    if (stripeUrl) {
      router.push(stripeUrl)
    }
    else {
      router.push(partner ? '/partners' : '/dashboard');
    }
  }


  const handleSubmit = async () => {
    const newErrors = {
      websiteLink: validateField(websiteLink, "website"),
      organizationName: validateField(organizationName, "organizationName"),
      selectedEmployees: selectedEmployees ? "" : "Please select number of employees",
      selectedVisits: selectedVisits ? "" : "Please select number of visits",
      selectedRoles: selectedRoles ? "" : "Please select your`s role",
      typeBusiness: typeBusiness ? "" : "Please select your`s type business",
      selectedMethodInstall: selectedMethodInstall ? "" : "Please select method install pixel",
      selectedIntegration: selectedIntegration ? "" : "Please choice integration"
    };
    setErrors(newErrors);

    if (
      newErrors.websiteLink ||
      newErrors.organizationName ||
      newErrors.selectedEmployees ||
      newErrors.selectedRoles ||
      newErrors.selectedVisits ||
      newErrors.typeBusiness
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
        business_type: typeBusiness.toLowerCase()
      });

      switch (response.data.status) {
        case "SUCCESS":
          const domain = websiteLink.replace(/^https?:\/\//, "")
          sessionStorage.setItem('current_domain', domain)
          setDomainName(domain)
          setEditingName(false)
          await fetchUserData();
          if (response.data.stripe_payment_url) {
            setStripeUrl(`${response.data.stripe_payment_url}`)
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
      organizationName: validateField(organizationName, "organizationName")
    };

    return (
      errors.websiteLink === "" && errors.organizationName === "" && selectedVisits !== ""
    );
  };

  const isFormValidSecond = () => {
    return (
      typeBusiness !== "" && selectedRoles !== "" && selectedEmployees !== ""
    );
  };

  const isFormValidThird = () => {
    return selectedMethodInstall !== ""
  };

  const isFormValidFourth = () => {
    return selectedIntegration !== ""
  };

  const installManually = async () => {
    try {
      const response = await axiosInterceptorInstance.get('/install-pixel/manually');
      setPixelCode(response.data.manual);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const installCMS = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInterceptorInstance.get('/install-pixel/cms');
      setCmsData(response.data);
      setWordPressId(response.data.pixel_client_id)
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 403) {
        if (error.response.data.status === 'NEED_BOOK_CALL') {
          sessionStorage.setItem('is_slider_opened', 'true');
        } else {
          sessionStorage.setItem('is_slider_opened', 'false');
        }
      }
    }
    finally {
      setIsLoading(false)
    }
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
    { label: "Manually", src: "install_manually.svg", setState: setManuallInstall, action: installManually },
    { label: "Google Tag Manager", src: "install_gtm.svg", setState: setGoogletagInstall, action: () => { setGoogleOpen(true) } },
    { label: "Shopify", src: "install_cms1.svg", setState: setShopifyInstall, action: installCMS },
    { label: "WordPress", src: "install_cms2.svg", setState: setWordpressInstall, action: installCMS },
    { label: "Bigcommerce", src: "bigcommerce-icon.svg", setState: setBigcommerceInstall, action: installCMS },
  ];
  const integrations = [
    { label: "Klaviyo", src: "klaviyo.svg", setState: setKlaviyoPopupOpen },
    { label: "Mailchimp", src: "mailchimp-icon.svg", setState: setMailchimpPopupOpen },
    { label: "Meta", src: "meta-icon.svg", setState: setMetaPopupOpen },
    { label: "Omnisend", src: "omnisend_icon_black.svg", setState: setOmnisendPopupOpen },
    { label: "Sendlane", src: "sendlane-icon.svg", setState: setSendlanePopupOpen},
    { label: "Slack", src: "slack-icon.svg", setState: setSlackPopupOpen},
    { label: "Zapier", src: "zapier-icon.svg", setState: setZapierPopupOpen},
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
    if (activeTab !== 3) {
      setManuallInstall(false);
      setBigcommerceInstall(false);
      setShopifyInstall(false);
      setWordpressInstall(false);
      setGoogletagInstall(false);
    }
    setActiveTab((prev) => prev - 1);
  };

  const handleNextClick = () => {
    if (activeTab === 1) {
      handleSubmit()
    }
    let isMatched = false;

    method_installingPixel.forEach(({ label, setState, action }) => {
      console.log(selectedMethodInstall, label)
      if (selectedMethodInstall === label) {
        setState(true);
        isMatched = true;
        action()
      } else {
        setState(false);
      }
    });

    if (activeTab === 3) {
      endSetup()
    }
    else {
      if (!isMatched) {
        setActiveTab((prev) => prev + 1);
      }
    }

  };

  const handleLastSlide = () => {
    integrations.forEach(({ label, setState }) => {
      if (selectedIntegration === label) {
        setState(true);
      } else {
        setState(false);
      }

    });
  } 

  const handleCancel = () => {
    method_installingPixel.forEach(({ label, setState }) => {
      if (selectedMethodInstall === label) {
        setState(false);
      }
    });
  }

  const handleButtonClick = () => {
    axiosInstance.post('/install-pixel/send-pixel-code', { email: emailDeveloper })
      .then(response => {
        showToast('Successfully send email')
      })
      .catch(error => {
      });
  };

  const handleSaveSettings = (newIntegration: IntegrationCredentials) => {
    setIntegrationsCredentials(prevIntegrations => {
      if (prevIntegrations.some(integration => integration.service_name === newIntegration.service_name)) {
        return prevIntegrations.map(integration =>
          integration.service_name === newIntegration.service_name ? newIntegration : integration
        );
      } else {
        return [...prevIntegrations, newIntegration];
      }
    });
    endSetup()
  };

  const handleInstallShopify = async () => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) return;

    const body: Record<string, any> = {
      shopify: {
        shop_domain: domainName.trim(),
        access_token: accessToken.trim()
      },
      pixel_install: true
    };

    try {
      const response = await axiosInstance.post("/integrations/", body, {
        params: {
          service_name: "shopify",
        },
      });

      if (response.status === 200) {
        showToast('Successfully installed pixel');
      } else {
        showErrorToast('Failed to install pixel');
      }
    } catch (error) {
      showErrorToast('An error occurred while installing the pixel');
    }
  };

  const handleInstallBigCommerce = async () => {
    const response = await axiosInstance.get('/integrations/bigcommerce/oauth', { params: { store_hash: bigcommerceHash } })
    if (response.status === 200) {
      showToast("Success")
      window.open(response.data.url, '_blank');
    }
  }

  const handleCopyToClipboard = () => {
    if (cmsData.pixel_client_id){
      navigator.clipboard.writeText(cmsData.pixel_client_id);
      showToast('Site ID copied to clipboard!');
    }
  };

  const handleVerifyPixel = () => {
    let url = domainName.trim();

    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
      }


      axiosInstance.post("/install-pixel/check-pixel-installed-parse", { url, need_reload_page: true })
        .then(response => {
          const status = response.data.status;
          if (status === "PIXEL_CODE_INSTALLED") {
            setActiveTab((prev) => prev + 1);
          }
        })
        .catch(error => {
          showErrorToast("An error occurred while checking the pixel code.");
        });

      const hasQuery = url.includes("?");
      const newUrl = url + (hasQuery ? "&" : "?") + "vge=true" + "&api=https://api-dev.maximiz.ai";
      window.open(newUrl, "_blank");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    alert('Copied to clipboard');
  };

  if (loading) {
    return <CustomizedProgressBar />;
}

  return (
    <Box sx={{ ...styles.pageContainer, 
    }}>
      <Box sx={{...styles.headers, overflow: "hidden"}}>
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
          {selectedMethodInstall === "" && activeTab != 2 && <Button
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
          </Button>}
          {true && <Tabs
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
                marginLeft: (visibleButton || backButton) ? 0 : 2.5,
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
            <Tab
              className="tab-heading"
              label="Integrations"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                color:
                  activeTab === 3
                    ? "#F45745"
                    : "#707071",
                "&.Mui-selected": {
                  color: "#F45745",
                },
              }}
            />
          </Tabs>}

          {false && <Tabs sx={{
            width: "100%",
          }}>
            <Tab 
              label="Create Account"
              sx={{
                textTransform: "none",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                pt: "38px",
                position: "relative",
                color: "rgba(244, 87, 69, 1)",
                justifyContent: "end",
                alignItems: "start",  
                width: "90px",
                textAlign: "left",
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                '&::before': {
                  content: '"1"',
                  display: 'flex',
                  position: 'absolute',
                  borderRadius: "50%",
                  top: '0px',
                  width: '30px',
                  height: '30px',
                  color: activeTab > 0 ? "#fff" : "rgba(32, 33, 36, 1)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(208, 213, 221, 1)", 
                },
                '&::after': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  left: 80,
                  top: 15,
                  width: '51px',
                  height: '1px',
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(32, 33, 36, 1)", 
                }
              }}
            />
            <Tab 
              label="Business Info"
              sx={{
                textTransform: "none",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                pt: "38px",
                position: "relative",
                color: "rgba(244, 87, 69, 1)",
                justifyContent: "end",
                alignItems: "start",
                width: "90px",
                textAlign: "left",
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                '&::before': {
                  content: '"2"',
                  display: 'flex',
                  position: 'absolute',
                  borderRadius: "50%",
                  top: 0,
                  width: '30px',
                  height: '30px',
                  color: activeTab > 0 ? "#fff" : "rgba(32, 33, 36, 1)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(208, 213, 221, 1)", 
                },
                '&::after': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  left: 80,
                  top: 15,
                  width: '51px',
                  height: '1px',
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(32, 33, 36, 1)", 
                }
              }}
            />
            <Tab 
              label="Pixel Installation"
              sx={{
                textTransform: "none",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                pt: "38px",
                position: "relative",
                color: "rgba(244, 87, 69, 1)",
                justifyContent: "end",
                alignItems: "start",
                width: "90px",
                textAlign: "left",
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                '&::before': {
                  content: '"3"',
                  display: 'flex',
                  position: 'absolute',
                  borderRadius: "50%",
                  top: 0,
                  width: '30px',
                  height: '30px',
                  color: activeTab > 0 ? "#fff" : "rgba(32, 33, 36, 1)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(208, 213, 221, 1)", 
                },
                '&::after': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  left: 80,
                  top: 15,
                  width: '51px',
                  height: '1px',
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(32, 33, 36, 1)", 
                }
              }}
            />
            <Tab 
              label="Integrations"
              sx={{
                textTransform: "none",
                pointerEvents: "none",
                lineHeight: "normal !important",
                padding: 0,
                pt: "38px",
                position: "relative",
                color: "rgba(244, 87, 69, 1)",
                justifyContent: "end",
                alignItems: "start",
                width: "90px",
                textAlign: "left",
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                '&::before': {
                  content: '"4"',
                  display: 'flex',
                  position: 'absolute',
                  borderRadius: "50%",
                  top: 0,
                  width: '30px',
                  height: '30px',
                  color: activeTab > 0 ? "#fff" : "rgba(32, 33, 36, 1)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: activeTab === 0 ? "rgba(248, 70, 75, 1)" : "rgba(208, 213, 221, 1)", 
                }
              }}
            />
          </Tabs>}

        </Box>

        <Button
          aria-controls={open ? "profile-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleProfileMenuClick}
          sx={{
            minWidth: '32px',
            padding: '6px',
            // mr: '1.5rem',
            // mb: '1.125rem',  
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
              display: 'none',
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

      <Box sx={{display: "flex", justifyContent: "center", width: "100%"}}>
        <Box sx={{...styles.formContainer, overflow: "hidden"}}>
            <Box sx={{...styles.form, overflow: "auto", marginTop: 3, "&::-webkit-scrollbar": {display: "none"}, "-ms-overflow-style": "none", "scrollbar-width": "none" }}>
              <Box
                sx={{
                  "@media (max-width: 600px)": {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    pb: 1
                  },
                }}
              >
                {!shopifyInstall && !bigcommerceInstall && !googletagInstall && !wordpressInstall && !manuallInstall && 
                  <>
                    <Typography variant="h5" component="h1" className="heading-text" sx={styles.title}>
                      Welcome {fullName},
                    </Typography>
                    <Typography variant="body1" component="h2" className="first-sub-title" sx={styles.subtitle}>
                      Let&apos;s set up your account
                    </Typography>
                  </>
                }
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
                      opacity: isFormValidFirst() ? 1 : 0.6,
                      pointerEvents: isFormValidFirst() ? "auto" : "none",
                      backgroundColor: isFormValidFirst()
                        ? "rgba(244, 87, 69, 1)"
                        : "rgba(244, 87, 69, 0.4)",
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(244, 87, 69, 0.6)",
                        color: "#fff",
                      },
                    }}
                    onClick={handleNextClick}
                    disabled={!isFormValidFirst()}
                  >
                    Next
                  </Button>
                </>
              )}
              {activeTab === 1 && (
                <>
                  {/* Business info */}
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
                      opacity: isFormValidSecond() ? 1 : 0.6,
                      pointerEvents: isFormValidSecond() ? "auto" : "none",
                      backgroundColor: isFormValidSecond()
                        ? "rgba(244, 87, 69, 1)"
                        : "rgba(244, 87, 69, 0.4)",
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(244, 87, 69, 0.6)",
                        color: "#fff",
                      },
                    }}
                    onClick={handleNextClick}
                    disabled={!isFormValidSecond()}
                  >
                    Next
                  </Button>
                </>
              )}
              {activeTab === 2 &&
                <>
                  {manuallInstall &&
                    <Box sx={{display: 'flex', flexDirection: "column", gap: 3}}> 
                    
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: '100%', alignItems: 'center'}}>
                        <Box sx={{display: "flex", gap:"16px", alignItems: "center"}}>
                          <Image src="install_manually.svg" alt="Manually install pixel" width={24} height={24} />
                          <Typography className='first-sub-title'>
                            Install Manually
                          </Typography>
                        </Box>
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/how-do-i-insta"
                          target="_blank" className='first-sub-title' style={{ fontSize: "14px", color: "rgba(80, 82, 178, 1)" }}
                          sx={{ textDecoration: "underline", cursor: "pointer" }}>
                          Tutorial
                        </Link>
                      </Box>
                      <Divider />

                      <Box sx={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {editingName
                          ?
                          <>
                            <TextField
                              id="filled-basic"
                              placeholder="Enter your domain"
                              value={domainName}
                              onChange={(e) => {
                                setDomainName(e.target.value)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingName(false)
                                }
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">https://</InputAdornment>
                                )
                              }}
                              variant="outlined"
                              sx={{
                                flex: 1,
                                width: '360px',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '4px',
                                  height: '40px',
                                },
                                '& input': {
                                  paddingLeft: 0,
                                },
                                '& input::placeholder': {
                                  fontSize: '14px',
                                  color: '#8C8C8C',
                                },
                              }}
                            />
                            <Button
                              onClick={() => {
                                setEditingName(false)
                                setDomainName(prev => prev.replace(/^https?:\/\//, ""))
                                sessionStorage.setItem('current_domain', domainName.replace(/^https?:\/\//, ""))
                                fetchEditDomain()
                              }}
                              sx={{
                                m: 0,
                                border: '1px solid rgba(80, 82, 178, 1)',
                                textTransform: 'none',
                                background: '#fff',
                                color: 'rgba(80, 82, 178, 1)',
                                fontFamily: 'Nunito Sans',
                                padding: '0.65em 2em',
                                '@media (max-width: 600px)': { padding: '0.5em 1.5em', left: 0 }
                              }}
                            >
                              <Typography className='second-sub-title' sx={{
                                color: 'rgba(80, 82, 178, 1) !important', textAlign: 'left'
                              }}>
                                Save
                              </Typography>
                            </Button>
                          </>
                          :
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography className='first-sub-title' sx={{ textAlign: 'left' }}>
                              {domainName}
                            </Typography>
                            <IconButton onClick={() => setEditingName(true)} sx={{ p: "4px", ':hover': { backgroundColor: 'transparent', } }} >
                              <EditIcon height={8} width={8} sx={{ color: "rgba(80, 82, 178, 1)" }} />
                            </IconButton>
                          </Box>

                        }
                      </Box>
                        
                        <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/1.svg' alt='1' width={20} height={20} />
                          <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Copy the pixel code</Typography>
                          <Box/>
                          <Box
                            component="pre"
                            sx={{
                              m: 0,
                              backgroundColor: '#ffffff',
                              gap: 2,
                              position: 'relative',
                              wordWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              border: '1px solid rgba(228, 228, 228, 1)',
                              borderRadius: '10px',
                              maxHeight: '14em',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              '@media (max-width: 600px)': {
                                maxHeight: '14em',
                              },
                            }}
                          >
                            <IconButton onClick={handleCopy} sx={{ position: 'absolute', right: '10px', top: '10px' }}>
                              <ContentCopyIcon />
                            </IconButton>
                            <code style={{ color: 'rgba(95, 99, 104, 1)', fontSize: '12px', margin: 0, fontWeight: 400, fontFamily: 'Nunito Sans', textWrap: 'nowrap' }}>
                              {pixelCode?.trim()}
                            </code>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/2.svg' alt='2' width={20} height={20} />
                          <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Paste the pixel in your website</Typography>
                          <Box />
                          <Typography className='paragraph' sx={subtext}>Paste the above pixel in the header of your website. The header script starts with &lt;head&gt; and ends with &lt;/head&gt;.</Typography>
                        </Box>
                        
                        
                        <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/3.svg' alt='3' width={20} height={20} />
                          <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Verify Your Pixel</Typography>
                          <Box />
                          <Typography className='paragraph' sx={subtext}>Once the pixel is pasted in your website, wait for 10-15 mins and verify your pixel.</Typography>
                        </Box>
                        
                        <Box sx={{ position: 'relative', width: '100%' }}>
                          <Box
                            sx={{
                              padding: '1.1em',
                              border: '1px solid #e4e4e4',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(247, 247, 247, 1)',
                              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            <Typography
                              variant="h6"
                              component="div"
                              mb={2}
                              className='first-sub-title'
                              sx={{
                                textAlign: 'left',
                              }}
                            >
                              Send this to my developer
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" flexDirection="row" sx={{ '@media (max-width: 600px)': { flexDirection: 'column', display: 'flex', alignContent: 'flex-start', alignItems: 'flex-start', gap: 1 } }}>
                              <InputBase
                                id="email_send"
                                type="text"
                                placeholder="Enter Email ID"
                                value={emailDeveloper}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmailDeveloper(e.target.value)}
                                className='paragraph'
                                sx={{
                                  padding: '0.5rem 2em 0.5em 1em',
                                  width: '65%',
                                  border: '1px solid #e4e4e4',
                                  borderRadius: '4px',
                                  maxHeight: '2.5em',
                                  fontSize: '14px !important',
                                  textAlign: 'left',
                                  backgroundColor: 'rgba(255, 255, 255, 1)',
                                  boxShadow: 'none',
                                  outline: 'none',
                                  '&:focus': {
                                    borderColor: '#3f51b5',
                                  },
                                  '@media (max-width: 600px)': {
                                    width: '100%',
                                  },
                                }}
                              />

                              <Button
                                onClick={handleButtonClick}
                                sx={{
                                  ml: 2,
                                  border: '1px solid rgba(80, 82, 178, 1)',
                                  textTransform: 'none',
                                  background: '#fff',
                                  color: 'rgba(80, 82, 178, 1)',
                                  fontFamily: 'Nunito Sans',
                                  padding: '0.65em 2em',
                                  mr: 1,
                                  '@media (max-width: 600px)': { padding: '0.5em 1.5em', mr: 0, ml: 0, left: 0 }
                                }}
                              >
                                <Typography className='second-sub-title' sx={{
                                  color: 'rgba(80, 82, 178, 1) !important', textAlign: 'left'
                                }}>
                                  Send
                                </Typography>
                              </Button>
                            </Box>
                          </Box>
                        </Box>

                        <Button
                          className='hyperlink-red'
                          fullWidth
                          variant="contained"
                          sx={{
                            ...styles.submitButton,
                            opacity: domainName.trim() !== "" ? 1 : 0.6,
                            pointerEvents: domainName.trim() !== "" ? "auto" : "none",
                            mb: 2,
                            backgroundColor: domainName.trim() !== ""
                              ? "rgba(244, 87, 69, 1)"
                              : "rgba(244, 87, 69, 0.4)",
                            "&.Mui-disabled": {
                              backgroundColor: "rgba(244, 87, 69, 0.6)",
                              color: "#fff",
                            },
                          }}
                          onClick={handleVerifyPixel}
                          disabled={domainName.trim() === ""}
                        >
                          Verify Your Pixel
                        </Button>
                    </Box>
                  }
                  {shopifyInstall && 
                    <Box sx={{display: 'flex', flexDirection: "column", gap: 3}}> 
                      
                      <Box display="flex" justifyContent="space-between" sx={{ width: '100%', alignItems: 'center'}}>
                        <Box display="flex" gap="16px">
                        <Image src="install_cms1.svg" alt="Shopify install pixel" width={24} height={24}/>
                          <Typography className='first-sub-title' sx={{  textAlign: 'left'}}>
                            Install with Shopify
                          </Typography>
                        </Box>    
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/how-do-i-install-maximiz-pixel-on-shopify-store" 
                              target="_blank" className='first-sub-title' style={{fontSize: "14px", color: "rgba(80, 82, 178, 1)"}} 
                              sx={{ textDecoration: "underline", cursor: "pointer"}}>
                          Tutorial
                        </Link>
                      </Box>

                      <Divider />
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/1.svg' alt='1' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Enter your Shopify shop domain in the designated field. This allows our system to identify your store.</Typography>
                          </Box>
                          <Box/>
                          <TextField
                            fullWidth
                            label="Shop Domain"
                            variant="outlined"
                            placeholder='Enter your Shop Domain'
                            margin="normal"
                            InputProps={{
                              style: {
                                  color: 'rgba(17, 17, 19, 1)',
                                  fontFamily: 'Nunito Sans',
                                  fontWeight: 400,
                                  fontSize: '14px',
                                  
                              },
                            }}
                            value={isFocused
                              ? (domainName ? domainName.replace(/^https?:\/\//, "") : "")
                              : (domainName ? `https://${domainName.replace(/^https?:\/\//, "")}` : "https://")
                            }
                            sx={{
                              mt: 0,
                              mb: 0,
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                  borderColor: "rgba(80, 82, 178, 1)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "rgba(86, 153, 237, 1)",
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: "rgba(17, 17, 19, 0.6)",
                                }
                              },
                              "& .MuiInputLabel-shrink": {
                                transformOrigin: "center",
                                fontSize: "12px",
                                left: "-5px",
                                top: "-1px"
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                top: "-1px"
                              }
                            }}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onChange={(e) => setDomainName(e.target.value)}
                            InputLabelProps={{ sx: styles.inputLabel }}
                          />
                      </Box>
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/2.svg' alt='2' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Enter your Shopify shop domain in the designated field. This allows our system to identify your store.</Typography>
                          </Box>
                          <Box/>
                          <TextField
                            InputProps={{
                              style: {
                                  color: 'rgba(17, 17, 19, 1)',
                                  fontFamily: 'Nunito Sans',
                                  fontWeight: 400,
                                  fontSize: '14px',
                              },
                            }}
                            fullWidth
                            variant="outlined"
                            placeholder='Enter your Access Token'
                            margin="normal"
                            sx={{
                              mt: 0,
                              mb: 0,
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                  borderColor: "rgba(80, 82, 178, 1)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "rgba(86, 153, 237, 1)",
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                }
                              },
                              "& .MuiInputLabel-shrink": {
                                  transformOrigin: "center",
                                  left: 10
                                },
                              "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 15px) scale(1)",
                                }, 
                                
                            }}
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            InputLabelProps={{ sx: styles.inputLabel }}
                          />
                      </Box>
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/3.svg' alt='3' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Once you have submitted the required information, our system will automatically install the script on your Shopify store. You don’t need to take any further action.</Typography>
                          </Box>
                      </Box>
                      
                      <Button
                        className='hyperlink-red'
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          opacity: accessToken.trim() !== "" || domainName.trim() !== "" ? 1 : 0.6,
                          pointerEvents: accessToken.trim() !== "" || domainName.trim() !== "" ? "auto" : "none",
                          mb: 2,
                          mt: 0,
                          backgroundColor: accessToken.trim() !== "" || domainName.trim() !== ""
                            ? "rgba(244, 87, 69, 1)"
                            : "rgba(244, 87, 69, 0.4)",
                          "&.Mui-disabled": {
                            backgroundColor: "rgba(244, 87, 69, 0.6)",
                            color: "#fff",
                          },
                        }}
                        onClick={handleInstallShopify}
                        disabled={accessToken.trim() === "" || domainName.trim() === ""}
                      >
                        Install Pixel
                      </Button>

                    </Box>
                  }
                  {bigcommerceInstall && 
                    <Box sx={{display: 'flex', flexDirection: "column", gap: 3}}> 
                      
                      <Box display="flex" justifyContent="space-between" sx={{ width: '100%', alignItems: 'center'}}>
                        <Box display="flex" gap="16px">
                        <Image src="bigcommerce-icon.svg" alt="Bigcommerce install pixel" width={24} height={24}/>
                          <Typography className='first-sub-title' sx={{  textAlign: 'left' }}>
                            Install with Bigcommerce
                          </Typography>
                        </Box>    
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/how-do-i-install-maximiz-pixel-on-shopify-store" 
                              target="_blank" className='first-sub-title' style={{fontSize: "14px", color: "rgba(80, 82, 178, 1)"}} 
                              sx={{ textDecoration: "underline", cursor: "pointer"}}>
                          Tutorial
                        </Link>
                      </Box>

                      <Divider />
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/1.svg' alt='1' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Enter your Bigcommerce store hash in the designated field. This allows our system to identify your store.</Typography>
                          </Box>
                          <Box/>
                          <TextField
                            InputProps={{
                              style: {
                                  color: 'rgba(17, 17, 19, 1)',
                                  fontFamily: 'Nunito Sans',
                                  fontWeight: 400,
                                  fontSize: '14px',
                              },
                            }}
                            fullWidth
                            variant="outlined"
                            placeholder='Enter your store hash'
                            margin="normal"
                            sx={{
                              m: 0,
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                  borderColor: "rgba(80, 82, 178, 1)",
                                },
                                "&:hover fieldset": {
                                  borderColor: "rgba(86, 153, 237, 1)",
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                    color: "rgba(17, 17, 19, 0.6)",
                                }
                              },
                              "& .MuiInputLabel-shrink": {
                                  transformOrigin: "center",
                                  left: 10
                                },
                              "& .MuiInputLabel-root[data-shrink='false']": {
                                    transform: "translate(16px, 15px) scale(1)",
                                }, 
                                
                            }}
                            value={bigcommerceHash}
                            onChange={(e) => setBigcommerceHash(e.target.value)}
                            InputLabelProps={{ sx: styles.inputLabel }}
                          />
                      </Box>
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/2.svg' alt='2' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', padding: 0, fontWeight: '500' }}>Once you have submitted the required information, our system will automatically install the script on your Bigcommerce store. You don’t need to take any further action.</Typography>
                          </Box>
                      </Box>
                      
                      <Button
                        className='hyperlink-red'
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          opacity: bigcommerceHash.trim() !== "" ? 1 : 0.6,
                          pointerEvents: bigcommerceHash.trim() !== "" ? "auto" : "none",
                          mb: 2,
                          mt: 0,
                          backgroundColor: bigcommerceHash.trim() !== ""
                            ? "rgba(244, 87, 69, 1)"
                            : "rgba(244, 87, 69, 0.4)",
                          "&.Mui-disabled": {
                            backgroundColor: "rgba(244, 87, 69, 0.6)",
                            color: "#fff",
                          },
                        }}
                        onClick={handleInstallBigCommerce}
                        disabled={bigcommerceHash.trim() === ""}
                      >
                        Install Pixel
                      </Button>
                    </Box>
                  }
                  {googletagInstall &&
                    <Box>
                      <Box display="flex" justifyContent="space-between" sx={{ width: '100%', alignItems: 'center', paddingBottom: '1rem' }}>
                        <Box display="flex" gap="16px">
                          <Image src="install_gtm.svg" alt="Google tag install pixel" width={24} height={24} />
                          <Typography className='first-sub-title' sx={{ textAlign: 'left', '@media (max-width: 600px)': { pt: 2, pl: 2 } }}>
                            Install with GoogleTag
                          </Typography>
                        </Box>
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/how-do-i-install-maximiz-pixel-on-shopify-store"
                          target="_blank" className='first-sub-title' style={{ fontSize: "14px", color: "rgba(80, 82, 178, 1)" }}
                          sx={{ textDecoration: "underline", cursor: "pointer", '@media (max-width: 600px)': { pt: 2, pl: 2 } }}>
                          Tutorial
                        </Link>
                      </Box>
                      <Divider />
                      <GoogleTagPopup open={opengoogle} handleClose={() => setGoogleOpen(false)} />
                    </Box>
                  }
                  {wordpressInstall && 
                    <Box sx={{display: 'flex', flexDirection: "column", gap: 3}}> 
                      
                      <Box display="flex" justifyContent="space-between" sx={{ width: '100%', alignItems: 'center'}}>
                        <Box display="flex" gap="16px">
                        <Image src="install_cms2.svg" alt="WordPress install pixel" width={24} height={24}/>
                          <Typography className='first-sub-title' sx={{  textAlign: 'left'}}>
                            Install with WordPress
                          </Typography>
                        </Box>    
                        <Link href="https://maximizai.zohodesk.eu/portal/en/kb/articles/how-do-i-install-maximiz-pixel-on-shopify-store" 
                              target="_blank" className='first-sub-title' style={{fontSize: "14px", color: "rgba(80, 82, 178, 1)"}} 
                              sx={{ textDecoration: "underline", cursor: "pointer"}}>
                          Tutorial
                        </Link>
                      </Box>

                      <Divider />
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/1.svg' alt='1' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, p: 0, fontWeight: '500' }}>Add our offical Maximiz pixel plugin to your Wordpress site.</Typography>
                          </Box>
                          <Box/>
                          <Button component={Link} href="https://wordpress.org/plugins/maximiz/" target="_blank" variant="outlined" sx={{ backgroundColor: 'rgba(80, 82, 178, 1)', color: 'rgba(255, 255, 255, 1)', width: "110px", height: "40px", textTransform: 'none', padding: '1.2 3', border: '1px solid rgba(80, 82, 178, 1)', '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)' } }}>
                            <Typography className='second-sub-title' sx={{ fontSize: '14px !important', color: '#fff !important', textWrap: 'wrap' }}>Get plugin</Typography>
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/2.svg' alt='2' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, textAlign: 'left', p: 0, fontWeight: '500' }}>Enter your site ID:</Typography>
                          </Box>
                          <Box />
                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="pre"
                            sx={{ 
                              m: 0,
                              border: '1px solid rgba(228, 228, 228, 1)',
                              borderRadius: '10px',
                              maxHeight: '10em',
                              overflowY: 'auto',
                              position: 'relative',
                              padding: '0.75em',
                              maxWidth: '100%',
                              '@media (max-width: 600px)': {
                                maxHeight: '14em',
                              },
                            }}
                          >
                            <code
                              style={{
                                color: '#000000',
                                fontSize: '12px',
                                fontWeight: 600,
                                fontFamily: 'Nunito Sans',
                                textWrap: 'nowrap',
                              }}
                            >
                              {cmsData.pixel_client_id}
                            </code>

                          </Box>
                          <Box sx={{ display: 'flex', padding: '0px' }}>
                            <IconButton onClick={handleCopyToClipboard}>
                              <ContentCopyIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'grid', rowGap: 1, columnGap: 2, alignItems: 'center', padding: 0, gridTemplateColumns: "20px 1fr" }}>
                          <Image src='/3.svg' alt='3' width={20} height={20} />
                          <Box sx={{display: 'flex', alignItems: "center"}}>
                            <Typography className='first-sub-title' sx={{ ...maintext, p: 0, fontWeight: '500' }}>Verify if Maximiz is receiving data from your site</Typography>
                          </Box>
                          <Box />
                          <Button variant="outlined" sx={{ backgroundColor: 'rgba(255, 255, 255, 1)', width: "156px", textTransform: 'none', padding: '10px 24px', border: '1px solid rgba(80, 82, 178, 1)' }}>
                            <Typography sx={{ fontSize: '14px !important', fontWeight: "400", color: 'rgba(80, 82, 178, 1) !important', lineHeight: '22.4px', textAlign: 'left', textWrap: 'wrap' }}>View installation</Typography>
                          </Button>
                      </Box>

                      <Button
                        className='hyperlink-red'
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          opacity: wordPressId.trim() !== "" ? 1 : 0.6,
                          pointerEvents: wordPressId.trim() !== "" ? "auto" : "none",
                          mb: 2,
                          mt: 0,
                          backgroundColor: wordPressId.trim() !== ""
                            ? "rgba(244, 87, 69, 1)"
                            : "rgba(244, 87, 69, 0.4)",
                          "&.Mui-disabled": {
                            backgroundColor: "rgba(244, 87, 69, 0.6)",
                            color: "#fff",
                          },
                        }}
                        onClick={() => setActiveTab((prev) => prev + 1)}
                        disabled={wordPressId.trim() === ""}
                      >
                        Next
                      </Button>
                    </Box>
                  }
                  {!shopifyInstall && !manuallInstall && !bigcommerceInstall && !googletagInstall && !wordpressInstall &&
                    <>
                      <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                        Install the pixel to start collecting data
                      </Typography>
                      {errors.selectedEmployees && (
                        <Typography variant="body2" color="error">
                          {errors.selectedEmployees}
                        </Typography>
                      )}
                      <Box sx={{ ...styles.rolesButtons, display: "grid", gridTemplateColumns: "1fr 1fr", "@media (max-width: 450px)": { gridTemplateColumns: "1fr" }}}>
                        {method_installingPixel.map((range, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            onClick={() => handleMethodInstall(range.label)}
                            onTouchStart={() => handleMethodInstall(range.label)}
                            onMouseDown={() => handleMethodInstall(range.label)}
                            sx={{ ...getButtonRolesStyles(selectedMethodInstall === range.label), gap: "8px", justifyContent: "flex-start", p: "12px" }}
                          >
                            <Image src={range.src} alt="Method install pixel" width={24} height={24} />
                            <Typography className="form-input" style={{ color: "rgba(112, 112, 113, 1)", lineHeight: "19.6px" }}>{range.label}</Typography>
                          </Button>
                        ))}
                      </Box>
                      <Button
                        className='hyperlink-red'
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          opacity: isFormValidThird() ? 1 : 0.6,
                          mb: 2,
                          pointerEvents: isFormValidThird() ? "auto" : "none",
                          backgroundColor: isFormValidThird()
                            ? "rgba(244, 87, 69, 1)"
                            : "rgba(244, 87, 69, 0.4)",
                          "&.Mui-disabled": {
                            backgroundColor: "rgba(244, 87, 69, 0.6)",
                            color: "#fff",
                          },
                        }}
                        onClick={handleNextClick}
                        disabled={!isFormValidThird()}
                      >
                        Next
                      </Button>
                      <Button
                        className='hyperlink-red'
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          color: "rgba(244, 87, 69, 1)",
                          backgroundColor: "#fff",
                          "&:hover": {
                            backgroundColor: "#fff",
                            color: "rgba(244, 87, 69, 0.6)"
                          },
                        }}
                        onClick={handleSkip}
                      >
                        Skip
                      </Button>
                    </>
                  }

                  {(shopifyInstall || bigcommerceInstall || googletagInstall || wordpressInstall || manuallInstall) &&
                    <>
                      <Button
                        className='hyperlink-red'
                        fullWidth
                        variant="contained"
                        sx={{
                          ...styles.submitButton,
                          opacity: true ? 1 : 0.6,
                          pointerEvents: true ? "auto" : "none",
                          backgroundColor: "#fff",
                          boxShadow: "none",
                          color: true
                            ? "rgba(244, 87, 69, 0.4)"
                            : "rgba(244, 87, 69, 1)",
                          "&:hover": {
                            backgroundColor: "#fff",

                          },
                          "&.Mui-disabled": {
                            color: "rgba(244, 87, 69, 0.6)",
                            backgroundColor: "#fff",
                          },
                        }}
                        onClick={handleCancel}
                        disabled={false}
                      >
                        Cancel
                      </Button>
                    </>
                  }
                </>
              }
              {activeTab === 3 && (
                <>
                  <Typography variant="body1" className="first-sub-title" sx={styles.text}>
                    Choose the platform where you send your data
                  </Typography>
                  {errors.selectedEmployees && (  
                    <Typography variant="body2" color="error">
                      {errors.selectedEmployees}
                    </Typography>
                  )}
                  <Box sx={{ ...styles.rolesButtons, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", "@media (max-width: 450px)": { gridTemplateColumns: "1fr" } }}>
                    {integrations.map((range, index) => (
                      <Button
                        key={index}
                        variant="outlined"
                        onClick={() => handleIntegration(range.label)}
                        onTouchStart={() => handleIntegration(range.label)}
                        onMouseDown={() => handleIntegration(range.label)}
                        sx={{ ...getButtonRolesStyles(selectedIntegration === range.label), gap: "8px", justifyContent: "flex-start", p: "12px" }}
                      >
                        <Image src={range.src} alt="Integration item" width={24} height={24} />
                        <Typography className="form-input" style={{ color: "rgba(112, 112, 113, 1)", lineHeight: "19.6px" }}>{range.label}</Typography>
                      </Button>
                    ))}
                  </Box>
                  <MetaConnectButton
                      open={metaPopupOpen}
                      onClose={() => setMetaPopupOpen(false)}
                      isEdit={true}
                      onSave={handleSaveSettings}
                      boxShadow="rgba(0, 0, 0, 0.1)"
                    />
                  <KlaviyoIntegrationPopup
                    open={klaviyoPopupOpen}
                    handleClose={() => setKlaviyoPopupOpen(false)}
                    onSave={handleSaveSettings}
                    boxShadow="rgba(0, 0, 0, 0.1)"
                    initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'klaviyo')?.access_token}
                  />
                  <AttentiveIntegrationPopup
                    open={attentivePopupOpen}
                    handleClose={() => setAttentivePopupOpen(false)}
                    onSave={handleSaveSettings}
                    boxShadow="rgba(0, 0, 0, 0.1)"
                    initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'attentive')?.access_token}
                  />
                  <ZapierConnectPopup 
                    open={zapierPopupOpen} 
                    boxShadow="rgba(0, 0, 0, 0.1)"
                    handlePopupClose={() => setZapierPopupOpen(false)} 
                  />
                  <MailchimpConnect 
                    open={mailChimpPopupOpen} 
                    boxShadow="rgba(0, 0, 0, 0.1)"
                    handleClose={() => setMailchimpPopupOpen(false)} 
                    onSave={handleSaveSettings} 
                    initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'mailchimp')?.access_token}
                    />
                  <OmnisendConnect 
                    open={omnisendPopupOpen} 
                    handleClose={()=> setOmnisendPopupOpen(false)} 
                    onSave={handleSaveSettings} 
                    boxShadow="rgba(0, 0, 0, 0.1)" />
                  <SendlaneConnect 
                    open={sendlanePopupOpen} 
                    handleClose={() => setSendlanePopupOpen(false)} 
                    onSave={handleSaveSettings} 
                    boxShadow="rgba(0, 0, 0, 0.1)"
                    initApiKey={integrationsCredentials?.find(integration => integration.service_name === 'sendlane')?.access_token}
                    />
                  <SlackConnectPopup 
                    open={slackPopupOpen} 
                    handlePopupClose={() => setSlackPopupOpen(false)} 
                    boxShadow="rgba(0, 0, 0, 0.1)"
                    />

                  <Button
                    className='hyperlink-red'
                    fullWidth
                    variant="contained"
                    sx={{
                      ...styles.submitButton,
                      opacity: isFormValidFourth() ? 1 : 0.6,
                      mb: 2,
                      pointerEvents: isFormValidFourth() ? "auto" : "none",
                      backgroundColor: isFormValidFourth()
                        ? "rgba(244, 87, 69, 1)"
                        : "rgba(244, 87, 69, 0.4)",
                      "&.Mui-disabled": {
                        backgroundColor: "rgba(244, 87, 69, 0.6)",
                        color: "#fff",
                      },
                    }}
                    onClick={handleLastSlide}
                    disabled={!isFormValidFourth()}
                  >
                    Next
                  </Button>
                  <Button
                    className='hyperlink-red'
                    fullWidth
                    variant="contained"
                    sx={{
                      ...styles.submitButton,
                      color: "rgba(244, 87, 69, 1)",
                      backgroundColor: "#fff",
                      "&:hover": {
                        backgroundColor: "#fff",
                        color: "rgba(244, 87, 69, 0.6)"
                      },
                    }}
                    onClick={handleSkip}
                  >
                    Skip
                  </Button>
                </>
              )}
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
