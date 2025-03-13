from datetime import datetime
from typing import Optional, List

from sqlalchemy.orm import Query

from enums import TypeOfSourceOrigin, TypeOfCustomer
from models.audience_sources import AudienceSource


def apply_filters(
        query: Query,
        name: Optional[str] = None,
        source: Optional[TypeOfSourceOrigin] = None,
        type_customer: Optional[List[TypeOfCustomer]] = None,
        domain_id: Optional[int] = None,
        created_date_start: Optional[datetime] = None,
        created_date_end: Optional[datetime] = None
) -> Query:
    filters = []

    if name:
        filters.append(AudienceSource.name.ilike(f"%{name}%"))
    if source:
        type_source_origin = source.value
        filters.append(AudienceSource.source_origin == type_source_origin)
    if type_customer:
        type_customer_values = [tc.value for tc in type_customer]
        filters.append(AudienceSource.source_type.in_(type_customer_values))
    if domain_id is not None:
        filters.append(AudienceSource.domain_id == domain_id)
    if created_date_start and created_date_end:
        filters.append(AudienceSource.created_at.between(created_date_start, created_date_end))
    elif created_date_start:
        filters.append(AudienceSource.created_at >= created_date_start)
    elif created_date_end:
        filters.append(AudienceSource.created_at <= created_date_end)

    if filters:
        query = query.filter(*filters)

    return query