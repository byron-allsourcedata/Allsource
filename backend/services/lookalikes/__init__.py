"""
# Source & Lookalikes

# ID Graph

The basis for all features on Allsource.

Originally, its a 7 tables database, storing information about different aspects of user's profile.
For performance reasons it has been converted to a single table with >150 columns.

In the code, we refer to rows in that table as `EnrichmentUser`

ID Graph contains information about users' emails, phone numbers, addresses, gender, children ages, education, financial occupation, hobbies.
At the time of writing it contained 250+ million rows.

Data is exported as .parquet files, that are subsequently preprocessed by a rust script (allsource-data-transfer) and then ingested into clickhouse.

## Sources

Given an email, we can match it against ID Graph and show detailed information about that person.

Example use case:

Business wants to do a marketing campaign for people, who have already bought something from them using sms, email and postal services.

They upload a list of emails, order amounts and dates (Customer Conversions).

We match these emails against ID Graph and show aggregated insights about those people.

During the upload, we compute a value score for each matched user, which is a float in the range [0.0, 1.0].
This score describes how profitable this user is.


## Lookalikes

The **Lookalikes** feature generates an audience of similar users based on source dataprovided by the client.

We use matched users(those we have identified) and get information about them from ID Graph

We train catboost regression model on features (gender, age, income_range) -> value_score then we use it to go over all profiles in id graph and rank them, saving top N ids those we store as lookalike_persons

## Data Flow

```text
.csv (emails)
   ↓
IdGraph (match → user_id)
   ↓
source_filler (compute value_score)
   ↓
ClickHouse (feature retrieval: 150+ cols)
   ↓
CatBoost (train regression model)
   ↓
IdGraph (predict for all profiles)
   ↓
Ranked candidates
   ↓
lookalike_persons (persist top N)
```

---

## Data Flow

.csv (emails)
   ↓
IdGraph (match → user_id)
   ↓
source_filler (compute value_score)
   ↓
ClickHouse (feature retrieval: 150+ cols)
   ↓
CatBoost (train regression model)
   ↓
IdGraph (predict for all profiles)
   ↓
Ranked candidates
   ↓
lookalike_persons (persist top N)
"""

from .service import AudienceLookalikesService

__all__ = ["AudienceLookalikesService"]