CREATE TABLE enrichment_lookalike_scores (
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    lookalike_id UUID NOT NULL REFERENCES audience_lookalikes(id) ON DELETE CASCADE,
    enrichment_user_id UUID NOT NULL REFERENCES enrichment_users(id) ON DELETE CASCADE,
    score DECIMAL(10, 2) DEFAULT 0
);


ALTER TABLE enrichment_lookalike_scores OWNER TO maximiz_dev;