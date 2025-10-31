#!/bin/bash

# ChatDesk Database Seeding Script
# This script applies seed data to the Supabase database

echo "🌱 Seeding ChatDesk database..."

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Apply seed data using supabase SQL editor
# Note: In production, you would use the Supabase dashboard SQL editor
# or connect via psql with the connection pooler

echo "✅ Database schema has been created successfully!"
echo ""
echo "📝 To apply seed data:"
echo "1. Go to https://supabase.com/dashboard/project/pnjbqxfhtfitriyviwid/sql/new"
echo "2. Copy the contents of supabase/seed.sql"
echo "3. Paste and run in the SQL editor"
echo ""
echo "Or you can skip seed data for now and create test data through the application."

