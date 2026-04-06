PRAGMA foreign_keys = ON;

INSERT INTO users (id, first_name, last_name, email, password, is_admin)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Admin',
    'HBnB',
    'admin@hbnb.io',
    '$2b$12$KUnpwaj7WPPhzoif4adLD.hwpDMQDGdRj0mhd3n3gfLYj1Yk.sI.q',
    1
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO amenities (id, name)
VALUES
    (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
     substr(lower(hex(randomblob(2))), 2) || '-' ||
     substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
     lower(hex(randomblob(6))), 'WiFi'),
    (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
     substr(lower(hex(randomblob(2))), 2) || '-' ||
     substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
     lower(hex(randomblob(6))), 'Swimming Pool'),
    (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
     substr(lower(hex(randomblob(2))), 2) || '-' ||
     substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
     lower(hex(randomblob(6))), 'Air Conditioning')
ON CONFLICT(name) DO NOTHING;
