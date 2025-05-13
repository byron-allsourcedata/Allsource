import { Box, Typography } from "@mui/material";
import Link from "next/link";
import FeatureListTable from "../FeatureListTable";
import { categorizeFields } from "./categorizeFields";
import { SignificantFields } from "@/types/insights";


type PredictableFieldsTabProps = {
  data: SignificantFields
};

const Categories: React.FC<PredictableFieldsTabProps> = ({ data }) => {
  const categorized = categorizeFields(data);
  return (
    <Box sx={{ width: "100%", display: "flex" }}>
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: "77vh",
          flexGrow: 1,
          borderRight: "1px solid rgba(82, 82, 82, 0.2)",
        }}
      >
        <FeatureListTable
          title="Personal Profile"
          features={categorized.personal}
          columnHeaders={["Attribute name", "Predictable value"]}
          first={true}
        />
        <FeatureListTable
          title="Financial"
          features={categorized.financial}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Lifestyles"
          features={categorized.lifestyle}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
        <FeatureListTable
          title="Voter"
          features={categorized.voter}
          columnHeaders={["Attribute name", "Predictable value"]}
        />
      </Box>
      <Box
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          padding: "0rem 3rem",
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography
            className="paragraph"
            sx={{ fontWeight: "600 !important" }}
          >
            Predictable Fields{" "}
          </Typography>
          <Typography className="paragraph">
            Gain data-powered insights into your audience&apos;s likely traits
            and behaviors across key life domains. Our predictive models
            estimate values for:{" "}
          </Typography>
        </Box>
        <Box
          sx={{
            gap: 1.5,
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography className="paragraph">
            - Personal Profile: Age, gender, education, household composition,
            and more.
          </Typography>
          <Typography className="paragraph">
            - Financial: Income range, credit propensity, spending habits, and
            financial priorities.
          </Typography>
          <Typography className="paragraph">
            - Lifestyle: Interests, hobbies, brand preferences, and digital
            engagement trends.
          </Typography>
          <Typography className="paragraph">
            - Voter: Political leanings, voting likelihood, and key issues of
            influence.
          </Typography>
        </Box>
        <Typography className="paragraph">
          Refine targeting, reduce guesswork, and act on what truly
          resonates—powered by predictive intelligence.
        </Typography>

        <Box>
          <Link
            style={{
              color: "rgba(56, 152, 252, 1) !important",
              fontSize: "12px",
              fontFamily: "Roboto",
              width: "auto",
              display: "inline",
            }}
            href={""}
          >
            Learn more
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Categories;
