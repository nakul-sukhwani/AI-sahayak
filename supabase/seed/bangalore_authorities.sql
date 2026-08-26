-- Seed: Bangalore BBMP Authorities
-- Run AFTER migration 002_create_authorities.sql

INSERT INTO authorities (name, department, email, phone, city, issue_types, wards) VALUES

-- Roads & Potholes
('BBMP Road Maintenance South', 'Roads & Infrastructure', 'roads.south@bbmp.gov.in', '080-22660000', 'Bangalore',
 ARRAY['pothole', 'road_damage', 'road_crack', 'speed_breaker', 'divider_damage'],
 ARRAY['Jayanagar', 'JP Nagar', 'Banashankari', 'Basavanagudi', 'Padmanabhanagar', 'Uttarahalli', 'Kengeri']),

('BBMP Road Maintenance North', 'Roads & Infrastructure', 'roads.north@bbmp.gov.in', '080-22660001', 'Bangalore',
 ARRAY['pothole', 'road_damage', 'road_crack', 'speed_breaker', 'divider_damage'],
 ARRAY['Yelahanka', 'Hebbal', 'Thanisandra', 'Dasarahalli', 'Byatarayanapura', 'RT Nagar']),

('BBMP Road Maintenance East', 'Roads & Infrastructure', 'roads.east@bbmp.gov.in', '080-22660002', 'Bangalore',
 ARRAY['pothole', 'road_damage', 'road_crack', 'speed_breaker', 'divider_damage'],
 ARRAY['Indiranagar', 'Domlur', 'HAL', 'Mahadevapura', 'Whitefield', 'KR Puram', 'Hoodi']),

('BBMP Road Maintenance West', 'Roads & Infrastructure', 'roads.west@bbmp.gov.in', '080-22660003', 'Bangalore',
 ARRAY['pothole', 'road_damage', 'road_crack', 'speed_breaker', 'divider_damage'],
 ARRAY['Rajajinagar', 'Vijayanagar', 'Malleswaram', 'Chamrajpet', 'Shivajinagar', 'Seshadripuram']),

-- Streetlights
('BBMP Street Lighting Division', 'Electrical', 'lighting@bbmp.gov.in', '080-22221400', 'Bangalore',
 ARRAY['streetlight', 'broken_streetlight', 'streetlight_not_working', 'electrical_hazard'],
 ARRAY['Jayanagar', 'JP Nagar', 'Indiranagar', 'Koramangala', 'Whitefield', 'Yelahanka', 'Rajajinagar',
       'Malleswaram', 'Hebbal', 'Banashankari', 'Basavanagudi']),

-- Garbage & Waste
('BBMP Solid Waste Management South', 'Solid Waste Management', 'swm.south@bbmp.gov.in', '080-22221111', 'Bangalore',
 ARRAY['garbage', 'waste_dumping', 'overflowing_bin', 'littering', 'construction_debris'],
 ARRAY['Jayanagar', 'JP Nagar', 'Banashankari', 'Basavanagudi', 'Padmanabhanagar', 'BTM Layout']),

('BBMP Solid Waste Management East', 'Solid Waste Management', 'swm.east@bbmp.gov.in', '080-22221112', 'Bangalore',
 ARRAY['garbage', 'waste_dumping', 'overflowing_bin', 'littering', 'construction_debris'],
 ARRAY['Indiranagar', 'Koramangala', 'Domlur', 'Whitefield', 'Mahadevapura', 'KR Puram']),

('BBMP Solid Waste Management North', 'Solid Waste Management', 'swm.north@bbmp.gov.in', '080-22221113', 'Bangalore',
 ARRAY['garbage', 'waste_dumping', 'overflowing_bin', 'littering', 'construction_debris'],
 ARRAY['Yelahanka', 'Hebbal', 'Thanisandra', 'RT Nagar', 'Dasarahalli']),

-- Water & Drainage
('BWSSB Water Supply', 'Water Supply', 'water@bwssb.gov.in', '1800-425-2920', 'Bangalore',
 ARRAY['water_shortage', 'no_water', 'contaminated_water', 'water_leak', 'broken_pipe'],
 ARRAY['Jayanagar', 'JP Nagar', 'Indiranagar', 'Koramangala', 'Whitefield', 'Yelahanka',
       'Malleswaram', 'Rajajinagar', 'Hebbal', 'Banashankari']),

('BBMP Drainage & Sewage', 'Drainage', 'drainage@bbmp.gov.in', '080-22221300', 'Bangalore',
 ARRAY['drainage_block', 'sewage_overflow', 'manhole_open', 'manhole_damaged', 'flooding', 'waterlogging'],
 ARRAY['Jayanagar', 'JP Nagar', 'Indiranagar', 'Koramangala', 'Whitefield', 'Yelahanka',
       'Malleswaram', 'Rajajinagar', 'Hebbal', 'Banashankari', 'BTM Layout']),

-- Parks & Footpaths
('BBMP Parks & Open Spaces', 'Parks', 'parks@bbmp.gov.in', '080-22660100', 'Bangalore',
 ARRAY['park_damage', 'broken_bench', 'overgrown_vegetation', 'fallen_tree', 'tree_branch'],
 ARRAY['Jayanagar', 'JP Nagar', 'Cubbon Park Area', 'Lalbagh Area', 'Indiranagar', 'Koramangala']),

('BBMP Footpath & Encroachment', 'Roads & Infrastructure', 'footpath@bbmp.gov.in', '080-22660200', 'Bangalore',
 ARRAY['footpath_damage', 'footpath_encroachment', 'broken_footpath', 'unauthorized_construction'],
 ARRAY['Jayanagar', 'JP Nagar', 'Indiranagar', 'Koramangala', 'MG Road', 'Commercial Street']),

-- General / Default
('BBMP General Complaints', 'General Administration', 'complaints@bbmp.gov.in', '1800-425-2225', 'Bangalore',
 ARRAY['other', 'unknown', 'general'],
 ARRAY['Jayanagar', 'JP Nagar', 'Banashankari', 'Basavanagudi', 'Indiranagar', 'Koramangala',
       'Whitefield', 'Yelahanka', 'Malleswaram', 'Rajajinagar', 'Hebbal', 'BTM Layout',
       'Mahadevapura', 'KR Puram', 'RT Nagar', 'Dasarahalli', 'Vijayanagar']);

-- Key Bangalore Wards
INSERT INTO wards (name, city, center_lat, center_lng) VALUES
('Jayanagar', 'Bangalore', 12.9308, 77.5838),
('JP Nagar', 'Bangalore', 12.9083, 77.5850),
('Banashankari', 'Bangalore', 12.9252, 77.5468),
('Basavanagudi', 'Bangalore', 12.9425, 77.5740),
('Indiranagar', 'Bangalore', 12.9784, 77.6408),
('Koramangala', 'Bangalore', 12.9352, 77.6245),
('Whitefield', 'Bangalore', 12.9698, 77.7499),
('Yelahanka', 'Bangalore', 13.1007, 77.5963),
('Malleswaram', 'Bangalore', 13.0035, 77.5668),
('Rajajinagar', 'Bangalore', 12.9980, 77.5530),
('Hebbal', 'Bangalore', 13.0358, 77.5970),
('BTM Layout', 'Bangalore', 12.9166, 77.6101),
('Mahadevapura', 'Bangalore', 12.9957, 77.7025),
('KR Puram', 'Bangalore', 13.0079, 77.6940),
('RT Nagar', 'Bangalore', 13.0241, 77.5949),
('Dasarahalli', 'Bangalore', 13.0480, 77.5149),
('Vijayanagar', 'Bangalore', 12.9717, 77.5370),
('Padmanabhanagar', 'Bangalore', 12.9116, 77.5600),
('Uttarahalli', 'Bangalore', 12.8860, 77.5469),
('Kengeri', 'Bangalore', 12.9057, 77.4855),
('Domlur', 'Bangalore', 12.9601, 77.6384),
('HAL', 'Bangalore', 12.9618, 77.6677),
('Hoodi', 'Bangalore', 12.9887, 77.7221),
('Thanisandra', 'Bangalore', 13.0635, 77.6253),
('Byatarayanapura', 'Bangalore', 13.0607, 77.5746),
('Seshadripuram', 'Bangalore', 13.0027, 77.5715),
('Shivajinagar', 'Bangalore', 12.9862, 77.6033),
('Chamrajpet', 'Bangalore', 12.9620, 77.5653);
