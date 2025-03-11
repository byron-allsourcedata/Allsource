import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Box,
    Typography,
    Tooltip,
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    Popover,
    TextField,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import dayjs from "dayjs";
import { lookalikesStyles } from './lookalikeStyles';
import axiosInstance from "@/axios/axiosInterceptorInstance";
import CheckIcon from "@mui/icons-material/Check";

interface TableRowData {
    id: string;
    name: string;
    source: string;
    source_type: string;
    lookalike_size: string;
    created_date: Date;
    created_by: string;
    size: number;
}

interface LookalikeTableProps {
    tableData: TableRowData[];
}

interface LookalikeRow {
    id: string;
    name: string;
}

const LookalikeTable: React.FC<LookalikeTableProps> = ({ tableData }) => {
    const [orderBy, setOrderBy] = useState<keyof TableRowData>("created_date");
    const [order, setOrder] = useState<"asc" | "desc">("asc");
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editedName, setEditedName] = useState<string>("");

    const handleSort = (column: keyof TableRowData) => {
        const isAsc = orderBy === column && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(column);
    };

    const sortedData = [...tableData].sort((a, b) => {
        if (order === "asc") {
            return a[orderBy] > b[orderBy] ? 1 : -1;
        }
        return a[orderBy] < b[orderBy] ? 1 : -1;
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [confirmAnchorEl, setConfirmAnchorEl] = useState<null | HTMLElement>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const open = Boolean(anchorEl);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, rowId: string, rowName: string) => {
        setIsEdit(false);
        setAnchorEl(event.currentTarget);
        setEditingRowId(rowId);
        setEditedName(rowName)
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleRename = () => {
        setIsEdit(true);
        handleCloseMenu();
    };
                                                                                                                                                                    
    const handleConfirmRename = async () => {
        if (editingRowId === null) return;
        try {
            await axiosInstance.put(`/lookalikes/${editingRowId}`, { name: editedName });
            setEditingRowId(null);
        } catch (error) {
            console.error("Ошибка при обновлении имени:", error);
        }
    };

    const handleDelete = () => {
        // Логика удаления
    };

    const handleOpenConfirm = (event: React.MouseEvent<HTMLElement>) => {
        setConfirmAnchorEl(event.currentTarget);
        setIsConfirmOpen(true);
    };

    const handleCloseConfirm = () => {
        setIsConfirmOpen(false);
    };

    return (
        <TableContainer
            sx={{
                border: '1px solid rgba(235, 235, 235, 1)',
                borderRadius: '4px',
                maxHeight: '71vh',
                overflowY: 'auto',
                "@media (max-height: 800px)": {
                    maxHeight: '70vh',
                },
                "@media (max-width: 400px)": {
                    maxHeight: '67vh',
                },
            }}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        {[
                            { key: "name", label: "Name", sortable: true },
                            { key: "source", label: "Source" },
                            { key: "sourceType", label: "Source Type" },
                            { key: "lookalikeSize", label: "Lookalike Size" },
                            { key: "createdDate", label: "Created Date", sortable: true },
                            { key: "createdBy", label: "Created By" },
                            { key: "size", label: "Size" },
                            { key: "actions", label: "Actions" },
                        ].map(({ key, label, sortable = false }) => (
                            <TableCell
                                key={key}
                                onClick={sortable ? () => handleSort(key as keyof TableRowData) : undefined}
                                sx={{
                                    ...lookalikesStyles.table_column,
                                    ...(key === 'name' && {
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 99
                                    }),
                                    ...(key === 'actions' && {
                                        ...lookalikesStyles.table_array,
                                        maxWidth: '30px',
                                        "::after": { content: 'none' }
                                    })
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ ...lookalikesStyles.table_column, borderRight: '0' }}>{label}</Typography>
                                    {sortable && orderBy === key && (
                                        <IconButton size="small" sx={{ ml: 1 }}>
                                            {order === 'asc' ? (
                                                <ArrowUpwardIcon
                                                    fontSize="inherit" />
                                            ) : (
                                                <ArrowDownwardIcon
                                                    fontSize="inherit" />
                                            )}
                                        </IconButton>
                                    )}
                                </Box>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedData.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: "sticky", left: 0, zIndex: 9, backgroundColor: "#fff" }}>
                                {(editingRowId === row.id && isEdit) ? (
                                    <Box sx={{ display: "flex", alignItems: "center", maxWidth: '150px' }}>
                                        <TextField
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            variant="standard"
                                            size="small"
                                            sx={{ width: "120px" }}
                                        />
                                        <IconButton onClick={handleConfirmRename} sx={{padding:0, ml:0.5}}>
                                            <CheckIcon fontSize="small" color="primary" />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    row.name
                                )}
                            </TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.source}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.source_type}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.lookalike_size}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{dayjs(row.created_date).format('MMM D, YYYY')}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.created_by}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.size}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative', justifyContent: 'center', right: 0 }}>
                                    <IconButton sx={{ padding: 0, margin: 0 }} onClick={(event) => handleOpenMenu(event, row.id, row.name)}>
                                        <MoreVertIcon sx={{ maxHeight: "18px" }} />
                                    </IconButton>
                            </TableCell>
                            <Popover
                                open={open}
                                anchorEl={anchorEl}
                                onClose={handleCloseMenu}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            textTransform: "none",
                                            boxShadow: 0,
                                            borderRadius: "4px",
                                            border: "0.5px solid rgba(175, 175, 175, 1)",
                                        },
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        width: "100%",
                                        maxWidth: "160px",
                                    }}>
                                    <Button
                                        sx={{
                                            justifyContent: "flex-start",
                                            width: "100%",
                                            textTransform: "none",
                                            fontFamily: "Nunito Sans",
                                            fontSize: "14px",
                                            color: "rgba(32, 33, 36, 1)",
                                            fontWeight: 600,
                                            ":hover": {
                                                color: "rgba(80, 82, 178, 1)",
                                                backgroundColor: "background: rgba(80, 82, 178, 0.1)",
                                            },
                                        }}
                                        onClick={() => handleRename()}>Rename</Button>
                                    <Button className="second-sub-title" sx={{ textTransform: 'none' }} onClick={handleOpenConfirm}>Delete</Button>
                                </Box>
                            </Popover>

                            <Popover
                                open={isConfirmOpen}
                                anchorEl={confirmAnchorEl}
                                onClose={handleCloseConfirm}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "center",
                                }}
                                PaperProps={{
                                    sx: {
                                        padding: "0.125rem",
                                        width: "15.875rem",
                                        boxShadow: 0,
                                        borderRadius: "8px",
                                        border: "0.5px solid rgba(175, 175, 175, 1)",
                                    },
                                }}
                            >
                                <Typography className="first-sub-title" sx={{ paddingLeft: 2, pt: 1, pb: 0 }}>Confirm Deletion</Typography>
                                <DialogContent sx={{ padding: 2 }}>
                                    <DialogContentText className="table-data">
                                        Are you sure you want to delete the lookalike named <strong style={{ fontWeight: 700, color: 'black' }}>{row.name}</strong> ?
                                    </DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button
                                        className="second-sub-title"
                                        sx={{
                                            backgroundColor: "#fff",
                                            color: "rgba(80, 82, 178, 1) !important",
                                            fontSize: "14px",
                                            textTransform: "none",
                                            padding: "0.75em 1em",
                                            border: "1px solid rgba(80, 82, 178, 1)",
                                            maxWidth: "50px",
                                            maxHeight: "30px",
                                            "&:hover": {
                                                backgroundColor: "#fff",
                                                boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
                                            },
                                        }}
                                        onClick={handleCloseConfirm}>Cancel</Button>
                                    <Button
                                        className="second-sub-title"
                                        sx={{
                                            backgroundColor: "rgba(80, 82, 178, 1)",
                                            color: "#fff !important",
                                            fontSize: "14px",
                                            textTransform: "none",
                                            padding: "0.75em 1em",
                                            border: "1px solid rgba(80, 82, 178, 1)",
                                            maxWidth: "60px",
                                            maxHeight: "30px",
                                            "&:hover": {
                                                backgroundColor: "rgba(80, 82, 178, 1)",
                                                boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
                                            },
                                        }}
                                        onClick={() => { handleDelete(); handleCloseConfirm(); }}>Delete</Button>
                                </DialogActions>
                            </Popover>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default LookalikeTable;
