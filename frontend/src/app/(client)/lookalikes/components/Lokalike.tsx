import React, { useState } from "react";
import { Box, Typography, Paper, IconButton, Button } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import GetAppIcon from "@mui/icons-material/GetApp";

interface TableRowData {
    name: string;
    source: string;
    sourceType: string;
    lookalikeSize: string;
    createdDate: string;
    createdBy: string;
    size: string;
}

interface LookalikeProps {
    tableRows: TableRowData[];
}

const Lookalike: React.FC<LookalikeProps> = ({ tableRows }) => {
    return (
        <Box sx={{ width: "100%", display: 'flex', flexDirection: 'column', gap:2 }}>
                <Box
                    sx={{
                        textAlign: "left",
                        padding: "16px 20px 20px 20px",
                        borderRadius: "6px",
                        border: "1px solid #E4E4E4",
                        backgroundColor: "white",
                        position: "relative"
                    }}
                >
                    {/* Заголовки таблицы */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)", // 7 колонок
                            marginBottom: "8px",
                            gap: 2,
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Name
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Source
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Source Type
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Lookalike Size
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Created Date
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Created By
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontFamily: "Nunito Sans",
                                fontWeight: 600,
                                fontSize: "12px",
                                lineHeight: "16.8px",
                                color: "#202124",
                            }}
                        >
                            Size
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%", 
                            right: "0px", 
                            transform: "translateY(-50%)", 
                            zIndex: 10, 
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "white", 
                            padding: "4px",
                            marginRight: "10px"
                        }}
                    >
                        <MoreVertIcon sx={{ color: "#5F6368", cursor: "pointer" }} />
                    </Box>

                    {/* Данные таблицы */}
                    {tableRows.map((row, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)", // 7 колонок
                                gap: 2,
                                borderRadius: "4px",
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.name}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.source}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.sourceType}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.lookalikeSize}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.createdDate}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.createdBy}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: "Roboto",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    lineHeight: "16.8px",
                                    color: "#5F6368",
                                }}
                            >
                                {row.size}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "end",
                    gap: 2,
                }}
            >
                <Button
                    variant="outlined"
                    sx={{
                        marginRight: "16px",
                        textTransform: "none",
                        color: "#5052B2",
                        height: "40px",
                        borderColor: "#5052B2",
                        backgroundColor: "#FFFFFF",
                        fontFamily: "Nunito Sans",
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "19.6px",
                        letterSpacing: "0%",
                    }}
                >
                    Add another Source
                </Button>
            </Box>
        </Box>
    );
};

export default Lookalike;
