#!/bin/bash
# Download every Westlake course-catalog department page.
#
# The catalog is a Finalsite board: the "all courses" page lists titles only,
# while each department page carries the full post — credit, grade, prerequisite
# and description. So we pull the department pages and parse those.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p pages
while read -r p; do
  [ -z "$p" ] && continue
  f="pages/$(echo "$p" | tr '/' '_').html"
  code=$(curl -sL -o "$f" -w "%{http_code}" "https://whs.eanesisd.net/coursecatalog/courses/$p")
  echo "$code $(grep -c '<article' "$f" || true) $p"
done < urls.txt
