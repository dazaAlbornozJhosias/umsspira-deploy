$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

$envFile = Join-Path (Get-Location) "apps\api\.env"
$line = Get-Content $envFile |
    Where-Object { $_ -match '^DIRECT_URL=' } |
    Select-Object -First 1

if (-not $line) {
    throw "No se encontro DIRECT_URL en apps/api/.env"
}

$sourceUrl = ($line -replace '^DIRECT_URL=', '').Trim('"')
$uri = [System.Uri]$sourceUrl

if ($uri.Host -notin @("localhost", "127.0.0.1")) {
    throw "Solo se permite PostgreSQL local."
}

$builder = [System.UriBuilder]$uri
$builder.Path = "/umsspira_test"
$testUrl = $builder.Uri.AbsoluteUri

if ($testUrl -notmatch '/umsspira_test(\?|$)') {
    throw "La URL no apunta a umsspira_test."
}

$env:DIRECT_URL = $testUrl
$env:DATABASE_URL = $testUrl

Write-Host "Verificando PostgreSQL de pruebas..." -ForegroundColor Cyan

$container = "umsspira-bd-s2-db-1"

docker exec $container pg_isready -U postgres -d postgres

if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL no esta disponible. Inicia el contenedor Docker."
}

Write-Host "Comprobando si existe umsspira_test..." -ForegroundColor Cyan

$dbExists = docker exec $container psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'umsspira_test';"

if ($LASTEXITCODE -ne 0) {
    throw "No se pudo consultar PostgreSQL."
}

if ($dbExists.Trim() -ne "1") {
    Write-Host "Creando base umsspira_test..." -ForegroundColor Yellow

    docker exec $container psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE umsspira_test;"

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear umsspira_test."
    }
}
else {
    Write-Host "umsspira_test ya existe. No se modificara su contenido." -ForegroundColor Green
}

docker exec umsspira-bd-s2-db-1 psql -U postgres -d umsspira_test -tAc "SELECT current_database();"

if ($LASTEXITCODE -ne 0) {
    throw "No se pudo conectar a umsspira_test."
}

Write-Host "Aplicando migraciones..." -ForegroundColor Cyan

pnpm.cmd --filter api exec prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    throw "Fallaron las migraciones."
}

Write-Host "Verificando estado de Prisma..." -ForegroundColor Cyan

pnpm.cmd --filter api exec prisma migrate status

if ($LASTEXITCODE -ne 0) {
    throw "Las migraciones no estan actualizadas."
}

Write-Host "Verificando restricciones de Radar..." -ForegroundColor Cyan

$sql = @"
DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'palabra_clave_area_peso_check'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'afinidad_radar_porcentaje_check'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'afinidad_radar_puntaje_check'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'palabra_clave_no_mapeada_frecuencia_check'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'palabra_clave_no_mapeada'
          AND indexname = 'palabra_clave_no_mapeada_id_titulado_termino_key'
          AND indexdef ILIKE '%UNIQUE%'
    ) THEN
        RAISE EXCEPTION 'Faltan restricciones de Radar';
    END IF;
END
`$`$;
"@

$sql | docker exec -i umsspira-bd-s2-db-1 psql -v ON_ERROR_STOP=1 -U postgres -d umsspira_test

if ($LASTEXITCODE -ne 0) {
    throw "Fallaron las verificaciones de Radar."
}

Write-Host "M1 de Radar verificada correctamente." -ForegroundColor Green

