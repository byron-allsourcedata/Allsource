import React from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  OpenInNewIcon,
  CloseIcon,
  LegendToggleOutlinedIcon,
  AllInboxOutlinedIcon,
} from "@/icon";
import Image from "next/image";

type WelcomePopupProps = {
  open: boolean;
  onClose: () => void;
  variant?: "welcome" | "alternate" | "integration";
};

const WelcomePopup: React.FC<WelcomePopupProps> = ({
  open,
  onClose,
  variant = "welcome",
}) => {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    localStorage.removeItem("welcome_popup");
  };

  const navigateToSourcePage = () => {
    handleClose();
    router.push("/sources");
  };

  const navigateToIntegrationPage = () => {
    handleClose();
    router.push("/integrations");
  };

  const navigateToSmartAudiencePage = () => {
    handleClose();
    router.push("/smart-audiences");
  };

  const navigateToExamplePage = () => {
    handleClose();
    window.open(
      "https://allsourceio.zohodesk.com/portal/en/kb/allsource",
      "_blank"
    );
  };


  return (
    <>
      <Backdrop
        open={open}
        onClick={handleClose}
        sx={{
          zIndex: 1200,
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(0,0,0,0.1)",
        }}
      />
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {variant === "welcome" ? (
          <>
            <DialogTitle sx={{ p: "16px 16px 8px" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                <IconButton
                  sx={{ width: "30px", height: "30px" }}
                  onClick={handleClose}
                >
                  <CloseIcon sx={{ color: "#202124" }} />
                </IconButton>
              </Box>
              <Typography
                fontWeight="600"
                fontSize="26px"
                textAlign="center"
                fontFamily="Nunito Sans"
              >
                Create your source first
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Typography
                className="fourth-sub-title"
                sx={{ textAlign: "center" }}
              >
                To create a lookalike you need to provide a data source.
              </Typography>
              <Grid
                container
                spacing={4}
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 0 }}
              >
                {/* Left Section */}
                <Grid item xs={12} md={5.75}>
                  <Card
                    elevation={0}
                    sx={{ backgroundColor: "transparent", boxShadow: "none" }}
                  >
                    <CardContent
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography className="first-sub-title">
                          Install Pixel
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            className="table-data"
                            sx={{
                              color: "rgba(43, 91, 0, 1) !important",
                              fontSize: "14px !important",
                              backgroundColor:
                                "rgba(234, 248, 221, 1) !important",
                              padding: "4px 12px",
                              borderRadius: "4px",
                            }}
                          >
                            Recommended
                          </Typography>
                        </Box>
                      </Box>
                      <Typography className="description">
                        It will automatically collect visitor information from
                        your website.
                      </Typography>
                      <Box
                        sx={{
                          height: 140,
                          backgroundColor: "#f0f4ff",
                          backgroundImage: "url(./pixel.svg)",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          borderRadius: 2,
                        }}
                      />
                    </CardContent>
                    <CardActions sx={{ pt: 0, pl: 2, pr: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={navigateToSourcePage}
                        sx={{
                          backgroundColor: "#3898FC",
                          dropShadow: "#00000040",
                        }}
                      >
                        <IconButton
                          sx={{ width: "30px", height: "30px", color: "#fff" }}
                          onClick={() => { }}
                        >
                          <LegendToggleOutlinedIcon />
                        </IconButton>
                        <Typography
                          className="description"
                          style={{ color: "#fff" }}
                        >
                          Start with Pixel
                        </Typography>
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>

                {/* OR Divider */}
                <Grid
                  item
                  xs={12}
                  md={0.5}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "row", md: "column" },
                    alignItems: "center",
                    gap: 1,
                    height: { xs: "auto", md: "340px" },
                    width: "100%",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "row", md: "column" },
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: "50%", md: "auto" },
                        height: { xs: "1px", md: "50%" },
                        borderBottom: { xs: "1px solid #DCE1E8", md: "none" },
                        borderRight: { xs: "none", md: "1px solid #DCE1E8" },
                        marginRight: { xs: "8px", md: "0" },
                        marginBottom: { xs: "0", md: "8px" },
                      }}
                    />
                    <Typography
                      variant="body1"
                      className="third-sub-title"
                      sx={{ color: "#6B7280" }}
                    >
                      OR
                    </Typography>
                    <Box
                      sx={{
                        width: { xs: "50%", md: "auto" },
                        height: { xs: "1px", md: "50%" },
                        borderBottom: { xs: "1px solid #DCE1E8", md: "none" },
                        borderRight: { xs: "none", md: "1px solid #DCE1E8" },
                        marginRight: { xs: "8px", md: "0" },
                        marginBottom: { xs: "0", md: "8px" },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Right Section */}
                <Grid item xs={12} md={5.75}>
                  <Card
                    elevation={0}
                    sx={{ backgroundColor: "transparent", boxShadow: "none" }}
                  >
                    <CardContent
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Typography className="first-sub-title">
                        Import Source from CSV file
                      </Typography>
                      <Typography className="description">
                        Otherwise, you can upload a CSV file containing your
                        existing customer data.
                      </Typography>
                      <Box
                        sx={{
                          height: 140,
                          backgroundColor: "#f0f4ff",
                          backgroundImage: "url(./audience.svg)",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          borderRadius: 2,
                        }}
                      />
                    </CardContent>
                    <CardActions sx={{ pt: 0, pl: 2, pr: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={navigateToSourcePage}
                      >
                        <IconButton
                          sx={{
                            width: "30px",
                            height: "30px",
                            color: "#3898FC",
                          }}
                          onClick={() => { }}
                        >
                          <AllInboxOutlinedIcon />
                        </IconButton>
                        <Typography
                          className="description"
                          style={{ color: "#3898FC" }}
                        >
                          Start from Source
                        </Typography>
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        ) : variant === "alternate" ? (
          <>
            <DialogTitle sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography
                fontWeight="600"
                fontSize="26px"
                textAlign="center"
                fontFamily="Nunito Sans"
              >
                Create your source first
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography
                className="fourth-sub-title"
                sx={{ textAlign: "center" }}
              >
                To create a lookalike you need to import at least one source
              </Typography>
              <Box sx={{ p: 4 }}>
                <Box
                  sx={{
                    height: 140,
                    backgroundColor: "#f0f4ff",
                    backgroundImage: "url(./audience.svg)",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                    borderRadius: 2,
                  }}
                ></Box>
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={navigateToExamplePage}
                  >
                    <Typography
                      className="description"
                      style={{ color: "#3898FC" }}
                    >
                      Learn more
                    </Typography>
                    <IconButton
                      sx={{ width: "30px", height: "30px", color: "#3898FC" }}
                      onClick={() => { }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={navigateToSourcePage}
                    sx={{ backgroundColor: "#3898FC", dropShadow: "#00000040" }}
                  >
                    <IconButton
                      sx={{ width: "30px", height: "30px", color: "#fff" }}
                      onClick={() => { }}
                    ></IconButton>
                    <Typography
                      className="description"
                      style={{ color: "#fff" }}
                    >
                      Import Source
                    </Typography>
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        ) : (
          <>
            <DialogTitle sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography
                fontWeight="600"
                fontSize="26px"
                textAlign="center"
                fontFamily="Nunito Sans"
              >
                Generate your Smart Audience first
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography
                className="fourth-sub-title"
                sx={{ textAlign: "center" }}
              >
                To synk your data you need to generate smart audience
              </Typography>
              <Box sx={{ p: 4 }}>
                <Box
                  sx={{
                    bgcolor: "#E8F0FF",
                    borderRadius: 1,
                    p: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/smart-audience-first-time-screen.svg"
                    alt="Smart audience diagram"
                    width={500}
                    height={160}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={navigateToExamplePage}
                  >
                    <Typography
                      className="description"
                      style={{ color: "#3898FC" }}
                    >
                      Learn more
                    </Typography>
                    <IconButton
                      sx={{ width: "30px", height: "30px", color: "#3898FC" }}
                      onClick={() => { }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={navigateToSmartAudiencePage}
                    sx={{ backgroundColor: "#3898FC", dropShadow: "#00000040" }}
                  >
                    <IconButton
                      sx={{ width: "30px", height: "30px", color: "#fff" }}
                      onClick={() => { }}
                    ></IconButton>
                    <Typography
                      className="description"
                      style={{ color: "#fff" }}
                    >
                      Generate Smart Audience
                    </Typography>
                  </Button>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};

export default WelcomePopup;
