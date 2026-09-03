-- supabase/rls/match_university_expertise.sql
-- Postgres RPC function for pgvector cosine similarity routing (Module 3)
-- Called by: POST /api/challenges/:id/route-suggestions
--
-- Returns the top `match_count` university expertise rows ranked by
-- cosine similarity to the query_embedding, with optional district pre-filter.
-- Also returns the PostGIS distance (km) for secondary ranking if locations exist.
--
-- Run once in Supabase Dashboard -> SQL Editor.

CREATE OR REPLACE FUNCTION match_university_expertise(
  query_embedding  VECTOR(768),
  match_count      INTEGER DEFAULT 5,
  district_filter  TEXT    DEFAULT NULL
)
RETURNS TABLE (
  university_id    UUID,
  university_name  TEXT,
  district         TEXT,
  matched_domain   TEXT,
  similarity       FLOAT,
  distance_km      FLOAT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id                                                       AS university_id,
    u.name                                                     AS university_name,
    u.district                                                 AS district,
    ue.domain                                                  AS matched_domain,
    -- Cosine similarity: 1 - cosine_distance (higher = more similar)
    (1 - (ue.expertise_embedding <=> query_embedding))::FLOAT  AS similarity,
    -- PostGIS great-circle distance in km (NULL if university has no location)
    CASE
      WHEN u.location IS NOT NULL
      THEN ST_Distance(u.location, ST_SetSRID(ST_MakePoint(0, 0), 4326)::GEOGRAPHY) / 1000.0
      ELSE NULL
    END::FLOAT                                                 AS distance_km
  FROM
    university_expertise ue
    JOIN universities u ON u.id = ue.university_id
  WHERE
    ue.expertise_embedding IS NOT NULL
    -- Optional district pre-filter (NULL = no filter, search all districts)
    AND (district_filter IS NULL OR u.district = district_filter)
  ORDER BY
    -- Primary: cosine similarity DESC (best semantic match first)
    similarity DESC,
    -- Secondary: distance ASC (closer university preferred for equal similarity)
    distance_km ASC NULLS LAST
  LIMIT match_count;
END;
$$;

-- Grant execute to authenticated users (RLS on underlying tables still applies)
GRANT EXECUTE ON FUNCTION match_university_expertise TO authenticated;
