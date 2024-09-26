import { Box, Typography, FormControlLabel, TextField, Checkbox, Button, Divider } from "@mui/material";

const CollectionRules: React.FC = () => {
    return (
        <Box sx={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            width: '100%',
            padding: 0,
            margin: '0 auto',
            color: 'rgba(32, 33, 36, 1)',
            border: '1px solid rgba(240, 240, 240, 1)',
            boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.2)',
            "@media (max-width: 900px)": {padding: '0px'} 
        }}>
            <Box sx={{ width: '100%', padding: '20px', "@media (max-width: 900px)": {padding: '16px'} }}>
                <Typography className="main-text" sx={{ fontWeight: '600', lineHeight: '21.82px', marginBottom: '16px', fontSize: '1rem', color: 'rgba(32, 33, 36, 1)' }}>
                    Collection Rules
                </Typography>

                <Typography className="second-text" sx={{ marginBottom: '24px', fontWeight: 400, fontSize: '0.75rem', color: 'rgba(128, 128, 128, 1)' }}>
                    Create rules to automatically start a collection event.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', "@media (max-width: 900px)": {flexDirection: 'column'} }}>
                        <Box>
                            <Typography className="main-text"
                                sx={{
                                    color: 'rgba(32, 33, 36, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    '::before': {
                                        content: '"•"',
                                        marginRight: '0.5rem',
                                        color: 'rgba(32, 33, 36, 1)',
                                        fontSize: '1rem'
                                    }
                                }}
                            >
                                Automatically collect the contact after X page views.
                            </Typography>
                            <Typography className="second-text"
                                sx={{
                                    color: 'rgba(95, 99, 104, 1)',
                                    fontWeight: '400',
                                    fontSize: '0.75rem',
                                    lineHeight: '1.05rem',
                                    marginBottom: '1rem',
                                    mt: '0.5rem',
                                    pl: '1.75rem'
                                }}
                            >
                                This will save a session variable for the user, and after X page views, it will automatically trigger the collection event.
                            </Typography>
                        </Box>
                        <TextField
                            label="Page Views"
                            variant="outlined"
                            placeholder="1"
                            InputProps={{ style: { color: 'rgba(17, 17, 19, 1)', fontFamily: 'Nunito', fontWeight: 400, fontSize: '16px' } }}
                            InputLabelProps={{ style: { color: 'rgba(17, 17, 19, 0.6)', fontFamily: 'Nunito', fontWeight: 400, fontSize: '16px' } }}
                            sx={{
                                marginBottom: '40px',
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                width: '245px',
                                "@media (max-width: 900px)": {width: '100%', height: '48px'}
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', "@media (max-width: 900px)": {flexDirection: 'column'} }}>
                        <Box>
                            <Typography className="main-text"
                                sx={{
                                    color: 'rgba(32, 33, 36, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    '::before': {
                                        content: '"•"',
                                        marginRight: '0.5rem',
                                        color: 'rgba(32, 33, 36, 1)',
                                        fontSize: '1rem'
                                    }
                                }}
                            >
                                Automatically collect the contact after X seconds on the same page.
                            </Typography>
                            <Typography className="second-text"
                                sx={{
                                    marginBottom: '1rem',
                                    mt: '0.5rem',
                                    pl: '1.75rem',
                                    color: 'rgba(95, 99, 104, 1)',
                                    fontWeight: '400',
                                    fontSize: '0.75rem',
                                    lineHeight: '1.05rem',
                                }}
                            >
                                This will start a timer when the page loads and automatically trigger the collection event if the user stays on the page for the specified time.
                            </Typography>
                        </Box>

                        <TextField
                            label="Seconds"
                            variant="outlined"
                            placeholder="--"
                            InputProps={{ style: { color: 'rgba(17, 17, 19, 1)', fontFamily: 'Nunito', fontWeight: 400, fontSize: '16px' } }}
                            InputLabelProps={{ style: { color: 'rgba(17, 17, 19, 0.6)', fontFamily: 'Nunito', fontWeight: 400, fontSize: '16px' } }}
                            sx={{
                                marginBottom: '32px',
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                width: '245px',
                                "@media (max-width: 900px)": {width: '100%', height: '48px'}
                            }}
                        />
                    </Box>
                </Box>
            </Box>


            <Box sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(228, 228, 228, 1)', pt: 2, padding: '24px', "@media (max-width: 900px)": {padding: '1rem',}  }}>
                <Button variant="outlined" sx={{
                    backgroundColor: '#fff', color: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito Sans", textTransform: 'none', lineHeight: '22.4px',
                    fontWeight: '700', padding: '1em 5em', textWrap: 'nowrap', marginRight: '16px', border: '1px solid rgba(80, 82, 178, 1)', maxWidth: '98px', '&:hover': { backgroundColor: '#fff', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)', }
                }}>
                    Cancel
                </Button>
                <Button variant="contained" sx={{
                    backgroundColor: 'rgba(80, 82, 178, 1)', fontFamily: "Nunito Sans", textTransform: 'none', lineHeight: '22.4px',
                    fontWeight: '700', padding: '1em 5em', textWrap: 'nowrap', maxWidth: '120px', '&:hover': { backgroundColor: 'rgba(80, 82, 178, 1)', boxShadow: '0 2px 2px rgba(0, 0, 0, 0.3)' }
                }}>
                    Save
                </Button>
            </Box>
        </Box>
    );
};

export default CollectionRules;