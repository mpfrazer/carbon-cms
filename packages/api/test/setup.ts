// Stubs env vars that modules require at import time. Tests that actually
// hit the database set DATABASE_URL to a real value via their own setup.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
