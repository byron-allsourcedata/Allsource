CREATE TABLE enrichment_models(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookalike_id UUID NOT NULL,
    model BYTEA NOT NULL,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (lookalike_id) REFERENCES audience_lookalikes(id)
);

ALTER TABLE enrichment_models OWNER TO maximiz_dev;