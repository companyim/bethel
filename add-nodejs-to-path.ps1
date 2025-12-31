# Node.js를 PATH에 추가하는 스크립트
# 관리자 권한으로 실행해야 합니다.

Write-Host "Node.js를 PATH에 추가하는 중..." -ForegroundColor Yellow

# 현재 시스템 PATH 가져오기
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Node.js 경로
$nodejsPath = "C:\Program Files\nodejs"

# 이미 PATH에 있는지 확인
if ($currentPath -like "*$nodejsPath*") {
    Write-Host "이미 PATH에 Node.js가 등록되어 있습니다." -ForegroundColor Green
} else {
    try {
        # 시스템 PATH에 추가
        [Environment]::SetEnvironmentVariable(
            "Path",
            $currentPath + ";$nodejsPath",
            "Machine"
        )
        Write-Host "성공! Node.js가 PATH에 추가되었습니다." -ForegroundColor Green
        Write-Host "변경사항을 적용하려면 PowerShell을 다시 시작하세요." -ForegroundColor Yellow
    } catch {
        Write-Host "오류: 관리자 권한이 필요합니다." -ForegroundColor Red
        Write-Host "PowerShell을 관리자 권한으로 실행한 후 다시 시도하세요." -ForegroundColor Red
    }
}

