-- Simple QR Code Generation Script
-- Run this in Supabase SQL Editor to create test QR codes

-- Generate 10 generic codes (reusable with 24h cooldown)
INSERT INTO public.qr_codes (code, label, points_value, is_unique, metadata) VALUES
('BOTTLE-ABC123', 'Test Bottle Code 1', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-DEF456', 'Test Bottle Code 2', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-GHI789', 'Test Bottle Code 3', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-JKL012', 'Test Bottle Code 4', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-MNO345', 'Test Bottle Code 5', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-PQR678', 'Test Bottle Code 6', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-STU901', 'Test Bottle Code 7', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-VWX234', 'Test Bottle Code 8', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-YZA567', 'Test Bottle Code 9', 25, false, '{"batch": "test", "type": "generic"}'),
('BOTTLE-BCD890', 'Test Bottle Code 10', 25, false, '{"batch": "test", "type": "generic"}');

-- Generate 3 unique codes (single-use)
INSERT INTO public.qr_codes (code, label, points_value, is_unique, metadata) VALUES
('SPECIAL-UNIQUE1', 'Special Unique Code 1', 50, true, '{"batch": "test", "type": "unique"}'),
('SPECIAL-UNIQUE2', 'Special Unique Code 2', 50, true, '{"batch": "test", "type": "unique"}'),
('SPECIAL-UNIQUE3', 'Special Unique Code 3', 50, true, '{"batch": "test", "type": "unique"}');

-- Verify codes were created
SELECT code, label, points_value, is_unique, created_at 
FROM public.qr_codes 
ORDER BY created_at DESC;
