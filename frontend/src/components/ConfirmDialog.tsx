import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Box,
    IconButton,
    Typography,
} from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    description,
    onConfirm,
    onCancel,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            maxWidth="sm"
            fullWidth
            sx={{
                "& .MuiPaper-root": {
                    minWidth: '580px',
                    margin: 0,
                    borderRadius: "6px",
                    padding: "24px 32px 0px",
                },
            }}
        >
            <DialogTitle
                sx={{
                    p: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(228, 228, 228, 1)",
                    pb: 1,
                    mb: 3,
                }}
            >
                <Typography
                    className='first-sub-title'
                >
                    {title}
                </Typography>
                <IconButton onClick={onCancel}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 4, pl: 0, pr: 0, textAlign: "center" }}>
                <Image
                    src="/GoogleTagPixel.svg"
                    alt="Success"
                    width={468}
                    height={202}
                    style={{ margin: 0 }}
                />

                <Typography
                    sx={{
                        fontSize: "16px",
                        color: "#5f6368",
                        mb: 4,
                        pt: 4,
                        textAlign: "left",
                        fontFamily: "Nunito Sans",
                    }}
                >
                    {description}
                </Typography>

                <DialogActions sx={{ gap: 3 }}>
                    <Button onClick={onCancel} variant='text' sx={{
                        textTransform: "none",
                        fontSize: "14px",
                        padding: "12px",
                        fontWeight: 600,
                        borderRadius: "4px",
                        fontFamily: "Nunito Sans",
                        "&:active": {
                            backgroundColor: "#74B7FD",
                        },
                    }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={onConfirm}

                        sx={{
                            backgroundColor: "#3898FC",
                            textTransform: "none",
                            fontSize: "14px",
                            padding: "10px 24px",
                            fontWeight: 600,
                            borderRadius: "4px",
                            fontFamily: "Nunito Sans",
                            "&:hover": {
                                backgroundColor: "#1E88E5",
                            },
                            "&:active": {
                                backgroundColor: "#74B7FD",
                            },
                        }}
                    >
                        Replace Anyway
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>

    );
};

export default ConfirmDialog;
