"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Dialog, DialogActions, Tooltip, Slider, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, InputAdornment, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export const SettingsApiDetails: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<any[]>([]);

    const handleEdit = (id: string) => {
        // Handle the edit functionality
    };

    const handleDelete = (id: string) => {
        // Handle the delete functionality

    }; 

    return (

            <Box sx={{ padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                    API Details
                </Typography>

                {/* API Keys Section */}
                <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        API Keys
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>API Key</TableCell>
                                    <TableCell>API ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Last Used</TableCell>
                                    <TableCell>Created Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apiKeys.length > 0 ? (
                                    apiKeys.map((key) => (
                                        <TableRow key={key.apiId}>
                                            <TableCell>{key.apiKey}</TableCell>
                                            <TableCell>{key.apiId}</TableCell>
                                            <TableCell>{key.name}</TableCell>
                                            <TableCell>{key.description}</TableCell>
                                            <TableCell>{key.lastUsed}</TableCell>
                                            <TableCell>{key.createdDate}</TableCell>
                                            <TableCell>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        aria-label="edit"
                                                        onClick={() => handleEdit(key.apiId)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        aria-label="delete"
                                                        onClick={() => handleDelete(key.apiId)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7}>No API keys available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
    );
};
