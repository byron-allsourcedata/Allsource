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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { showErrorToast, showToast } from "@/components/ToastNotification";

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
    order?: "asc" | "desc";
    orderBy?: keyof TableRowData;
    onSort: (column: keyof TableRowData) => void;
    refreshData: () => void;
}

const audienceSize = [
    {
        id: "almost",
        label: "Almost identical",
        text: "Lookalike size 0-3%",
        min_value: 0,
        max_value: 3,
    },
    {
        id: "extremely",
        label: "Extremely Similar",
        text: "Lookalike size 0-7%",
        min_value: 0,
        max_value: 7,
    },
    {
        id: "very",
        label: "Very similar",
        text: "Lookalike size 0-10%",
        min_value: 0,
        max_value: 10,
    },
    {
        id: "quite",
        label: "Quite similar",
        text: "Lookalike size 0-15%",
        min_value: 0,
        max_value: 15,
    },
    {
        id: "broad",
        label: "Broad",
        text: "Lookalike size 0-20%",
        min_value: 0,
        max_value: 20,
    },
];


const LookalikeTable: React.FC<LookalikeTableProps> = ({ tableData, order, orderBy, onSort, refreshData }) => {
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState<string>("");
    const [editPopoverAnchorEl, setEditPopoverAnchorEl] = useState<null | HTMLElement>(null);
    const [isEditPopoverOpen, setIsEditPopoverOpen] = useState(false);
    const [confirmAnchorEl, setConfirmAnchorEl] = useState<null | HTMLElement>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);


    const handleRename = (event: React.MouseEvent<HTMLElement>, rowId: string, rowName: string) => {
        setEditingRowId(rowId);
        setEditedName(rowName)
        setEditPopoverAnchorEl(event.currentTarget);
        setIsEditPopoverOpen(true);
    };

    const handleCloseEditPopover = () => {
        setIsEditPopoverOpen(false);
        setEditPopoverAnchorEl(null);
    };

    const handleConfirmRename = async () => {
        if (!editingRowId || !editedName.trim()) return;
        try {
            const response = await axiosInstance.put(`/audience-lookalikes/update-lookalike`, {
                uuid_of_lookalike: editingRowId,
                name_of_lookalike: editedName
            });
            if(response.data.status === "SUCCESS"){
                showToast("Lookalike has been successfully updated")
                refreshData()
            }
            else{
                showErrorToast("An error occurred while trying to rename lookalike")
            }
            setEditingRowId(null);
            setIsEditPopoverOpen(false);
        } catch (error) {
        }
    };

    const handleDelete = async (rowId: string) => {
        try {
            const response = await axiosInstance.delete(`/audience-lookalikes/delete-lookalike`, {params: {uuid_of_lookalike: rowId }});
            if(response.data.status === "SUCCESS"){
                showToast("Lookalike has been successfully removed")
                refreshData()
            }
            else{
                showErrorToast("An error occurred while trying to remove lookalike")
            }
        } catch (error) {
        }
    };

    const handleOpenConfirm = (event: React.MouseEvent<HTMLElement>, rowId: string, rowName: string) => {
        setConfirmAnchorEl(event.currentTarget);
        setEditingRowId(rowId);
        setEditedName(rowName)
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
                maxHeight: '67vh',
                overflow: 'auto',
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
                            { key: "source_type", label: "Source Type" },
                            { key: "lookalike_size", label: "Lookalike Size" },
                            { key: "created_date", label: "Created Date", sortable: true },
                            { key: "created_by", label: "Created By" },
                            { key: "size", label: "Size", sortable: true },
                            { key: "actions", label: "" },
                        ].map(({ key, label, sortable = false }) => (
                            <TableCell
                                key={key}
                                onClick={sortable ? () => onSort(key as keyof TableRowData) : undefined}
                                sx={{
                                    ...lookalikesStyles.table_column,
                                    cursor: sortable ? 'pointer' : 'default',
                                    ...(key === 'name' && {
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 99
                                    }),
                                    ...(key === 'actions' && {
                                        ...lookalikesStyles.table_column,
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
                    {tableData.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: "sticky", left: 0, zIndex: 9, backgroundColor: "#fff", '&:hover .edit-icon': { opacity: 1, pointerEvents: 'auto' } }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: 2,
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    {row.name}
                                    <IconButton
                                        className="edit-icon"
                                        sx={{
                                            pl: 0, pr: 0, pt: 0.25, pb: 0.25,
                                            margin: 0,
                                            opacity: 0,
                                            pointerEvents: 'none',
                                            transition: 'opacity 0.2s ease-in-out',
                                            '@media (max-width: 900px)':{
                                                opacity:1
                                            }
                                        }}
                                        onClick={(event) => handleRename(event, row.id, row.name)}
                                    >
                                        <EditIcon sx={{ maxHeight: "18px" }} />
                                    </IconButton>
                                </Box>


                            </TableCell>
                            <Popover
                                open={isEditPopoverOpen}
                                anchorEl={editPopoverAnchorEl}
                                onClose={handleCloseEditPopover}
                                anchorOrigin={{
                                    vertical: "center",
                                    horizontal: "center",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "left",
                                }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            width: "15.875rem",
                                            boxShadow: 0,
                                            borderRadius: "4px",
                                            border: "0.5px solid rgba(175, 175, 175, 1)",

                                        },
                                    }
                                }}
                            >
                                <Box sx={{ p: 2 }}>
                                    <TextField
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        variant="outlined"
                                        label='Lookalike Name'
                                        size="small"
                                        fullWidth
                                          sx={{
                                            "& label.Mui-focused": {
                                              color: "rgba(80, 82, 178, 1)",
                                            },
                                            "& .MuiOutlinedInput-root:hover fieldset": {
                                                color: "rgba(80, 82, 178, 1)",
                                            },
                                            "& .MuiOutlinedInput-root": {
                                              "&:hover fieldset": {
                                                borderColor: "rgba(80, 82, 178, 1)",
                                                border: "1px solid rgba(80, 82, 178, 1)",
                                              },
                                              "&.Mui-focused fieldset": {
                                                borderColor: "rgba(80, 82, 178, 1)",
                                                border: "1px solid rgba(80, 82, 178, 1)",
                                              },
                                            },
                                          }}
                                          InputProps={{
                                            style: {
                                              fontFamily: "Roboto",
                                              fontSize: "14px",
                                            },
                                          }}
                                          InputLabelProps={{
                                            style: {
                                              fontSize: "14px",
                                              fontFamily: "Roboto",
                                            },
                                          }}
                                    />
                                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                                        <Button
                                            onClick={handleCloseEditPopover}
                                            sx={{
                                                backgroundColor: "#fff",
                                                color: "rgba(80, 82, 178, 1) !important",
                                                fontSize: "14px",
                                                textTransform: "none",
                                                padding: "0.75em 1em",
                                                maxWidth: "50px",
                                                maxHeight: "30px",
                                                mr:0.5,
                                                "&:hover": {
                                                    backgroundColor: "#fff",
                                                    boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
                                                },
                                            }}
                                        >
                                            <Typography className="second-sub-title" sx={{ color: 'rgba(80, 82, 178, 1) !important' }}>Cancel</Typography>
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                handleConfirmRename();
                                                handleCloseEditPopover();
                                            }}
                                            sx={{
                                                backgroundColor: "#fff",
                                                color: "rgba(80, 82, 178, 1) !important",
                                                fontSize: "14px",
                                                textTransform: "none",
                                                padding: "0.75em 1em",
                                                maxWidth: "50px",
                                                maxHeight: "30px",
                                                "&:hover": {
                                                    backgroundColor: "#fff",
                                                    boxShadow: "0 0px 1px 1px rgba(0, 0, 0, 0.3)",
                                                },
                                            }}
                                        >
                                            <Typography className="second-sub-title" sx={{ color: 'rgba(80, 82, 178, 1) !important' }}>Save</Typography>
                                        </Button>
                                    </Box>
                                </Box>
                            </Popover>

                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.source}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.source_type}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>
                                {(() => {
                                    const size = audienceSize.find(size => size.label === row.lookalike_size);
                                    return size ? `${size.label} ${size.min_value}-${size.max_value}%` : row.lookalike_size;
                                })()}
                            </TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{dayjs(row.created_date).format('MMM D, YYYY')}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.created_by}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, position: 'relative' }}>{row.size}</TableCell>
                            <TableCell sx={{ ...lookalikesStyles.table_array, maxWidth: '40px', padding:'8px', pr:0 }}>
                                <IconButton sx={{ pl: 0, pr: 0, pt: 0.25, pb: 0.25, margin: 0 }} onClick={(event) => handleOpenConfirm(event, row.id, row.name)}>
                                    <DeleteIcon sx={{ maxHeight: "18px" }} />
                                </IconButton>
                            </TableCell>
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
                                        Are you sure you want to delete the lookalike named <strong style={{ fontWeight: 500, color: 'rgba(32, 33, 36, 1)' }}>{editedName}</strong> ?
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
                                        onClick={() => { handleDelete(editingRowId || ''); handleCloseConfirm(); }}>Delete</Button>
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
