import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e',
  testMatch:'*.spec.js',
  timeout:60000,
  expect:{timeout:9000},
  use:{baseURL:'http://127.0.0.1:5173',trace:'retain-on-failure',...devices['Desktop Chrome']},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  reporter:'list',
  webServer:{
    command:'npm run dev -- --host 127.0.0.1',
    url:'http://127.0.0.1:5173/game.html',
    reuseExistingServer:!process.env.CI,
    timeout:60000
  }
});
