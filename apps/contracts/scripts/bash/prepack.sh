#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)/packages/contracts"

pnpm clean
pnpm compile

mkdir -p contracts/build/contracts
cp -rfn artifacts/contracts/**/*.json contracts/build/contracts
cp -rfn artifacts/contracts/interfaces/**/*.json contracts/build/contracts
rm -rf contracts/build/contracts/*.dbg.json
