import axiosInstance from "@/axios/axiosInterceptorInstance";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/components/ToastNotification";
import CustomizedProgressBar from "@/components/CustomizedProgressBar";
import CustomTooltip from "@/components/customToolTip";

const CollectionRules: React.FC = () => {
  const [pageViews, setPageViews] = useState<string>("");
  const [seconds, setSeconds] = useState<string>("");
  const [catchPageViews, setCatchPageViews] = useState<string>("");
  const [catchseconds, setCatchSeconds] = useState<string>("");

  const handlePageViewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    if (value >= 0 || e.target.value === "") {
      setPageViews(e.target.value);
    }
  };

  const handlePageViewsBlur = () => {
    if (pageViews === "") {
      setPageViews("0");
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);

    if (value >= 0 || e.target.value === "") {
      setSeconds(e.target.value);
    }
  };

  const handleSecondsBlur = () => {
    if (seconds === "") {
      setSeconds("0");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        "/suppressions/collection-rules",
        {
          page_views: parseInt(pageViews, 10),
          seconds: parseInt(seconds, 10),
        }
      );
      showToast("Succesfully updated rule");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPageViews(catchPageViews);
    setSeconds(catchseconds);
  };

  const isDisabled =
    !pageViews ||
    !seconds ||
    (parseInt(pageViews, 10) === parseInt(catchPageViews, 10) &&
      parseInt(seconds, 10) === parseInt(catchseconds, 10));
  const isDisabledCancel =
    parseInt(pageViews, 10) === parseInt(catchPageViews, 10) &&
    parseInt(seconds, 10) === parseInt(catchseconds, 10);

  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/suppressions/rules");
      const data = response.data;
      setPageViews(data.page_views_limit);
      setSeconds(data.collection_timeout);
      setCatchSeconds(data.collection_timeout);
      setCatchPageViews(data.page_views_limit);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        width: "100%",
        overflow: "auto",
        padding: 0,
        margin: "0 auto",
        mb: 1,
        color: "rgba(32, 33, 36, 1)",
        border: "1px solid rgba(240, 240, 240, 1)",
        boxShadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.2)",
        "@media (max-width: 900px)": { padding: "0px" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          padding: "20px",
          "@media (max-width: 900px)": { padding: "16px" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            marginBottom: "16px",
            alignItems: "center",
          }}
        >
          <Typography
            className="main-text"
            sx={{
              fontWeight: "600",
              lineHeight: "21.82px",
              fontSize: "1rem",
              color: "rgba(32, 33, 36, 1)",
            }}
          >
            Collection Rules
          </Typography>
          <CustomTooltip
            title={
              "Define rules to gather and organise data for more effective tracking and insights."
            }
            linkText="Learn more"
            linkUrl="https://allsourceio.zohodesk.com/portal/en/kb/articles/collection-rules"
          />
        </Box>

        <Typography
          className="second-text"
          sx={{
            marginBottom: "24px",
            fontWeight: 400,
            fontSize: "0.75rem",
            color: "rgba(128, 128, 128, 1)",
          }}
        >
          Create rules to automatically start a collection event.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
              "@media (max-width: 900px)": { flexDirection: "column" },
            }}
          >
            <Box>
              <Typography
                className="main-text"
                sx={{
                  color: "rgba(32, 33, 36, 1)",
                  display: "flex",
                  alignItems: "center",
                  "::before": {
                    content: '"•"',
                    marginRight: "0.5rem",
                    color: "rgba(32, 33, 36, 1)",
                    fontSize: "1rem",
                  },
                }}
              >
                Automatically collect the contact after X page views.
              </Typography>
              <Typography
                className="second-text"
                sx={{
                  color: "rgba(95, 99, 104, 1)",
                  fontWeight: "400",
                  fontSize: "0.75rem",
                  lineHeight: "1.05rem",
                  marginBottom: "1rem",
                  mt: "0.5rem",
                  pl: "1.75rem",
                }}
              >
                This will save a session variable for the user, and after X page
                views, it will automatically trigger the collection event.
              </Typography>
            </Box>
            <TextField
              label="Page Views"
              variant="outlined"
              placeholder="1"
              type="number"
              value={pageViews}
              onChange={handlePageViewsChange}
              onBlur={handlePageViewsBlur}
              InputProps={{
                style: {
                  color: "rgba(17, 17, 19, 1)",
                  fontFamily: "Nunito Sans",
                  fontWeight: 400,
                  fontSize: "14px",
                },
              }}
              InputLabelProps={{
                style: {
                  color: "rgba(17, 17, 19, 0.6)",
                  fontFamily: "Nunito Sans",
                  fontWeight: 400,
                  fontSize: "14px",
                },
              }}
              sx={{
                marginBottom: "40px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                width: "225px",
                "@media (max-width: 900px)": { width: "100%", height: "48px" },
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
              "@media (max-width: 900px)": { flexDirection: "column" },
            }}
          >
            <Box>
              <Typography
                className="main-text"
                sx={{
                  color: "rgba(32, 33, 36, 1)",
                  display: "flex",
                  alignItems: "center",
                  "::before": {
                    content: '"•"',
                    marginRight: "0.5rem",
                    color: "rgba(32, 33, 36, 1)",
                    fontSize: "1rem",
                  },
                }}
              >
                Automatically collect the contact after X seconds on the same
                page.
              </Typography>
              <Typography
                className="second-text"
                sx={{
                  marginBottom: "1rem",
                  mt: "0.5rem",
                  pl: "1.75rem",
                  color: "rgba(95, 99, 104, 1)",
                  fontWeight: "400",
                  fontSize: "0.75rem",
                  lineHeight: "1.05rem",
                }}
              >
                This will start a timer when the page loads and automatically
                trigger the collection event if the user stays on the page for
                the specified time.
              </Typography>
            </Box>

            <TextField
              label="Seconds"
              variant="outlined"
              placeholder="--"
              type="number"
              rows={2}
              value={seconds}
              onChange={handleSecondsChange}
              onBlur={handleSecondsBlur}
              InputProps={{
                style: {
                  color: "rgba(17, 17, 19, 1)",
                  fontFamily: "Nunito Sans",
                  fontWeight: 400,
                  fontSize: "14px",
                },
              }}
              InputLabelProps={{
                style: {
                  color: "rgba(17, 17, 19, 0.6)",
                  fontFamily: "Nunito Sans",
                  fontWeight: 400,
                  fontSize: "14px",
                  padding: 0,
                },
              }}
              sx={{
                marginBottom: "32px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                width: "225px",
                "@media (max-width: 900px)": { width: "100%", height: "48px" },
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          borderTop: "1px solid rgba(228, 228, 228, 1)",
          pt: 2,
          padding: "24px",
          "@media (max-width: 900px)": { padding: "1rem" },
        }}
      >
        <Button
          variant="outlined"
          disabled={isDisabledCancel}
          onClick={handleCancel}
          sx={{
            backgroundColor: "#fff",
            color: "rgba(56, 152, 252, 1)",
            fontFamily: "Nunito Sans",
            textTransform: "none",
            lineHeight: "22.4px",
            fontWeight: "700",
            padding: "1em 5em",
            textWrap: "nowrap",
            marginRight: "16px",
            border: "1px solid rgba(56, 152, 252, 1)",
            maxWidth: "98px",
            "&:hover": {
              backgroundColor: "#fff",
              boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
              "&.Mui-disabled": {
                backgroundColor: "rgba(80, 82, 178, 0.6)",
                color: "rgba(56, 152, 252, 1)",
                cursor: "not-allowed",
              },
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={isDisabled}
          onClick={handleSave}
          sx={{
            backgroundColor: "rgba(56, 152, 252, 1)",
            fontFamily: "Nunito Sans",
            textTransform: "none",
            lineHeight: "22.4px",
            fontWeight: "700",
            padding: "1em 5em",
            textWrap: "nowrap",
            maxWidth: "120px",
            "&:hover": {
              backgroundColor: "rgba(56, 152, 252, 1)",
              boxShadow: "0 2px 2px rgba(0, 0, 0, 0.3)",
            },
            cursor: isDisabled ? "not-allowed" : "pointer",
            "&.Mui-disabled": {
              backgroundColor: "rgba(80, 82, 178, 0.6)",
              color: "white",
              cursor: "not-allowed",
            },
          }}
        >
          Save
        </Button>
      </Box>
      {loading && <CustomizedProgressBar />}
    </Box>
  );
};

export default CollectionRules;
