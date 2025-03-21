import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Divider, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { smartAudiences } from "../../smartAudiences";

interface ValidationPopupProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  onSkip: () => void;
}

const ValidationPopup: React.FC<ValidationPopupProps> = ({ open, onClose, onContinue, onSkip }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography>Warning</Typography>
        <IconButton onClick={onClose} sx={{ padding: 0, color: 'rgba(0, 0, 0, 1)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ml: 2.5, mr:2.5}} />
      <DialogContent sx={{ padding: "20px" }}>
        <Typography variant="body1" className="form-input" sx={{ marginBottom: 2 }}>
          Before you proceed, please note that validating potential leads is crucial for maintaining the quality of your data
          and ensuring effective communication. We strongly recommend completing the validation process to maximize your success.
        </Typography>
        <Typography variant="body1" className="form-input">Are you sure you want to skip validation?</Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: "column", gap: 1, padding: "16px" }}>
        <Button fullWidth variant="contained" color="primary" onClick={onContinue} sx={{backgroundColor: "rgba(80, 82, 178, 1)",
        height: '3rem',
                        ":hover": {
                            backgroundColor: "rgba(80, 82, 178, 1)"
                        },}}>
        <Typography sx={{...smartAudiences.textButton, textTransform: 'none'}}>Continue Validation</Typography>
        </Button>
        <Button fullWidth variant="text" sx={{height: '3rem', ":hover": {
                            backgroundColor: "#fff"
                        }}}  onClick={onSkip}>
          <Typography sx={{...smartAudiences.textButton, textTransform: 'none', color: 'rgba(80, 82, 178, 1)'}}>Skip Anyway</Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ValidationPopup;
