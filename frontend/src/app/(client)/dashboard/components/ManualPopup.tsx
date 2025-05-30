"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  IconButton,
  Divider,
  Input,
  InputBase,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Image from "next/image";
import axiosInstance from "@/axios/axiosInterceptorInstance";
import { showToast } from "../../../../components/ToastNotification";
import { useHints } from "@/context/HintsContext";
import HintCard from "@/app/(client)/components/HintCard";

interface HintCardInterface {
  description: string;
  title: string;
  linkToLoadMore: string;
}

const maintext = {
  textAlign: "left",
  color: "rgba(32,33, 36, 1) !important",
  padding: "0em 0em 0em 1em",
};

const subtext = {
  fontFamily: "Nunito Sans",
  fontSize: "14px",
  fontWeight: "400",
  lineHeight: "16.8px",
  textAlign: "left",
  color: "rgba(0, 0, 0, 1)",
  paddingTop: "0.25em",
  paddingLeft: "3.7em",
};

interface PopupProps {
  open: boolean;
  handleClose: () => void;
  pixelCode: string;
}

const Popup: React.FC<PopupProps> = ({ open, handleClose, pixelCode }) => {
  const { changePixelSetupHint, pixelSetupHints, resetPixelSetupHints } =
    useHints();
  const [email, setEmail] = useState("");
  const handleCopy = () => {
    navigator.clipboard.writeText(pixelCode);
    alert("Copied to clipboard");
  };

  const handleButtonClick = () => {
    axiosInstance
      .post("/install-pixel/send-pixel-code", { email })
      .then((response) => {
        showToast("Successfully send email");
      })
      .catch((error) => { });
  };

  const hintCards: HintCardInterface[] = [
    {
      description: `Enter your developer’s email address in the input field and click "Send". We’ll send installation instructions for setting up the pixel manually to the provided email.`,
      title: "Enter your developer's email address",
      linkToLoadMore:
        "https://allsourceio.zohodesk.com/portal/en/kb/articles/send-pixel-installation-instructions",
    },
  ];

  return (
    <>
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 4,
          mt: 2,
          borderRadius: 2,
          border: "1px solid rgba(231, 231, 233, 1)",
          width: "100%",
          boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Typography
          className="first-sub-title"
          sx={{
            textAlign: "left",
            "@media (max-width: 600px)": { pt: 2, pl: 2 },
          }}
        >
          Install Manually
        </Typography>
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "10px",
            "@media (max-width: 600px)": { p: 2 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "1em 0em 0em 0em",
              justifyContent: "start",
            }}
          >
            <Image src="/1.svg" alt="1" width={28} height={28} />
            <Typography className="first-sub-title" sx={maintext}>
              Copy the pixel code
            </Typography>
          </Box>
          <Box
            component="pre"
            sx={{
              backgroundColor: "#ffffff",
              gap: 2,
              position: "relative",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
              border: "1px solid rgba(228, 228, 228, 1)",
              borderRadius: "10px",
              marginLeft: "3em",
              maxHeight: "14em",
              overflowY: "auto",
              overflowX: "hidden",
              "@media (max-width: 600px)": {
                maxHeight: "14em",
              },
            }}
          >
            <IconButton
              onClick={handleCopy}
              sx={{ position: "absolute", right: "10px", top: "10px" }}
            >
              <ContentCopyIcon />
            </IconButton>
            <code
              style={{
                color: "rgba(95, 99, 104, 1)",
                fontSize: "12px",
                margin: 0,
                fontWeight: 400,
                fontFamily: "Nunito Sans",
                textWrap: "nowrap",
              }}
            >
              {pixelCode?.trim()}
            </code>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0.5em 0em 0em 0em",
              justifyContent: "start",
            }}
          >
            <Image src="/2.svg" alt="2" width={28} height={28} />
            <Typography className="first-sub-title" sx={maintext}>
              Paste the pixel in your website
            </Typography>
          </Box>
          <Typography className="paragraph" sx={subtext}>
            Paste the above pixel in the header of your website. The header
            script starts with &lt;head&gt; and ends with &lt;/head&gt;.
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "1.25em 0em 0em 0em",
              justifyContent: "start",
            }}
          >
            <Image src="/3.svg" alt="3" width={28} height={28} />
            <Typography className="first-sub-title" sx={maintext}>
              Verify Your Pixel
            </Typography>
          </Box>
          <Typography className="paragraph" sx={subtext}>
            Once the pixel is pasted in your website, wait for 10-15 mins and
            verify your pixel.
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          pt: 2,
          "@media (max-width: 600px)": { pt: 2 },
        }}
      >
        <Box
          sx={{
            padding: "1.1em",
            border: "1px solid #e4e4e4",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 1)",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
            "@media (max-width: 600px)": { m: 2 },
          }}
        >
          <Typography
            variant="h6"
            component="div"
            mb={2}
            className="first-sub-title"
            sx={{
              textAlign: "left",
            }}
          >
            Send this to my developer
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            position="relative"
            flexDirection="row"
            sx={{
              "@media (max-width: 600px)": {
                flexDirection: "column",
                display: "flex",
                alignContent: "flex-start",
                alignItems: "flex-start",
                gap: 1,
              },
            }}
          >
            <InputBase
              id="email_send"
              type="text"
              placeholder="Enter Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="paragraph"
              sx={{
                padding: "0.5rem 2em 0.5em 1em",
                width: "65%",
                border: "1px solid #e4e4e4",
                borderRadius: "4px",
                maxHeight: "2.5em",
                fontSize: "14px !important",
                textAlign: "left",
                backgroundColor: "rgba(255, 255, 255, 1)",
                boxShadow: "none",
                outline: "none",
                "&:focus": {
                  borderColor: "#3f51b5",
                },
                "@media (max-width: 600px)": {
                  width: "100%",
                },
              }}
            />

            <Button
              onClick={handleButtonClick}
              sx={{
                ml: 2,
                border: "1px solid rgba(56, 152, 252, 1)",
                textTransform: "none",
                background: "#fff",
                color: "rgba(56, 152, 252, 1)",
                fontFamily: "Nunito Sans",
                padding: "0.65em 2em",
                mr: 1,
                "@media (max-width: 600px)": {
                  padding: "0.5em 1.5em",
                  mr: 0,
                  ml: 0,
                  left: 0,
                },
              }}
            >
              <Typography
                className="second-sub-title"
                sx={{
                  color: "rgba(56, 152, 252, 1) !important",
                  textAlign: "left",
                }}
              >
                Send
              </Typography>
            </Button>
            {/* {pixelSetupHints[14].show && (
              <HintCard
                card={hintCards[0]}
                positionLeft={670}
                positionTop={-30}
                isOpenBody={pixelSetupHints[14].showBody}
                toggleClick={() =>
                  changePixelSetupHint(14, "showBody", "toggle")
                }
                closeClick={() => changePixelSetupHint(14, "showBody", "close")}
              />
            )} */}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Popup;
