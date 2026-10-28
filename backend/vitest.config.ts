import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgresql://lifedrop_user:lifedrop_secure_pass_2026@localhost:5432/lifedrop_test?schema=public',
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test_super_secret_access_jwt_key_at_least_32_chars_long_2026',
      JWT_REFRESH_SECRET: 'test_super_secret_refresh_jwt_key_at_least_32_chars_long_2026',
      PORT: '5002',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
