-- applicationsテーブルのRLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own applications"
  ON applications FOR ALL
  USING (auth.uid() = user_id);

-- email_logsテーブルのRLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own emails"
  ON email_logs FOR ALL
  USING (auth.uid() = user_id);

-- calendar_eventsテーブルのRLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can only see own events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id);
