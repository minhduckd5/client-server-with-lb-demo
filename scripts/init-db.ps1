# PowerShell script to initialize database schema
# This script applies the schema to an existing PostgreSQL database

param(
    [string]$Host = $env:PG_HOST,
    [string]$Port = $env:PG_PORT,
    [string]$User = $env:PG_USER,
    [string]$Password = $env:PG_PASSWORD,
    [string]$Database = $env:PG_DATABASE
)

if (-not $Host) { $Host = "localhost" }
if (-not $Port) { $Port = "5432" }
if (-not $User) { $User = "postgres" }
if (-not $Database) { $Database = "ShoppingCS-LB" }

Write-Host "Initializing database schema..."
Write-Host "Connecting to database: $Database on ${Host}:${Port} as $User"

$env:PGPASSWORD = $Password
$schemaPath = Join-Path $PSScriptRoot "..\server\db\schema.sql"

psql -h $Host -p $Port -U $User -d $Database -f $schemaPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema initialized successfully!"
} else {
    Write-Host "Error initializing schema"
    exit 1
}



