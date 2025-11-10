#!/bin/bash

# Test script for all sample file pairs

echo "================================"
echo "sdiffx Sample Testing Suite"
echo "================================"
echo ""

echo "Building project..."
npm run build > /dev/null 2>&1

test_sample() {
  local original=$1
  local formatted=$2
  local description=$3

  echo -e "\n========== $description =========="
  echo "Files: $original ↔ $formatted"
  echo ""
  timeout 2 node dist/index.js "$original" "$formatted" 2>&1 || true
  echo ""
}

test_sample "sample_original.md" "sample_formatted.md" "Test 1: Formatting Changes"
test_sample "sample_missing_original.md" "sample_missing_formatted.md" "Test 2: Added Content"
test_sample "sample_extra_original.md" "sample_extra_formatted.md" "Test 3: Removed Content"

echo "================================"
echo "All tests completed!"
echo "================================"
