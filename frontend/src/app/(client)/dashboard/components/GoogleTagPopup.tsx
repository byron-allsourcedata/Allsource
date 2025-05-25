import React, { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  FormLabel,
  Divider,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Typography,
  Link,
} from "@mui/material";
import axios from "axios";
import Image from "next/image";
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import { showErrorToast, showToast } from "@/components/ToastNotification";
import CloseIcon from "@mui/icons-material/Close";

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
}

const GoogleTagPopup: React.FC<PopupProps> = ({ open, handleClose }) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [accounts, setAccounts] = useState<GTMAccount[]>([]);
  const [containers, setContainers] = useState<GTMContainer[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedContainer, setSelectedContainer] = useState<string>("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");

  useEffect(() => {
    const handleRedirect = async () => {
      const query = new URLSearchParams(window.location.search);
      const authorizationCode = query.get("code");
      if (authorizationCode) {
        try {
          const tokenResponse = await exchangeCodeForToken(authorizationCode);
          const accessToken = tokenResponse.access_token;
          setSession({ token: accessToken });
          fetchAccounts(accessToken);
        } catch (error) {
        } finally {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    };

    handleRedirect();
  }, []);

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
    }
  };

  useEffect(() => {
    const fetchContainers = async () => {
      if (selectedAccount && session?.token) {
        try {
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
        }
      }
    };

    fetchContainers();
  }, [selectedAccount, session?.token]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (selectedAccount && selectedContainer && session?.token) {
        try {
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
        }
      }
    };

    fetchWorkspaces();
  }, [selectedAccount, selectedContainer, session?.token]);

  const fetchAccounts = async (accessToken: string) => {
    try {
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
          await axios.delete(
            `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags/${existingTag.tagId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }

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
    } catch (e) {
      if (axios.isAxiosError(e)) {
        showErrorToast(e.message);
      } else if (e instanceof Error) {
        showErrorToast(e.message);
      } else {
        showErrorToast("An unknown error occurred.");
      }
    } finally {
      setSession(null)
      setAccounts([])
      setContainers([])
      setSelectedAccount("")
      setSelectedContainer("")
      setWorkspaces([])
      setSelectedWorkspace("")
      setLoading(false);
      handleClose();
    }
  };

  const exchangeCodeForToken = async (authorizationCode: string) => {
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.search = "";
      const redirectUri = currentUrl.href;
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
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
        "https://www.googleapis.com/auth/tagmanager.edit.containers",
        "https://www.googleapis.com/auth/tagmanager.manage.accounts",
        "https://www.googleapis.com/auth/tagmanager.publish",
        "https://www.googleapis.com/auth/tagmanager.edit.containerversions",
      ].join(" ");
      // const currentUrl = new URL(window.location.href);
      // currentUrl.search = "";
      const redirectUri = `${baseUrl}/leads`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth
                ?client_id=${clientId}
                &redirect_uri=${encodeURIComponent(redirectUri)}
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
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 3,
          mt: 2,
          borderRadius: 2,
          border: "1px solid rgba(231, 231, 233, 1)",
          width: "100%",
          boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Box>
          <Box>
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
                Connect Google
              </Typography>
            </Box>
            <Button
              onClick={redirectToGoogleAuth}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "40%",
                height: "48px",
                backgroundColor: "#fff",
                color: "#202124",
                border: "1px solid #E4E4E4",
                borderRadius: "4px",
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
              }}
            >
              <Image
                src="/google-icon.svg"
                alt="Google logo"
                height={20}
                width={20}
              />
              <Typography
                sx={{
                  lineHeight: "19.6px",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Nunito Sans",
                }}
              >
                Sign in with Google
              </Typography>
            </Button>
          </Box>
          {session && (
            <Box>
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
                <Image src="/2.svg" alt="1" width={20} height={20} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "Nunito Sans, sans-serif",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "rgba(33, 43, 54, 0.87)",
                    mb: "1.2em",
                    textAlign: "left",
                    lineHeight: "21.82px",
                    letterSpacing: "0.5px",
                    "@media (max-width: 600px)": {
                      fontSize: "18px",
                      textAlign: "left",
                      mb: "1em",
                    },
                  }}
                >
                  Setup GTM connection
                </Typography>
              </Box>
              <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                <InputLabel
                  sx={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "rgba(33, 43, 54, 0.87)",
                    "&.Mui-focused": {
                      color: "rgba(33, 43, 54, 0.87)",
                    },
                  }}
                >
                  Select an account
                </InputLabel>
                <Select
                  value={selectedAccount || ""}
                  onChange={(e) => {
                    const selectedValue = e.target.value as string;
                    setSelectedAccount(selectedValue);
                  }}
                  label="Account"
                  sx={{
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    border: "1px solid rgba(224, 224, 224, 1)",
                    "&:focus": {
                      borderColor: "rgba(56, 152, 252, 1)",
                      boxShadow: "0 0 0 2px rgba(80, 82, 178, 0.2)",
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
              <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                <InputLabel
                  sx={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "rgba(33, 43, 54, 0.87)",
                    "&.Mui-focused": {
                      color: "rgba(33, 43, 54, 0.87)",
                    },
                  }}
                >
                  Select domain
                </InputLabel>
                <Select
                  value={selectedContainer}
                  onChange={(e) =>
                    setSelectedContainer(e.target.value as string)
                  }
                  label="Container"
                  sx={{
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    border: "1px solid rgba(224, 224, 224, 1)",
                    "&:focus": {
                      borderColor: "rgba(56, 152, 252, 1)",
                      boxShadow: "0 0 0 2px rgba(80, 82, 178, 0.2)",
                    },
                  }}
                >
                  <MenuItem value="">Select a container</MenuItem>
                  {containers.map((container) => (
                    <MenuItem
                      key={container.containerId}
                      value={container.containerId}
                    >
                      {container.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {accounts.length === 0 && (
                <Typography
                  color="error"
                  variant="body2"
                  sx={{ mb: 2, fontSize: "14px", fontWeight: "400" }}
                >
                  No accounts available. Please check your Google Tag Manager
                  setup.
                </Typography>
              )}

              {containers.length === 0 && selectedAccount && (
                <Typography
                  color="error"
                  variant="body2"
                  sx={{ mb: 2, fontSize: "14px", fontWeight: "400" }}
                >
                  No containers available for the selected account. Please try
                  another account.
                </Typography>
              )}

              <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
                <InputLabel
                  sx={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "rgba(33, 43, 54, 0.87)",
                    "&.Mui-focused": {
                      color: "rgba(33, 43, 54, 0.87)",
                    },
                  }}
                >
                  Select workspace
                </InputLabel>
                <Select
                  value={selectedWorkspace || ""}
                  onChange={(e) =>
                    setSelectedWorkspace(e.target.value as string)
                  }
                  label="Workspace"
                  sx={{
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    border: "1px solid rgba(224, 224, 224, 1)",
                    "&:focus": {
                      borderColor: "rgba(56, 152, 252, 1)",
                      boxShadow: "0 0 0 2px rgba(80, 82, 178, 0.2)",
                    },
                  }}
                >
                  <MenuItem value="">Select a workspace</MenuItem>
                  {workspaces.map((workspace) => (
                    <MenuItem
                      key={workspace.workspaceId}
                      value={workspace.workspaceId}
                    >
                      {workspace.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
                  variant="outlined"
                  color="secondary"
                  onClick={handleClose}
                  sx={{
                    width: "92px",
                    height: "40px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    textTransform: "none",
                    border: "1px solid rgba(56, 152, 252, 1)",
                    color: "rgba(56, 152, 252, 1)",
                    transition: "background-color 0.3s, border-color 0.3s",
                    "&:hover": {
                      backgroundColor: "rgba(80, 82, 178, 0.1)",
                      borderColor: "rgba(80, 82, 178, 0.8)",
                    },
                    "&:focus": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(80, 82, 178, 0.3)",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateAndSendTag}
                  disabled={
                    !selectedAccount || !selectedContainer || !selectedWorkspace
                  }
                  sx={{
                    width: "92px",
                    height: "40px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    textTransform: "none",
                    backgroundColor: "#0853C4",
                    color: "#ffffff",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      backgroundColor: "#06479F",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
                    },
                    "&:focus": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(8, 83, 196, 0.3)",
                    },
                  }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default GoogleTagPopup;
