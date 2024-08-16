import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Box, Button, Typography, MenuItem, Select, InputLabel, FormControl, Modal } from '@mui/material';
import axios from 'axios';
import axiosInterceptorInstance from "@/axios/axiosInterceptorInstance";

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

const GoogleTagPopup: React.FC<PopupProps> = ({ open, handleClose }) => {
    const [session, setSession] = useState<{ token: string } | null>(null);
    const [accounts, setAccounts] = useState<GTMAccount[]>([]);
    const [containers, setContainers] = useState<GTMContainer[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedContainer, setSelectedContainer] = useState<string>('');
    const [workspaces, setWorkspaces] = useState<any[]>([]); // Уточните тип, если нужно
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

    useEffect(() => {
        const handleRedirect = async () => {
            const query = new URLSearchParams(window.location.search);
            const authorizationCode = query.get('code');

            if (authorizationCode) {
                try {
                    const tokenResponse = await exchangeCodeForToken(authorizationCode);
                    const accessToken = tokenResponse.access_token;
                    console.log('Access Token:', accessToken);
                    setSession({ token: accessToken });
                    fetchAccounts(accessToken);
                } catch (error) {
                    console.error('Error handling redirect:', error);
                }
            }
        };

        handleRedirect();
    }, []);

    const fetchWorkspaces = async () => {
        if (selectedAccount && selectedContainer && session?.token) {
            try {
                const response = await axios.get(
                    `https://www.googleapis.com/tagmanager/v2/accounts/${selectedAccount}/containers/${selectedContainer}/workspaces`,
                    { headers: { Authorization: `Bearer ${session.token}` } }
                );
                setWorkspaces(response.data.workspace || []);
                console.log('Fetched Workspaces:', response.data.workspace);
            } catch (error) {
                console.error('Error fetching workspaces:', error);
            }
        }
    };
    useEffect(() => {
        fetchWorkspaces();
    }, [selectedAccount, selectedContainer, session?.token]);


    const fetchAccounts = async (accessToken: string) => {
        try {
            const response = await axios.get('https://www.googleapis.com/tagmanager/v2/accounts', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAccounts(response.data.account || []);
            console.log('Fetched Accounts:', response.data.account);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    useEffect(() => {
        const fetchContainers = async () => {
            if (selectedAccount && session?.token) {
                console.log('Fetching containers for account:', selectedAccount);
                try {
                    const response = await axios.get(`https://www.googleapis.com/tagmanager/v2/accounts/${selectedAccount}/containers`, {
                        headers: { Authorization: `Bearer ${session.token}` }
                    });
                    setContainers(response.data.container || []);
                    console.log('Fetched Containers:', response.data.container);
                } catch (error) {
                    console.error('Error fetching containers:', error);
                }
            }
        };

        fetchContainers();
    }, [selectedAccount, session?.token]);

    const handleCreateAndSendTag = async () => {
        try {
            const accessToken = session?.token || '';
            const accountId = selectedAccount;
            const containerId = selectedContainer;
            const workspaceId = selectedWorkspace;

            if (!accountId || !containerId || !workspaceId) {
                alert('Please select account, container, and workspace.');
                return;
            }

            let manualResponse = await axiosInterceptorInstance.get(`/install-pixel/manually`);
            let htmlContent = manualResponse.data;
            const tagData = {
                name: 'Pixel script',
                type: 'html',
                parameter: [
                    {
                        key: 'html',
                        type: 'template',
                        value: htmlContent
                    }
                ]
            };

            const response = await axios.post(
                `https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`,
                tagData,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            console.log('API Response:', response.data);
            alert('Tag created and sent successfully!');
            handleClose(); // Close the modal after successful tag creation
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error creating and sending tag:', error.message);
                console.error('Response Data:', error.response?.data); // Log response data
                console.error('Response Status:', error.response?.status); // Log response status
            } else {
                console.error('Unexpected error:', error);
                if (error instanceof Error) {
                    console.error('Error message:', error.message);
                }
            }
            alert('Failed to create and send tag.');
        }
    };







    const exchangeCodeForToken = async (authorizationCode: string) => {
        try {
            const response = await axios.post('https://oauth2.googleapis.com/token', {
                code: authorizationCode,
                client_id: '328826124392-8tc1teht88satmdf6ti2sd5uh9lu1ove.apps.googleusercontent.com',
                client_secret: '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',
                redirect_uri: 'http://localhost:3000/dashboard',
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
                setSession({ token: response.credential });

                const clientId = '328826124392-8tc1teht88satmdf6ti2sd5uh9lu1ove.apps.googleusercontent.com';
                const redirectUri = 'http://localhost:3000/dashboard';
                const scope = 'https://www.googleapis.com/auth/tagmanager.edit.containers';
                const consentUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
                window.location.href = consentUrl;
            } else {
                alert('Account data not available');
            }
        } catch (error) {
            console.error('Error during Google login:', error);
            alert('Failed to log in.');
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box
                sx={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: '500px',
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                    zIndex: 1000,
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h5" gutterBottom>
                    Welcome to GTM Integration Page
                </Typography>
                {!session ? (
                    <GoogleLogin
                        onSuccess={handleLoginSuccess}
                        onError={() => alert('Failed to log in.')}
                        ux_mode="popup"
                    />
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom>
                            Select GTM Account and Container
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Account</InputLabel>
                            <Select
                                value={selectedAccount || ''}
                                onChange={(e) => {
                                    const selectedValue = e.target.value as string;
                                    console.log('Selected Account ID:', selectedValue);
                                    setSelectedAccount(selectedValue);
                                }}
                                label="Account"
                            >
                                <MenuItem value="">Select an account</MenuItem>
                                {accounts.map(account => (
                                    <MenuItem key={account.accountId} value={account.accountId}>
                                        {account.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Container</InputLabel>
                            <Select
                                value={selectedContainer}
                                onChange={e => setSelectedContainer(e.target.value as string)}
                                label="Container"
                            >
                                <MenuItem value="">Select a container</MenuItem>
                                {containers.map(container => (
                                    <MenuItem key={container.containerId} value={container.containerId}>
                                        {container.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Workspace</InputLabel>
                            <Select
                                value={selectedWorkspace || ''}
                                onChange={(e) => setSelectedWorkspace(e.target.value as string)}
                                label="Workspace"
                            >
                                <MenuItem value="">Select a workspace</MenuItem>
                                {workspaces.map(workspace => (
                                    <MenuItem key={workspace.workspaceId} value={workspace.workspaceId}>
                                        {workspace.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCreateAndSendTag}
                            >
                                Send
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleClose}
                                sx={{ ml: 2 }}
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
