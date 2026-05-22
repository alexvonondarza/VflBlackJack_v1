#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter @workspace/db build
pnpm --filter @workspace/api-zod build
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/spielgeld build
