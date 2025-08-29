create table premium_sources_rows (
    premium_source_id UUID,
    row_id Int,
    sha256_email String
)
ENGINE = MergeTree
order by (premium_source_id, sha256_email);