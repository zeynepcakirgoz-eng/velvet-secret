param(
    [string]$CommitMessage = ""
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class CredentialHelper {
    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public long LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    public static byte[] ReadBlob(string target) {
        IntPtr ptr;
        if (CredRead(target, 1, 0, out ptr)) {
            CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            return bytes;
        }
        return null;
    }
}
"@

$gitExe = 'C:\Users\zeynep\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe'
if (-not (Test-Path $gitExe)) {
    $found = Get-ChildItem -Path "$env:LOCALAPPDATA\GitHubDesktop" -Filter git.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $gitExe = $found.FullName }
}

Write-Host "Using Git from: $gitExe"

$raw = [CredentialHelper]::ReadBlob("GitHub - https://api.github.com/zeynepcakirgoz-eng")
if (-not $raw) {
    Write-Error "Could not retrieve token from Windows Credential Manager."
    exit 1
}

$token = [System.Text.Encoding]::UTF8.GetString($raw).Trim()
Write-Host "Retrieved GitHub token successfully (starts with $($token.Substring(0, 4))...)"

Set-Location C:\gamechanger

$pkgJson = Get-Content "C:\gamechanger\package.json" -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $CommitMessage) {
    $CommitMessage = $pkgJson.description
}

& $gitExe add .gitignore VelvetSecrets-debug.apk README.md README_TR.md SURUM_NOTLARI.md package.json .github/workflows/android-apk.yml git_sync.ps1 www/index.html www/style.css www/game.js www/assets/ www/js/
$status = & $gitExe status --porcelain
if ($status) {
    Write-Host "Committing changes with Turkish version description..."
    $msgFile = Join-Path $env:TEMP "commit_msg_utf8.txt"
    [System.IO.File]::WriteAllText($msgFile, $CommitMessage, (New-Object System.Text.UTF8Encoding($false)))
    & $gitExe commit -F $msgFile
    Remove-Item $msgFile -ErrorAction SilentlyContinue
} else {
    Write-Host "No unstaged changes to commit."
}

& $gitExe config http.postBuffer 524288000
$remoteUrl = "https://x-access-token:$token@github.com/zeynepcakirgoz-eng/velvet-secret.git"
Write-Host "Pushing to GitHub (including VelvetSecrets-debug.apk)..."
& $gitExe push $remoteUrl main:main

$headers = @{
    "Authorization" = "token $token"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "VelvetSecretsSync"
}
$repo = "zeynepcakirgoz-eng/velvet-secret"

try {
    $repoBody = @{
        description = $pkgJson.description
    } | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri "https://api.github.com/repos/$repo" -Headers $headers -Method Patch -Body ([System.Text.Encoding]::UTF8.GetBytes($repoBody)) -ContentType "application/json; charset=utf-8" | Out-Null
    Write-Host "Updated GitHub repository description in Turkish!"
} catch {
    Write-Warning "Could not update repo description: $_"
}

try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/tags/v1.0.0-demo" -Headers $headers -Method Get
    if ($release -and $release.id) {
        $notesText = [System.IO.File]::ReadAllText("C:\gamechanger\SURUM_NOTLARI.md", [System.Text.Encoding]::UTF8)
        $relUpdate = @{
            name = $pkgJson.description
            body = $notesText
        } | ConvertTo-Json -Compress
        Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/$($release.id)" -Headers $headers -Method Patch -Body ([System.Text.Encoding]::UTF8.GetBytes($relUpdate)) -ContentType "application/json; charset=utf-8" | Out-Null
        Write-Host "Updated GitHub Release (v3.0.0) notes in Turkish!"

        # Also upload VelvetSecrets-debug.apk directly to the GitHub Release assets
        $apkPath = "C:\gamechanger\VelvetSecrets-debug.apk"
        if (Test-Path $apkPath) {
            foreach ($asset in $release.assets) {
                if ($asset.name -eq "VelvetSecrets-debug.apk") {
                    Write-Host "Removing old release APK asset ($($asset.id))..."
                    Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/assets/$($asset.id)" -Headers $headers -Method Delete | Out-Null
                }
            }
            Write-Host "Uploading VelvetSecrets-debug.apk directly to GitHub Release..."
            $uploadUrl = "https://uploads.github.com/repos/$repo/releases/$($release.id)/assets?name=VelvetSecrets-debug.apk"
            Invoke-RestMethod -Uri $uploadUrl -Headers $headers -Method Post -InFile $apkPath -ContentType "application/vnd.android.package-archive" | Out-Null
            Write-Host "Successfully uploaded VelvetSecrets-debug.apk to GitHub Release!"
        }
    }
} catch {
    Write-Warning "Could not update release notes/assets via API: $_"
}

Write-Host "Git push and Turkish version notes sync completed!"
