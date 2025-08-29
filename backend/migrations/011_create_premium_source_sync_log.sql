CREATE TABLE premium_sources_sync_log
(
    premium_source_id UUID,
    premium_source_sync_id UUID,
    row_id UInt32,
    synced Enum('failed', 'in_progress', 'synced'),
    error_message Nullable(String),    
    updated_at DateTime DEFAULT now()   
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (premium_source_id, premium_source_sync_id, row_id);
