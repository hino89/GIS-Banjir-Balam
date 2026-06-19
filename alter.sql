ALTER TABLE daerah_rawan 
ADD COLUMN IF NOT EXISTS elevasi DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS frekuensi_hujan VARCHAR(100);

-- Menghapus data daerah rawan yang bukan banjir (misalnya Longsor)
DELETE FROM daerah_rawan WHERE jenis_bencana ILIKE '%longsor%';
