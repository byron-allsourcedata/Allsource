import React from 'react';
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const CreateLookalikePage: React.FC = () => {
    return (
        <Box sx={{ width: '100%', padding: 3, backgroundColor: 'white', color: 'black' }}>
            {/* Заголовок */}
            <Typography
                variant="h1"
                sx={{
                    fontFamily: 'Nunito Sans',
                    fontWeight: 700,
                    fontSize: '19px',
                    lineHeight: '25.92px',
                    letterSpacing: '0%',
                    marginBottom: 3,
                    textAlign: 'left',
                }}
            >
                Create Lookalike
            </Typography>

            {/* Блок с таблицей Source */}
            <Box sx={{ marginBottom: 4, textAlign: 'left', }}>
                <Typography
                    variant="h6"
                    sx={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: '16px', lineHeight: '22.5px', marginBottom: 2 }}
                >
                    Source
                </Typography>

                <TableContainer component={Paper} sx={{ width: '100%', boxShadow: 'none' }}>
                    <Table sx={{ borderCollapse: 'collapse' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ border: 'none' }}>Name</TableCell>
                                <TableCell sx={{ border: 'none' }}>Source</TableCell>
                                <TableCell sx={{ border: 'none' }}>Type</TableCell>
                                <TableCell sx={{ border: 'none' }}>Created date</TableCell>
                                <TableCell sx={{ border: 'none' }}>Created By</TableCell>
                                <TableCell sx={{ border: 'none' }}>Number of Customers</TableCell>
                                <TableCell sx={{ border: 'none' }}>Matched Records</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ border: 'none' }}>Example Name</TableCell>
                                <TableCell sx={{ border: 'none' }}>Bigcommerce</TableCell>
                                <TableCell sx={{ border: 'none' }}>High LTV Customer</TableCell>
                                <TableCell sx={{ border: 'none' }}>Feb 20, 2025</TableCell>
                                <TableCell sx={{ border: 'none' }}>Admin</TableCell>
                                <TableCell sx={{ border: 'none' }}>1000</TableCell>
                                <TableCell sx={{ border: 'none' }}>900</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Следующий блок (пока пустой) */}
            <Box sx={{ marginBottom: 4, backgroundColor: '#f5f5f5', padding: 3 }}>
                {/* Содержимое будет добавлено позже */}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center'}}>
                <Typography
                    variant="body1"
                    sx={{
                        fontFamily: 'Nunito Sans',
                        fontWeight: 600,
                        fontSize: '16px',
                        letterSpacing: '0%',
                        color: '#000000',
                    }}
                >
                    CreateName
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="name"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            paddingLeft: '16px',
                        },
                        '& .MuiInputBase-input': {
                            fontFamily: 'Nunito Sans',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '20px',
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default CreateLookalikePage;
