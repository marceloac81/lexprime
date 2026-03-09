-- Migration: create activity_logs table and triggers for audit logging
-- Table to store activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    details JSONB
);

-- Function to insert log entry
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    usr_id UUID;
    usr_name TEXT;
BEGIN
    SELECT id, name INTO usr_id, usr_name FROM team_members WHERE id = auth.uid();
    INSERT INTO activity_logs (
        user_id,
        user_name,
        action,
        table_name,
        record_id,
        details
    ) VALUES (
        usr_id,
        usr_name,
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tables
CREATE TRIGGER trg_log_cases AFTER INSERT OR UPDATE OR DELETE ON cases
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trg_log_deadlines AFTER INSERT OR UPDATE OR DELETE ON deadlines
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER trg_log_clients AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION log_activity();
