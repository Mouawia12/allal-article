-- T30: Weighted average unit cost (CMP) per product.
-- Recalculated on every purchase receipt; used to value stock and inventory count variances.

alter table products
    add column if not exists cost_amount     numeric(14,4),
    add column if not exists cost_updated_at timestamptz;

-- Seed the cost of products that were already received before this column existed, using the
-- weighted average of what was actually paid for them. Without this, every tenant with purchase
-- history would start with no cost at all and could not value a stock count.
with purchased as (
    select i.product_id,
           sum(i.received_qty * i.unit_price) / nullif(sum(i.received_qty), 0) as avg_cost
    from purchase_order_items i
    join purchase_orders o on o.id = i.purchase_order_id
    where i.received_qty > 0
      and i.unit_price is not null
      and o.status in ('received', 'partially_received', 'closed')
    group by i.product_id
)
update products p
set cost_amount     = round(purchased.avg_cost, 4),
    cost_updated_at = now()
from purchased
where purchased.product_id = p.id
  and purchased.avg_cost is not null
  and p.cost_amount is null;
