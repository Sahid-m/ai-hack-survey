-- Initialize PostgreSQL database with Prisma
-- This script will be run automatically when Prisma generates the database

-- Updated for PostgreSQL-specific syntax and optimizations
-- Create indexes for better performance on PostgreSQL
CREATE INDEX IF NOT EXISTS idx_annotations_session_id ON annotations(session_id);
CREATE INDEX IF NOT EXISTS idx_annotations_image_index ON annotations(image_index);
CREATE INDEX IF NOT EXISTS idx_annotations_object_type ON annotations(object_type);
CREATE INDEX IF NOT EXISTS idx_classifications_session_id ON classifications(session_id);
CREATE INDEX IF NOT EXISTS idx_classifications_image_index ON classifications(image_index);
CREATE INDEX IF NOT EXISTS idx_classifications_rating ON classifications(rating);

-- Added PostgreSQL-specific performance optimizations
-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_annotations_session_image ON annotations(session_id, image_index);
CREATE INDEX IF NOT EXISTS idx_classifications_session_image ON classifications(session_id, image_index);

-- Added PostgreSQL-specific table optimizations
-- Enable auto-vacuum for better performance
ALTER TABLE survey_sessions SET (autovacuum_enabled = true);
ALTER TABLE annotations SET (autovacuum_enabled = true);
ALTER TABLE classifications SET (autovacuum_enabled = true);

-- Insert some sample data for testing (optional)
-- This can be removed in production
