import React, {useEffect, useState} from 'react';
import {GoogleLogin} from '@react-oauth/google';
import {Box, Button, FormControl, IconButton, InputLabel, MenuItem, Modal, Select, Typography} from '@mui/material';
import axios from 'axios';
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";
import {showErrorToast, showToast} from "@/components/ToastNotification";
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

interface GoogleLoginResponse {
    credential?: string;
}

const GoogleTagPopup: React.FC<PopupProps> = ({open, handleClose}) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
    const dashboard_url: string = process.env.NEXT_PUBLIC_API_DASHBOARD_URL || 'http://localhost:8000';

    const [session, setSession] = useState<{ token: string } | null>(null);
    const [accounts, setAccounts] = useState<GTMAccount[]>([]);
    const [containers, setContainers] = useState<GTMContainer[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedContainer, setSelectedContainer] = useState<string>('');
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

    useEffect(() => {
        const handleRedirect = async () => {
            const query = new URLSearchParams(window.location.search);
            const authorizationCode = query.get('code');
            if (authorizationCode) {
                try {
                    const tokenResponse = await exchangeCodeForToken(authorizationCode);
                    const accessToken = tokenResponse.access_token;
                    setSession({token: accessToken});
                    fetchAccounts(accessToken);
                } catch (error) {
                    console.error('Error handling redirect:', error);
                } finally {
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                }
            }
        };

        handleRedirect();
    }, []);


    useEffect(() => {
        const fetchContainers = async () => {
            if (selectedAccount && session?.token) {
                try {
                    const response = await axios.get(
                        `https://www.googleapis.com/tagmanager/v2/accounts/${selectedAccount}/containers`,
                        {headers: {Authorization: `Bearer ${session.token}`}}
                    );
                    setContainers(response.data.container || []);
                } catch (error) {
                    console.error('Error fetching containers:', error);
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
                        {headers: {Authorization: `Bearer ${session.token}`}}
                    );
                    setWorkspaces(response.data.workspace || []);
                } catch (error) {
                    console.error('Error fetching workspaces:', error);
                }
            }
        };

        fetchWorkspaces();
    }, [selectedAccount, selectedContainer, session?.token]);

    const fetchAccounts = async (accessToken: string) => {
        try {
            const response = await axios.get('https://www.googleapis.com/tagmanager/v2/accounts', {
                headers: {Authorization: `Bearer ${accessToken}`}
            });
            setAccounts(response.data.account || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleCreateAndSendTag = async () => {
        try {
            const accessToken = session?.token || '';
            const accountId = selectedAccount;
            const containerId = selectedContainer;
            const workspaceId = selectedWorkspace;

            if (!accountId || !containerId || !workspaceId) {
                showErrorToast('Please select account, container, and workspace.')
                return;
            }
            let manualResponse = await axiosInterceptorInstance.get(`/install-pixel/manually`);
            let pixelCode = manualResponse.data.manual;
            const tagData = {
                name: 'Pixel script',
                type: 'html',
                parameter: [
                    {
                        key: 'html',
                        type: 'template',
                        value: pixelCode
                    }
                ]
            };

            await axios.post(
                `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`,
                tagData,
                {headers: {Authorization: `Bearer ${accessToken}`}}
            );
            showToast('Tag created and sent successfully!')
            handleClose();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error creating and sending tag:', error.message);
                console.error('Response Data:', error.response?.data);
                console.error('Response Status:', error.response?.status);
            } else {
                console.error('Unexpected error:', error);
                if (error instanceof Error) {
                    console.error('Error message:', error.message);
                }
            }
            showErrorToast('Failed to create and send tag.')
        }
    };

    const exchangeCodeForToken = async (authorizationCode: string) => {
        try {
            const response = await axios.post('https://oauth2.googleapis.com/token', {
                code: authorizationCode,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: dashboard_url,
                grant_type: 'authorization_code'
            });
            return response.data;
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            throw error;
        }
    };
    const handleLoginSuccess = async (response: GoogleLoginResponse) => {
        try {
            if (response.credential) {
                setSession({token: response.credential});
                const redirectUri = dashboard_url;
                const scope = 'https://www.googleapis.com/auth/tagmanager.edit.containers';
                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
            } else {
                showErrorToast('Account data not available')
            }
        } catch (error) {
            console.error('Error during Google login:', error);
            showErrorToast('Failed to log in.')
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            sx={{overflow: 'hidden'}}
        >
            <Box
                sx={{
                    position: 'fixed',
                    top: '0',
                    right: '0',
                    width: '40%',
                    height: '100%',
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    transition: 'transform 0.3s ease-in-out',
                    transform: open ? 'translateX(0)' : 'translateX(100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: '1em',
                        alignItems: 'center',
                        mb: '1em',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: 'Nunito, sans-serif',
                            fontSize: '22px',
                            fontWeight: 'bold',
                            color: 'rgba(33, 43, 54, 1)',
                            lineHeight: '1.4',
                            letterSpacing: '0.5px',
                            textShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                            textAlign: 'center',
                            textWrap: 'nowrap',
                            mb: '1em',
                            '@media (max-width: 600px)': {
                                fontSize: '18px',
                                textAlign: 'left',
                            },
                        }}
                    >
                        Welcome to GTM Integration Page
                    </Typography>

                    <IconButton onClick={handleClose}>
                        <CloseIcon/>
                    </IconButton>
                </Box>
                {!session ? (
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={() => showErrorToast('Failed to log in.')}
                        ux_mode="popup"
                    />
                ) : (
                    <>
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: 'Nunito, sans-serif',
                                fontSize: '20px',
                                fontWeight: '600',
                                color: 'rgba(33, 43, 54, 0.87)',
                                mb: '1.2em',
                                textAlign: 'center',
                                lineHeight: '1.5',
                                letterSpacing: '0.5px',
                                '@media (max-width: 600px)': {
                                    fontSize: '18px',
                                    textAlign: 'left',
                                    mb: '1em',
                                },
                            }}
                        >
                            Select GTM Account and Container
                        </Typography>

                        <FormControl fullWidth sx={{mb: 2, mt: 1}}>
                            <InputLabel sx={{
                                fontSize: '16px',
                                fontWeight: '500',
                                color: 'rgba(33, 43, 54, 0.87)'
                            }}>Account</InputLabel>
                            <Select
                                value={selectedAccount || ''}
                                onChange={(e) => {
                                    const selectedValue = e.target.value as string;
                                    setSelectedAccount(selectedValue);
                                }}
                                label="Account"
                                sx={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(224, 224, 224, 1)',
                                    '&:focus': {
                                        borderColor: 'rgba(80, 82, 178, 1)',
                                        boxShadow: '0 0 0 2px rgba(80, 82, 178, 0.2)',
                                    },
                                }}
                            >
                                <MenuItem value="">Select an account</MenuItem>
                                {accounts.map(account => (
                                    <MenuItem key={account.accountId} value={account.accountId}>
                                        {account.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{mb: 2, mt: 1}}>
                            <InputLabel sx={{
                                fontSize: '16px',
                                fontWeight: '500',
                                color: 'rgba(33, 43, 54, 0.87)'
                            }}>Container</InputLabel>
                            <Select
                                value={selectedContainer}
                                onChange={e => setSelectedContainer(e.target.value as string)}
                                label="Container"
                                sx={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(224, 224, 224, 1)',
                                    '&:focus': {
                                        borderColor: 'rgba(80, 82, 178, 1)',
                                        boxShadow: '0 0 0 2px rgba(80, 82, 178, 0.2)',
                                    },
                                }}
                            >
                                <MenuItem value="">Select a container</MenuItem>
                                {containers.map(container => (
                                    <MenuItem key={container.containerId} value={container.containerId}>
                                        {container.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {accounts.length === 0 && (
                            <Typography color="error" variant="body2" sx={{mb: 2, fontSize: '14px', fontWeight: '400'}}>
                                No accounts available. Please check your Google Tag Manager setup.
                            </Typography>
                        )}

                        {containers.length === 0 && selectedAccount && (
                            <Typography color="error" variant="body2" sx={{mb: 2, fontSize: '14px', fontWeight: '400'}}>
                                No containers available for the selected account. Please try another account.
                            </Typography>
                        )}

                        <FormControl fullWidth sx={{mb: 2, mt: 1}}>
                            <InputLabel sx={{
                                fontSize: '16px',
                                fontWeight: '500',
                                color: 'rgba(33, 43, 54, 0.87)'
                            }}>Workspace</InputLabel>
                            <Select
                                value={selectedWorkspace || ''}
                                onChange={(e) => setSelectedWorkspace(e.target.value as string)}
                                label="Workspace"
                                sx={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(224, 224, 224, 1)',
                                    '&:focus': {
                                        borderColor: 'rgba(80, 82, 178, 1)',
                                        boxShadow: '0 0 0 2px rgba(80, 82, 178, 0.2)',
                                    },
                                }}
                            >
                                <MenuItem value="">Select a workspace</MenuItem>
                                {workspaces.map(workspace => (
                                    <MenuItem key={workspace.workspaceId} value={workspace.workspaceId}>
                                        {workspace.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{mt: 2, width: '100%', display: 'flex', gap: 1}}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreateAndSendTag}
                                sx={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    textTransform: 'none',
                                    backgroundColor: '#0853C4',
                                    color: '#ffffff',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    transition: 'background-color 0.3s, box-shadow 0.3s',
                                    '&:hover': {
                                        backgroundColor: '#06479F',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
                                    },
                                    '&:focus': {
                                        outline: 'none',
                                        boxShadow: '0 0 0 2px rgba(8, 83, 196, 0.3)',
                                    },
                                }}
                            >
                                Send
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleClose}
                                sx={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    textTransform: 'none',
                                    border: '1px solid rgba(80, 82, 178, 1)',
                                    color: 'rgba(80, 82, 178, 1)',
                                    transition: 'background-color 0.3s, border-color 0.3s',
                                    '&:hover': {
                                        backgroundColor: 'rgba(80, 82, 178, 0.1)',
                                        borderColor: 'rgba(80, 82, 178, 0.8)',
                                    },
                                    '&:focus': {
                                        outline: 'none',
                                        boxShadow: '0 0 0 2px rgba(80, 82, 178, 0.3)',
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>
    );
};

export default GoogleTagPopup;
