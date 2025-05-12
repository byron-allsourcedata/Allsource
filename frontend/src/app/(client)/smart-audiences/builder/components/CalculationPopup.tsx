import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Divider, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { smartAudiences } from "../../smartAudiences";
import CheckIcon from '@mui/icons-material/Check';

interface ValidationPopupProps {
    open: boolean;
    onClose: () => void;
    onCancel: () => void;
    onConfirm: () => void;
    CalculationData: {
        validationCost: number;
        availableCredits: number;
    };
    scrollToNewBlock: () => void
}

const CalculationPopup: React.FC<ValidationPopupProps> = ({ open, onClose, onCancel, onConfirm, scrollToNewBlock, CalculationData }) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography>Confirm Validation</Typography>
                <IconButton onClick={onClose} sx={{ padding: 0, color: 'rgba(0, 0, 0, 1)' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider sx={{ ml: 2.5, mr: 2.5 }} />
            <DialogContent sx={{ padding: "20px", pb: 0.5 }}>
                <Typography variant="body1" className="form-input" sx={{ marginBottom: 2 }}>
                    Proceeding will deduct {CalculationData.validationCost} credits from your account. Make sure you have enough credits to complete the transaction.
                </Typography>
                <Typography variant="body1" className="form-input" sx={{ marginBottom: 1 }}>
                    Current Account Balance:
                </Typography>
                <Typography variant="body1" className="second-sub-title" sx={{ marginBottom: 0.5 }}>
                    {CalculationData.availableCredits} Credits
                </Typography>

                {CalculationData.availableCredits >= CalculationData.validationCost ?
                    (<Typography className="form-input" sx={{ color: 'rgba(74, 158, 79, 1) !important', fontSize: '12px !important', gap: 0.25, mb: 1 }}>✓ You have enough credits to proceed.</Typography>)
                    : (<Typography className="form-input" sx={{ color: 'rgba(205, 40, 43, 1) !important', fontSize: '12px !important', gap: 0.25, mb: 1 }}>✗ You need {CalculationData.validationCost - CalculationData.availableCredits} more credits to proceed.</Typography>)
                }

                <Typography variant="body1" className="form-input" sx={{ marginBottom: 1 }}>
                    Validation Cost
                </Typography>
                <Typography variant="body1" className="second-sub-title" sx={{ marginBottom: 2 }}>
                    {CalculationData.validationCost} Credits
                </Typography>

                {CalculationData.availableCredits >= CalculationData.validationCost ?
                    (<Typography variant="body1" className="form-input" sx={{ marginBottom: 1 }}>Remaining Balance After Purchase</Typography>)
                    :
                    (<Typography variant="body1" className="form-input" sx={{ marginBottom: 1 }}>Credits Needed</Typography>)
                }

                <Typography variant="body1" className="second-sub-title" sx={{ marginBottom: 2 }}>
                    {Math.abs(CalculationData.availableCredits - CalculationData.validationCost)} Credits
                </Typography>

                {CalculationData.availableCredits >= CalculationData.validationCost ?
                    (<Typography variant="body1" className="form-input">Do you want to continue?</Typography>)
                    : (<Typography variant="body1" className="form-input">To proceed, please buy more creditst or reduce the number of validations.</Typography>)
                }

            </DialogContent>
            <DialogActions sx={{ flexDirection: "column", gap: 1, padding: "16px" }}>
                {CalculationData.availableCredits >= CalculationData.validationCost ? 
                    (
                    <Box sx={{ width: '100%' }}>
                        <Button fullWidth variant="contained" color="primary" onClick={ () => {
                            onConfirm()
                            scrollToNewBlock()
                        }} sx={{
                            backgroundColor: "rgba(56, 152, 252, 1)",
                            height: '3rem',
                            ":hover": {
                                backgroundColor: "rgba(56, 152, 252, 1)"
                            },
                        }}>
                            <Typography sx={{ ...smartAudiences.textButton, textTransform: 'none' }}>Confirm</Typography>
                        </Button>
                        <Button fullWidth variant="text" sx={{
                            height: '3rem', ":hover": {
                                backgroundColor: "#fff"
                            }
                        }} onClick={onCancel}>
                            <Typography sx={{ ...smartAudiences.textButton, textTransform: 'none', color: 'rgba(56, 152, 252, 1)' }}>Cancel</Typography>
                        </Button>
                    </Box>
                    )
                    :
                    (
                    <Box sx={{ width: '100%' }}>
                        <Button fullWidth variant="contained" color="primary" onClick={onConfirm} sx={{
                            backgroundColor: "rgba(56, 152, 252, 1)",
                            height: '3rem',
                            ":hover": {
                                backgroundColor: "rgba(56, 152, 252, 1)"
                            },
                        }}>
                            <Typography sx={{ ...smartAudiences.textButton, textTransform: 'none' }}>Buy credits</Typography>
                        </Button>
                        <Button fullWidth variant="text" sx={{
                            height: '3rem', ":hover": {
                                backgroundColor: "#fff"
                            }
                        }} onClick={onCancel}>
                            <Typography sx={{ ...smartAudiences.textButton, textTransform: 'none', color: 'rgba(56, 152, 252, 1)' }}>Change Order</Typography>
                        </Button>
                    </Box>
                    )}
            </DialogActions>
        </Dialog>
    );
};

export default CalculationPopup;
