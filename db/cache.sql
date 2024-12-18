CREATE TABLE cache (
    url TEXT PRIMARY KEY,
    res_headers JSONB NOT NULL,
    res_body JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL CHECK(expires_at > created_at)
);

CREATE INDEX ix_expires_at ON cache (expires_at);