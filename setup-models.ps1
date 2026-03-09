$ErrorActionPreference = "Continue"
$WebUIDir = "c:\Users\Dell\OneDrive\Desktop\ai-action-figure-generator\stable-diffusion-webui"

Write-Host "Starting RESILIENT setup of Stable Diffusion for RTX 3050..." -ForegroundColor Cyan

function Download-Resilient($Uri, $OutFile) {
    Write-Host "Downloading $Uri..." -ForegroundColor Yellow
    $retryCount = 0
    while ($retryCount -lt 5) {
        curl.exe -L -C - $Uri -o $OutFile
        if ($LASTEXITCODE -eq 0 -and (Test-Path $OutFile) -and ((Get-Item $OutFile).Length -gt 100MB)) { 
            Write-Host "Download successful!" -ForegroundColor Green
            return
        }
        $retryCount++
        Write-Host "Download interrupted, retrying ($retryCount/5)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    Write-Error "Failed to download $Uri after 5 attempts."
}

function Clone-Resilient($Repo, $Path) {
    if (Test-Path $Path) { return }
    Write-Host "Cloning $Repo..." -ForegroundColor Yellow
    $retryCount = 0
    while ($retryCount -lt 3) {
        git clone --depth 1 $Repo $Path
        if ($LASTEXITCODE -eq 0) { 
            Write-Host "Clone successful!" -ForegroundColor Green
            return
        }
        $retryCount++
        Remove-Item -Recurse -Force $Path -ErrorAction SilentlyContinue
        Write-Host "Clone failed, retrying ($retryCount/3)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

# 1. Disable SDXL
$SDXLPath = Join-Path $WebUIDir "models\Stable-diffusion\juggernautXL_ragnarokBy.safetensors"
if (Test-Path $SDXLPath) { Rename-Item -Path $SDXLPath -NewName "$SDXLPath.bak" -ErrorAction SilentlyContinue }

# 2. DreamShaper
Download-Resilient "https://huggingface.co/Lykon/DreamShaper/resolve/main/DreamShaper_8_pruned.safetensors" (Join-Path $WebUIDir "models\Stable-diffusion\DreamShaper_8.safetensors")

# 3. ControlNet Extension
Clone-Resilient "https://github.com/Mikubill/sd-webui-controlnet.git" (Join-Path $WebUIDir "extensions\sd-webui-controlnet")

# 4. OpenPose Model
$CNModelDir = Join-Path $WebUIDir "extensions\sd-webui-controlnet\models"
New-Item -ItemType Directory -Force -Path $CNModelDir | Out-Null
Download-Resilient "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_openpose.pth" (Join-Path $CNModelDir "control_v11p_sd15_openpose.pth")

# 5. Roop Extension
Clone-Resilient "https://github.com/s0md3v/sd-webui-roop.git" (Join-Path $WebUIDir "extensions\sd-webui-roop")

# 6. Roop Model
$RoopModelDir = Join-Path $WebUIDir "models\roop"
New-Item -ItemType Directory -Force -Path $RoopModelDir | Out-Null
Download-Resilient "https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx" (Join-Path $RoopModelDir "inswapper_128.onnx")

Write-Host "`nResilient Setup Complete!" -ForegroundColor Green
