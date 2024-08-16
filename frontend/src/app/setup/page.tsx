// 'use client';
//
// import React, { useState, useEffect } from 'react';
// import { Box, Button, Typography, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
// import axios from 'axios';
//
// interface GTMContainer {
//     id: string;
//     name: string;
// }
//
// interface GTMAccount {
//     id: string;
//     name: string;
// }
//
// const SetupPage: React.FC = () => {
//     const [session, setSession] = useState<{ token: string } | null>(null);
//     const [accounts, setAccounts] = useState<GTMAccount[]>([]);
//     const [containers, setContainers] = useState<GTMContainer[]>([]);
//     const [selectedAccount, setSelectedAccount] = useState<string>('');
//     const [selectedContainer, setSelectedContainer] = useState<string>('');
//
//     useEffect(() => {
//         const fetchTokenFromUrl = async () => {
//             const query = new URLSearchParams(window.location.search);
//             const authorizationCode = query.get('code');
//
//             if (authorizationCode) {
//                 try {
//                     const tokenResponse = await exchangeCodeForToken(authorizationCode);
//                     const accessToken = tokenResponse.access_token;
//                     setSession({ token: accessToken });
//                     await fetchAccountsAndContainers(accessToken);
//                 } catch (error) {
//                     console.error('Error handling redirect:', error);
//                 }
//             }
//         };
//
//         fetchTokenFromUrl();
//     }, []);
//
//     const exchangeCodeForToken = async (authorizationCode: string) => {
//         try {
//             const response = await axios.post('https://oauth2.googleapis.com/token', {
//                 code: authorizationCode,
//                 client_id: '328826124392-8tc1teht88satmdf6ti2sd5uh9lu1ove.apps.googleusercontent.com',
//                 client_secret: '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',
//                 redirect_uri: 'http://localhost:3000/setup',
//                 grant_type: 'authorization_code'
//             });
//             return response.data;
//         } catch (error) {
//             console.error('Error exchanging code for token:', error);
//             throw error;
//         }
//     };
//
//     const fetchAccountsAndContainers = async (accessToken: string) => {
//         try {
//             const accountsResponse = await axios.get('https://www.googleapis.com/tagmanager/v2/accounts', {
//                 headers: { Authorization: `Bearer ${accessToken}` }
//             });
//             setAccounts(accountsResponse.data.account || []);
//         } catch (error) {
//             console.error('Error fetching accounts:', error);
//         }
//     };
//
//     const fetchContainers = async (accessToken: string, accountId: string) => {
//         try {
//             const containersResponse = await axios.get(`https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`, {
//                 headers: { Authorization: `Bearer ${accessToken}` }
//             });
//             setContainers(containersResponse.data.container || []);
//         } catch (error) {
//             console.error('Error fetching containers:', error);
//         }
//     };
//
//     const handleAccountChange = async (e: React.ChangeEvent<{ value: unknown }>) => {
//         const accountId = e.target.value as string;
//         setSelectedAccount(accountId);
//         const accessToken = session?.token || '';
//         await fetchContainers(accessToken, accountId);
//     };
//
//     const handleCreateAndPublishTag = async () => {
//         try {
//             const accessToken = session?.token || '';
//             const accountId = selectedAccount;
//             const containerId = selectedContainer;
//
//             await createTag(accessToken, accountId, containerId);
//             await publishContainer(accessToken, accountId, containerId);
//
//             alert('Tag created and published successfully!');
//             // Изменяем URL без использования navigate
//             window.location.href = '/overview?site_id=5097022&gtm_token=GTM-KM4XZF6Q&gtm_public_id=true';
//         } catch (error) {
//             console.error('Error creating and publishing tag:', error);
//         }
//     };
//
//     const createTag = async (accessToken: string, accountId: string, containerId: string) => {
//         try {
//             await axios.post(`https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/tags`, {
//                 // Добавьте параметры для создания тега
//             }, {
//                 headers: { Authorization: `Bearer ${accessToken}` }
//             });
//         } catch (error) {
//             console.error('Error creating tag:', error);
//             throw error;
//         }
//     };
//
//     const publishContainer = async (accessToken: string, accountId: string, containerId: string) => {
//         try {
//             await axios.post(`https://www.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/versions`, {
//                 // Добавьте параметры для публикации контейнера
//             }, {
//                 headers: { Authorization: `Bearer ${accessToken}` }
//             });
//         } catch (error) {
//             console.error('Error publishing container:', error);
//             throw error;
//         }
//     };
//
//     return (
//         <Box
//             sx={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'center',
//                 padding: '20px',
//             }}
//         >
//             <Typography variant="h5" gutterBottom>
//                 Выберите аккаунт и контейнер GTM
//             </Typography>
//             <FormControl fullWidth sx={{ mb: 2 }}>
//                 <InputLabel>Аккаунт</InputLabel>
//                 <Select
//                     value={selectedAccount}
//                     onChange={handleAccountChange}
//                     label="Аккаунт"
//                 >
//                     <MenuItem value="">Выберите аккаунт</MenuItem>
//                     {accounts.map(account => (
//                         <MenuItem key={account.id} value={account.id}>
//                             {account.name}
//                         </MenuItem>
//                     ))}
//                 </Select>
//             </FormControl>
//             <FormControl fullWidth>
//                 <InputLabel>Контейнер</InputLabel>
//                 <Select
//                     value={selectedContainer}
//                     onChange={e => setSelectedContainer(e.target.value as string)}
//                     label="Контейнер"
//                 >
//                     <MenuItem value="">Выберите контейнер</MenuItem>
//                     {containers.map(container => (
//                         <MenuItem key={container.id} value={container.id}>
//                             {container.name}
//                         </MenuItem>
//                     ))}
//                 </Select>
//             </FormControl>
//             <Box sx={{ mt: 2 }}>
//                 <Button
//                     variant="contained"
//                     color="primary"
//                     onClick={handleCreateAndPublishTag}
//                 >
//                     Создать и опубликовать тег
//                 </Button>
//             </Box>
//         </Box>
//     );
// };
//
// export default SetupPage;
