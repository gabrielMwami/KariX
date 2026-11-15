-- Seed the published KariX street access points using the approved 41-street list.
-- Each street gets one verified access point at the approximate center of the street
-- as listed in Google Maps, rather than a full street line.

WITH street_points (street_label, slug, latitude, longitude) AS (
    VALUES
        ('Matumbi A', 'matumbi-a', -6.81365, 39.27252),
        ('Nyati', 'nyati', -6.81413, 39.27268),
        ('Faru', 'faru', -6.81457, 39.27284),
        ('Twiga', 'twiga', -6.81502, 39.27299),
        ('Ndovu', 'ndovu', -6.81570, 39.27252),
        ('Rufiji', 'rufiji', -6.81598, 39.27326),
        ('Muhoro', 'muhoro', -6.81674, 39.27249),
        ('Kariakoo', 'kariakoo', -6.81754, 39.27414),
        ('Mafia', 'mafia', -6.81833, 39.27474),
        ('Kikambawe', 'kikambawe', -6.81887, 39.27164),
        ('Swahili', 'swahili', -6.81907, 39.27508),
        ('Mzizima', 'mzizima', -6.81964, 39.27081),
        ('Jangwani', 'jangwani', -6.81996, 39.27250),
        ('Mkunguni', 'mkunguni', -6.82013, 39.27201),
        ('Likoma', 'likoma', -6.82029, 39.27152),
        ('Bondeni', 'bondeni', -6.82059, 39.27216),
        ('Msimbazi', 'msimbazi', -6.82088, 39.27279),
        ('Kongo', 'kongo', -6.82103, 39.27390),
        ('Muhonda', 'muhonda', -6.82243, 39.27119),
        ('Magila', 'magila', -6.82269, 39.27196),
        ('Masasi', 'masasi', -6.82335, 39.27150),
        ('Ndanda', 'ndanda', -6.82290, 39.27134),
        ('Lindi', 'lindi', -6.82722, 39.26915),
        ('Nyamwezi', 'nyamwezi', -6.82026, 39.27470),
        ('Amani', 'amani', -6.81580, 39.27637),
        ('Udowe', 'udowe', -6.81649, 39.27586),
        ('Kipande', 'kipande', -6.81448, 39.27670),
        ('Sikukuu', 'sikukuu', -6.82011, 39.27650),
        ('Narung''ombe', 'narungombe', -6.82011, 39.27651),
        ('Gogo', 'gogo', -6.82082, 39.27620),
        ('Mchikichini', 'mchikichini', -6.82150, 39.27593),
        ('Tandamuti', 'tandamuti', -6.81930, 39.27730),
        ('Livingstone', 'livingstone', -6.82005, 39.27790),
        ('Aggrey', 'aggrey', -6.82174, 39.27701),
        ('Kipata', 'kipata', -6.82288, 39.27702),
        ('Mbaruku', 'mbaruku', -6.82518, 39.27671),
        ('Lumumba', 'lumumba', -6.81947, 39.27926),
        ('Uhuru', 'uhuru', -6.82135, 39.27951),
        ('Somali', 'somali', -6.82359, 39.27786),
        ('Kiungani', 'kiungani', -6.82405, 39.27812),
        ('Kisarawe', 'kisarawe', -6.82512, 39.27863)
),
street_access_rows AS (
    SELECT
        s.street_id,
        sp.street_label AS access_point_name,
        'street_center' AS access_point_type,
        sp.latitude,
        sp.longitude,
        'Central access point for ' || sp.street_label || ' Street.' AS directions_en,
        'Sehemu ya katikati ya Mtaa wa ' || sp.street_label || '.' AS directions_sw,
        true AS is_active,
        'verified' AS verification_status
    FROM street_points sp
    JOIN public.streets s
      ON s.slug = sp.slug
    WHERE s.is_published = true
      AND NOT EXISTS (
          SELECT 1
          FROM public.street_access_points sap
          WHERE sap.street_id = s.street_id
            AND sap.access_point_name = sp.street_label
            AND sap.is_active = true
      )
)
INSERT INTO public.street_access_points (
    street_id,
    access_point_name,
    access_point_type,
    latitude,
    longitude,
    directions_en,
    directions_sw,
    is_active,
    verification_status
)
SELECT
    street_id,
    access_point_name,
    access_point_type,
    latitude,
    longitude,
    directions_en,
    directions_sw,
    is_active,
    verification_status
FROM street_access_rows;
