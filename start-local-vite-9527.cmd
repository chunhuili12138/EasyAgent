@echo off
set VITE_SERVICE_BASE_URL=http://localhost:8081/api
set VITE_HTTP_PROXY=N
call pnpm.cmd dev -- --host 127.0.0.1 --port 9527 --strictPort > local-vite-9527.out.log 2> local-vite-9527.err.log
