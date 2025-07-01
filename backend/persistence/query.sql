


WITH a AS (
  SELECT *, row_number() OVER () AS rn FROM (SELECT * FROM (select u.asid from audience_sources_matched_persons p 
join enrichment_users u on u.id = p.enrichment_user_id 
where source_id = '6b301438-603e-4eca-8973-d7eac7af8847' order by u.asid)) sub
),
b AS (
  SELECT *, row_number() OVER () AS rn FROM (SELECT * FROM (
    select u.asid from audience_sources_matched_persons p 
    join enrichment_users u on u.id = p.enrichment_user_id 
    where source_id = '391e6798-3780-4260-9c31-501af0490b57' order by u.asid
    )) sub
)
SELECT *
FROM a
FULL OUTER JOIN b USING (rn)
WHERE a.* IS DISTINCT FROM b.*;
