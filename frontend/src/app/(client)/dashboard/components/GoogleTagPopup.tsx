import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import axios from "axios";
import Image from "next/image";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { showErrorToast, showToast } from "@/components/ToastNotification";
import ConfirmDialog from "@/components/ConfirmDialog";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";

interface GTMContainer {
  containerId: string;
  name: string;
}

interface GTMAccount {
  accountId: string;
  name: string;
}

interface PopupProps {
  open: boolean;
  handleClose: () => void;
  onInstallStatusChange: (status: "success" | "failed") => void;
}

const inputLabelStyles = {
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: "'Nunito Sans', sans-serif",
  color: "#707071",
  "&.MuiInputLabel-shrink": {
    transform: "translate(14px, -9px) scale(1)",
    fontSize: "12px",
    fontWeight: 600,
    color: "#707071",
  },
};

type GoogleUser = {
  email: string;
  email_verified: boolean;
  given_name: string;
  name: string;
  picture: string;
  sub: string;
};

const GoogleTagPopup: React.FC<PopupProps> = ({ open, handleClose, onInstallStatusChange }) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [accounts, setAccounts] = useState<GTMAccount[]>([]);
  const [containers, setContainers] = useState<GTMContainer[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedContainer, setSelectedContainer] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [tagIdToDelete, setTagIdToDelete] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<GoogleUser | null>(null);
  const [isInstallComplete, setInstallCompleted] = useState(false);


  const fetchUserInfo = async (accessToken: string) => {
    try {
      setIsLoading(true)
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setUserInfo(response.data);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.log(e.message);
      } else if (e instanceof Error) {
        console.log(e.message);
      } else {
        showErrorToast("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      const query = new URLSearchParams(window.location.search);
      const authorizationCode = query.get("code");
      if (authorizationCode) {
        try {
          const tokenResponse = await exchangeCodeForToken(authorizationCode);
          const accessToken = tokenResponse.access_token;
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          url.searchParams.delete("scope");
          url.searchParams.delete("authuser");
          url.searchParams.delete("prompt");
          window.history.replaceState({}, document.title, url.toString());
          if (accessToken) {
            setSession({ token: accessToken });
            fetchAccounts(accessToken);
            fetchUserInfo(accessToken);
          }
        } catch (error) {
          console.log(error)
        }
      }
    };

    handleRedirect();
  }, []);

  const handleDeleteClick = (tagId: string) => {
    setTagIdToDelete(tagId);
    setOpenConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagIdToDelete) return;

    const accessToken = session?.token || "";
    const accountId = selectedAccount;
    const containerId = selectedContainer;
    const workspaceId = selectedWorkspace;

    try {
      setIsLoading(true)
      await axios.delete(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagIdToDelete}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      showToast("Tag deleted successfully!");
      handleCreateAndSendTag()
    } catch (error) {
      console.error('Error when deleting a tag:', error);
      showErrorToast(`Failed to delete tag: ${error}`);
    } finally {
      setIsLoading(false)
      setOpenConfirm(false);
      setTagIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirm(false);
    setTagIdToDelete(null);
  };

  const fetchExistingTriggers = async (
    accessToken: string,
    accountId: string,
    containerId: string,
    workspaceId: string
  ) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data.trigger || [];
    } catch (error) {
      throw error;
    }
  };

  const findTriggerIdByName = (triggers: any[], triggerName: string) => {
    const trigger = triggers.find((t) => t.name === triggerName);
    return trigger ? trigger.triggerId : null;
  };

  const createAllPagesTrigger = async (
    accessToken: string,
    accountId: string,
    containerId: string,
    workspaceId: string
  ) => {
    const triggerData = {
      name: "All Pages Trigger for Allsource pixel script",
      type: "pageview",
      filter: [],
    };

    try {
      setIsLoading(true)
      const response = await axios.post(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`,
        triggerData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data.triggerId;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        showErrorToast(e.message);
      } else if (e instanceof Error) {
        showErrorToast(e.message);
      } else {
        showErrorToast("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    const fetchContainers = async () => {
      if (selectedAccount && session?.token) {
        try {
          setIsLoading(true)
          const response = await axios.get(
            `https://www.googleapis.com/tagmanager/v2/accounts/${selectedAccount}/containers`,
            { headers: { Authorization: `Bearer ${session.token}` } }
          );
          setContainers(response.data.container || []);
        } catch (e) {
          if (axios.isAxiosError(e)) {
            showErrorToast(e.message);
          } else if (e instanceof Error) {
            showErrorToast(e.message);
          } else {
            showErrorToast("An unknown error occurred.");
          }
        } finally {
          setIsLoading(false)
        }
      }
    };

    fetchContainers();
  }, [selectedAccount, session?.token]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (selectedAccount && selectedContainer && session?.token) {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `https://www.googleapis.com/tagmanager/v2/accounts/${selectedAccount}/containers/${selectedContainer}/workspaces`,
            { headers: { Authorization: `Bearer ${session.token}` } }
          );
          setWorkspaces(response.data.workspace || []);
        } catch (e) {
          if (axios.isAxiosError(e)) {
            showErrorToast(e.message);
          } else if (e instanceof Error) {
            showErrorToast(e.message);
          } else {
            showErrorToast("An unknown error occurred.");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWorkspaces();
  }, [selectedAccount, selectedContainer, session?.token]);

  const fetchAccounts = async (accessToken: string) => {
    try {
      setIsLoading(true)
      const response = await axios.get(
        "https://www.googleapis.com/tagmanager/v2/accounts",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setAccounts(response.data.account || []);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        showErrorToast(e.message);
      } else if (e instanceof Error) {
        showErrorToast(e.message);
      } else {
        showErrorToast("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false)
    }
  };

  const updateTagWithTrigger = async (
    accessToken: string,
    accountId: string,
    containerId: string,
    workspaceId: string,
    tagId: string,
    triggerId: string
  ) => {
    try {
      const tagResponse = await axios.get(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const tag = tagResponse.data;

      tag.firingTriggerId = [triggerId];

      await axios.put(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${tagId}`,
        tag,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
      } else {
        if (error instanceof Error) {
        }
      }
      throw new Error("Failed to update tag with trigger.");
    }
  };

  const submitAndPublishWorkspace = async (
    accessToken: string,
    accountId: string,
    containerId: string,
    workspaceId: string
  ) => {
    try {
      const commitResponse = await axios.post(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}:create_version`,
        {
          name: "Allsource: Auto Commit and Publish",
          notes: "Allsource: Automatically committed and published via API",
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const containerVersionId =
        commitResponse.data.containerVersion.containerVersionId;
      const publishResponse = await axios.post(
        `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/versions/${containerVersionId}:publish`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      showToast("Changes submitted and published successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data);
      } else if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      showErrorToast("Failed to submit and publish workspace.");
    }
  };

  const handleCreateAndSendTag = async () => {
    setLoading(true);
    try {
      const accessToken = session?.token || "";
      const accountId = selectedAccount;
      const containerId = selectedContainer;
      const workspaceId = selectedWorkspace;

      if (!accountId || !containerId || !workspaceId) {
        showErrorToast("Please select account, container, and workspace.");
        return;
      }
      const triggers = await fetchExistingTriggers(
        accessToken,
        accountId,
        containerId,
        workspaceId
      );
      let triggerId = findTriggerIdByName(
        triggers,
        "All Pages Trigger for Allsource pixel script"
      );
      if (!triggerId) {
        triggerId = await createAllPagesTrigger(
          accessToken,
          accountId,
          containerId,
          workspaceId
        );
      }
      let manualResponse = await axiosInterceptorInstance.get(
        `/install-pixel/manually`
      );
      let pixelCode = manualResponse.data.manual;
      const tagData = {
        name: "Allsource pixel script",
        type: "html",
        parameter: [
          {
            key: "html",
            type: "template",
            value: pixelCode,
          },
        ],
      };
      try {
        const existingTagsResponse = await axios.get(
          `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const existingTags = existingTagsResponse.data.tag || [];
        const existingTag = existingTags.find(
          (tag: any) => tag.name === "Allsource pixel script"
        );

        if (existingTag?.tagId) {
          handleDeleteClick(existingTag.tagId);
          return
        } else {
          const tagResponse = await axios.post(
            `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`,
            tagData,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const tagId = tagResponse.data.tagId;
          await updateTagWithTrigger(
            accessToken,
            accountId,
            containerId,
            workspaceId,
            tagId,
            triggerId
          );
          showToast("Tag created and sent successfully!");
          await submitAndPublishWorkspace(
            accessToken,
            accountId,
            containerId,
            workspaceId
          );
        }
      } catch (e) {
        if (axios.isAxiosError(e)) {
          showErrorToast(e.message);
        } else if (e instanceof Error) {
          showErrorToast(e.message);
        } else {
          showErrorToast("An unknown error occurred.");
        }
      }
      handleClose();
      setSession(null)
      setInstallCompleted(true);
      onInstallStatusChange("success");
      setAccounts([])
      setContainers([])
      setSelectedAccount("")
      setSelectedContainer("")
      setWorkspaces([])
      setSelectedWorkspace("")
    } catch (e) {
      if (axios.isAxiosError(e)) {
        showErrorToast(e.message);
      } else if (e instanceof Error) {
        showErrorToast(e.message);
      } else {
        showErrorToast("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const exchangeCodeForToken = async (authorizationCode: string) => {
    try {
      const currentUrl = new URL(window.location.href);
      const pixel = currentUrl.searchParams.get('pixel');
      currentUrl.search = '';
      if (pixel !== null) {
        currentUrl.searchParams.set('pixel', pixel);
      }
      const cleanedUrl = currentUrl.toString();
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: cleanedUrl,
        grant_type: "authorization_code",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const redirectToGoogleAuth = async () => {
    try {
      const scope = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/tagmanager.edit.containers",
        "https://www.googleapis.com/auth/tagmanager.manage.accounts",
        "https://www.googleapis.com/auth/tagmanager.publish",
        "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
      ].join(" ");
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('pixel')) {
        const pixelValue = currentUrl.searchParams.get('pixel')!;
        currentUrl.search = '';
        currentUrl.searchParams.set('pixel', pixelValue);
      } else {
        currentUrl.search = '';
      }
      const newUrl = currentUrl.href;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth
                ?client_id=${clientId}
                &redirect_uri=${encodeURIComponent(newUrl)}
                &response_type=code
                &scope=${encodeURIComponent(scope)}
                &access_type=offline
                &prompt=select_account`.replace(/\s+/g, "");

      window.open(authUrl, "_blank");
    } catch (error) {
      showErrorToast("Failed to log in.");
    }
  };

  return (
    <>
      {isLoading && <CustomizedProgressBar />}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              border: "8px solid #f3f3f3",
              borderTop: "8px solid #3498db",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
        </Box>
      )}
      <ConfirmDialog
        open={openConfirm}
        title="Confirmation of Google Tag deletion"
        description="This Google Tag already has an active pixel. Reinstalling will remove the existing configuration and require event re-setup. Are you sure you want to proceed?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 3,
          mt: 2,
          borderRadius: 2,
          border: "1px solid rgba(231, 231, 233, 1)",
          width: "100%",
          boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.08)",
          "@media (max-width: 600px)": {
            p: 1,
            flexDirection: "column",
            m: 0,
          },
          "@media (max-width: 400px)": {
            maxWidth: "100%",
            width: "100%",
            padding: "4px",
          },
        }}
      >
        <Box>
          {!isInstallComplete &&
            <Box
              sx={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
                pb: 1,
                justifyContent: "start",
                "@media (max-width: 600px)": {
                  flexDirection: "column",
                },
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
                  color: "#202124",
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
                Connect Google
              </Typography>
            </Box>
          }
          {userInfo ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "start",
                padding: "12px",
                border: "1px solid #E4E4E4",
                borderRadius: "4px",
                width: "100%",
                maxWidth: "45%",
                marginBottom: isInstallComplete ? "16px" : "24px",
                marginTop: isInstallComplete ? "0px" : "15px",
                "@media (max-width: 600px)": {
                  maxWidth: "100%",
                  width: "100%",
                  padding: "8px",
                },
                "@media (max-width: 400px)": {
                  maxWidth: "100%",
                  width: "100%",
                  padding: "4px",
                },

              }}
            >

              {/* Profile Picture */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  pl: "8px",
                }}
              >
                <img
                  src={userInfo.picture}
                  alt="Profile"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <Box>
                  {/* Account Name */}
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: "500px",
                      fontFamily: "'Nunito Sans', sans-serif",
                      color: "#3C4043",
                    }}
                  >
                    {userInfo.name}
                  </Typography>
                  {/* Account Email */}
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "400px",
                      fontFamily: "'Nunito Sans', sans-serif",
                      color: "#5F6368",
                    }}
                  >
                    {userInfo.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box>
              <Button
                onClick={redirectToGoogleAuth}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "38%",
                  maxHeight: "48px",
                  borderRadius: "4px",
                  border: "1px solid #E4E4E4",
                  height: "48px",
                  backgroundColor: "#fff",
                  color: "#202124",
                  fontSize: "14px",
                  fontFamily: "'Nunito Sans', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                  mt: "20px",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#f1f3f4",
                  },
                  "&:active": {
                    backgroundColor: "#e8eaed",
                  },
                  "@media (max-width: 600px)": {
                    width: "100%",
                  },
                }}
              >
                <Image
                  src="/google-icon.svg"
                  alt="Google logo"
                  height={24}
                  width={24}
                />
                <Typography
                  sx={{
                    lineHeight: "19.6px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#202124",
                    fontFamily: "Nunito Sans",
                  }}
                >
                  Sign in with Google
                </Typography>
              </Button>
            </Box>
          )}

          {session && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                  my: 2,
                }}
              >
                <Image src="/2.svg" alt="1" width={20} height={20} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Nunito Sans, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    justifyContent: "center",
                    alignItems: "center",
                    color: '#202124',
                    lineHeight: '21.82px',
                    letterSpacing: '0.5px',
                    '@media (max-width: 600px)': {
                      fontSize: '18px',
                    },
                  }}
                >
                  Setup GTM connection
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                  maxWidth: "44%",
                  "@media (max-width: 600px)": {
                    maxWidth: "100%",
                  },
                }}
              >
                {/* Select Account */}
                <FormControl fullWidth>
                  <InputLabel sx={inputLabelStyles}>Select an account</InputLabel>
                  <Select
                    labelId="account-label"
                    label="Select an account"
                    value={selectedAccount || ""}
                    onChange={(e) => setSelectedAccount(e.target.value as string)}
                    IconComponent={(props) => (
                      <ExpandMoreIcon
                        {...props}
                        sx={{
                          fontSize: 30,
                          color: "#656565",
                        }}
                      />
                    )}
                    sx={{
                      backgroundColor: "#ffffff",
                      borderRadius: "4px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(224, 224, 224, 1)",
                        borderWidth: "1px",
                        transition: "all 0.2s ease-in-out",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(56, 152, 252, 1)",
                        transform: "translateY(-1px)",
                      },

                      "& .MuiSelect-icon": {
                        right: 12,
                      },
                    }}
                  >
                    <MenuItem value="">Select an account</MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.accountId} value={account.accountId}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Select Container */}
                <FormControl fullWidth>
                  <InputLabel sx={inputLabelStyles}>Select Container</InputLabel>
                  <Select
                    labelId="select-container"
                    label="Select Container"
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value as string)}
                    IconComponent={(props) => (
                      <ExpandMoreIcon
                        {...props}
                        sx={{
                          fontSize: 30,
                          color: "#656565",
                        }}
                      />
                    )}
                    sx={{
                      backgroundColor: "#ffffff",
                      borderRadius: "4px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(224, 224, 224, 1)",
                        borderWidth: "1px",
                        transition: "all 0.2s ease-in-out",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(56, 152, 252, 1)",
                        transform: "translateY(-1px)",
                      },

                      "& .MuiSelect-icon": {
                        right: 12,
                      },
                    }}
                  >
                    <MenuItem value="">Select a container</MenuItem>
                    {containers.map((container) => (
                      <MenuItem key={container.containerId} value={container.containerId}>
                        {container.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Select Workspace */}
                <FormControl fullWidth>
                  <InputLabel sx={inputLabelStyles}>Select workspace</InputLabel>
                  <Select
                    labelId="select-workspace"
                    label="Select workspace"
                    value={selectedWorkspace || ""}
                    onChange={(e) => setSelectedWorkspace(e.target.value as string)}
                    IconComponent={(props) => (
                      <ExpandMoreIcon
                        {...props}
                        sx={{
                          fontSize: 30,
                          color: "#656565",
                        }}
                      />
                    )}
                    sx={{
                      backgroundColor: "#ffffff",
                      borderRadius: "4px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(224, 224, 224, 1)",
                        borderWidth: "1px",
                        transition: "all 0.2s ease-in-out",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(56, 152, 252, 1)",
                        transform: "translateY(-1px)",
                      },

                      "& .MuiSelect-icon": {
                        right: 12,
                      },
                    }}
                  >
                    <MenuItem value="">Select a workspace</MenuItem>
                    {workspaces.map((workspace) => (
                      <MenuItem key={workspace.workspaceId} value={workspace.workspaceId}>
                        {workspace.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Errors */}
                {accounts.length === 0 && (
                  <Typography color="error" variant="body2">
                    No accounts available. Please check your Google Tag Manager setup.
                  </Typography>
                )}

                {(containers.length === 0 && selectedAccount !== "" && !isLoading) && (
                  <Typography color="error" variant="body2">
                    No containers available for the selected account. Please try another account.
                  </Typography>
                )}
              </Box>

              {selectedAccount && selectedContainer && selectedWorkspace && (
                <Box
                  sx={{
                    mt: 2,
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    bottom: 0,
                    right: "3%",
                    top: "91%",
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateAndSendTag}
                    disabled={
                      !selectedAccount || !selectedContainer || !selectedWorkspace
                    }
                    sx={{
                      textTransform: "none",
                      background: "rgba(56, 152, 252, 1)",
                      color: "#fff",
                      fontFamily: "Nunito Sans",
                      fontWeight: 400,
                      fontSize: "14px",
                      padding: "0.75em 1.5em",
                      lineHeight: "normal",
                      "@media (max-width: 600px)": {
                        width: "100%",
                        fontSize: "16px",
                        padding: "0.625em 1.25em",
                      },
                      "&:hover": {
                        backgroundColor: "rgba(56, 152, 252, 1)",
                        boxShadow: 2,
                      },
                    }}
                  >
                    Send
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {isInstallComplete &&
            <Box>
              <Typography sx={{
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: "170%",
                letterSpacing: "0.5%",
                color: "rgba(74, 158, 79, 1)"
              }}
              >
                ✓ The script has been successfully installed on your website via Google Tag Manager.
              </Typography>
            </Box>
          }
        </Box>
      </Box>
    </>
  );
};

export default GoogleTagPopup;
