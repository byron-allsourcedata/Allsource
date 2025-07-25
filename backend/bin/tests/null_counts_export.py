from decimal import ROUND_HALF_UP, Decimal
import json
import os
import sys
import logging

import argparse

parser = argparse.ArgumentParser(
    description="Collect column stats from a ClickHouse table."
)
parser.add_argument(
    "--output",
    type=str,
    required=True,
    help="Output JSON filename (e.g., stats_output.json)",
)
args = parser.parse_args()

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)


from config import ClickhouseConfig

logging.basicConfig(level=logging.INFO)

client = ClickhouseConfig.get_client()
table = ClickhouseConfig.users_table()

total_count_query = f"SELECT count() as total FROM {table}"
total_rows = client.query(total_count_query).result_rows[0][0]

SPECIAL_METRICS = {
    "mobile_phone_dnc_false": "countIf(mobile_phone_dnc = false)",
    "personal_email_valid": "countIf(startsWith(toString(personal_email_validation_status), 'Valid'))",
    "business_email_valid": "countIf(startsWith(toString(business_email_validation_status), 'Valid'))",
    "personal_seen_lt_30": "countIf(toRelativeDayNum(now()) - toRelativeDayNum(toDateTime(personal_email_last_seen)) < 30)",
    "personal_seen_lt_60": "countIf(toRelativeDayNum(now()) - toRelativeDayNum(toDateTime(personal_email_last_seen)) < 60)",
    "personal_seen_lt_90": "countIf(toRelativeDayNum(now()) - toRelativeDayNum(toDateTime(personal_email_last_seen)) < 90)",
    "business_seen_lt_30": "countIf(toRelativeDayNum(now()) - toRelativeDayNum(toDateTime(business_email_last_seen_date)) < 30)",
    "business_seen_lt_60": "countIf(toRelativeDayNum(now()) - toRelativeDayNum(toDateTime(business_email_last_seen_date)) < 60)",
    "business_seen_lt_90": "countIf(toRelativeDayNum(now()) - toRelativeDayNum(toDateTime(business_email_last_seen_date)) < 90)",
}


def format_percentage(count):
    return float(
        (Decimal(count) / Decimal(total_rows) * 100).quantize(
            Decimal("0.1"), rounding=ROUND_HALF_UP
        )
    )


def get_columns():
    columns = client.query(f"DESCRIBE TABLE {table}").result_rows
    return [col[0] for col in columns]


def get_top_10_values(column):
    logging.info(f"processing: {column}")
    query = f"""
        SELECT 
            ifNull(toString({column}), 'NULL') as val, 
            count() as cnt 
        FROM {table} 
        GROUP BY val 
        ORDER BY cnt DESC 
        LIMIT 10
    """

    results = client.query(query).named_results()
    out = {}
    for row in results:
        val = row["val"]
        cnt = row["cnt"]
        out[val] = {"count": cnt, "percentage": format_percentage(cnt)}
    return out


def get_special_metrics():
    metric_query = f"SELECT {', '.join(SPECIAL_METRICS.values())} FROM {table}"
    results = client.query(metric_query).result_rows[0]
    output = {}
    for i, key in enumerate(SPECIAL_METRICS.keys()):
        count = results[i]
        output[key] = {"count": count, "percentage": format_percentage(count)}
    return output


def main():
    final_result = {}

    for column in get_columns():
        try:
            final_result[column] = get_top_10_values(column)
        except Exception as e:
            logging.info(f"[SKIPPED] {column}: {e}")

    final_result.update(get_special_metrics())

    with open(args.output, "w") as f:
        json.dump(final_result, f, indent=2)


if __name__ == "__main__":
    main()
