CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version TEXT NOT NULL,
  consent_decision JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversion_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversion_type TEXT NOT NULL,
  conversion_date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 1,
  UNIQUE(conversion_type, conversion_date)
);
