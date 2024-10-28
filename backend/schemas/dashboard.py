from typing import Dict

from pydantic import BaseModel


class DailyDataItem(BaseModel):
    total_leads: int
    visitors: int
    view_products: int
    abandoned_cart: int


class TotalCounts(BaseModel):
    total_contacts_collected: int
    total_visitors: int
    total_view_products: int
    total_abandoned_cart: int


class ContactResponse(BaseModel):
    daily_data: Dict[str, DailyDataItem]
    total_counts: TotalCounts


class DailyRevenueData(BaseModel):
    total_price: float
    visitor: float
    viewed_product: float
    abandoned_cart: float


class TotalCounts(BaseModel):
    total_revenue: float
    total_visitors: float
    total_view_products: float
    total_abandoned_cart: float


class TotalOrders(BaseModel):
    total_orders_abandoned_cart: int
    total_orders_view_products: int
    total_orders_visitors: int


class AverageOrder(BaseModel):
    average_order_visitors: float
    average_order_abandoned_cart: float
    average_order_view_products: float


class RevenueResponse(BaseModel):
    daily_data: Dict[str, DailyRevenueData]
    total_counts: TotalCounts
    total_order: TotalOrders
    average_order: AverageOrder
    ROI: float
    lifetime_revenue: int
