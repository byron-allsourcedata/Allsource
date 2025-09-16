# domains/premium_sources/sync/config.py
META_BATCH_SIZE = 10_000
GOOGLE_BATCH_SIZE = 50_000
FILLER_CONCURRENCY = 8  # сколько sync'ов параллельно формировать
SYNC_API_CONCURRENCY = (
    4  # сколько параллельных HTTP/SDK вызовов к одному интегратору
)
QUEUE_PREFETCH = 20  # prefetch для rabbitmq
THREADPOOL_MAX_WORKERS = 12  # пул для run_in_executor (blocking ops)
RETRY_ATTEMPTS = 3
RETRY_BACKOFF_BASE = 1.0
