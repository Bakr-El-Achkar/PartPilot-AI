$ErrorActionPreference = "Continue"

$FrontendRoot =
    Split-Path `
        -Parent `
        $PSScriptRoot

$Destination =
    Join-Path `
        $FrontendRoot `
        "public\product-parts"

New-Item `
    -ItemType Directory `
    -Force `
    -Path $Destination `
    | Out-Null


Write-Host ""
Write-Host "========================================="
Write-Host " Vehnexa Product Part Image Installer"
Write-Host "========================================="
Write-Host ""
Write-Host "Destination:"
Write-Host $Destination
Write-Host ""


# ============================================================
# ASSETS
#
# Each component gets its OWN image.
# No generic suspension/steering family image reuse.
# ============================================================

$Images = @(

    @{
        Name = "shock-absorber.jpg"

        Urls = @(
            "https://cdn.pkwteile.de/thumb?ccf=94078007&id=15810551&lng=ro&m=0&n=0"
        )
    },

    @{
        Name = "strut-assembly.jpg"

        Urls = @(
            "https://images.carid.com/fcs/suspension-parts/1331060r.jpg"
        )
    },

    @{
        Name = "control-arm.jpg"

        Urls = @(
            "https://i.ebayimg.com/images/g/E2cAAOSwz6Vi4I6d/s-l1200.jpg"
        )
    },

    @{
        Name = "wheel-hub-bearing.jpg"

        Urls = @(
            "https://i.ebayimg.com/00/s/MTYwMFgxNjAw/z/NlsAAOSwfM5n1-8B/%24_10.JPG?set_id=880000500F"
        )
    },

    @{
        Name = "outer-tie-rod.jpg"

        Urls = @(
            "https://partsengine.s3.ca-central-1.amazonaws.com/images/SKU/large/moog/ES800429.jpg"
        )
    },

    @{
        Name = "inner-tie-rod.jpg"

        Urls = @(
            "https://image-optimizer.autorus.ru/photos/b/39/36/14/393614c8-6a38-45f2-bb62-7d318d154c44.jpeg"
        )
    },

    @{
        Name = "power-steering-pump.jpg"

        Urls = @(
            "https://i.ebayimg.com/images/g/wroAAOSwZhVj2U74/s-l1200.jpg"
        )
    },

    @{
        Name = "power-steering-pressure-hose.jpg"

        Urls = @(
            "https://instockmotorsports.com/cdn/shop/files/NOS162-23477.jpg?v=1763235658"
        )
    }
)


# ============================================================
# HELPERS
# ============================================================

function Test-ValidImageFile {
    param(
        [string]$Path
    )

    if (
        -not (
            Test-Path $Path
        )
    ) {
        return $false
    }

    try {
        $File =
            Get-Item $Path

        # Reject tiny error/HTML files.
        return (
            $File.Length -gt 4000
        )
    }
    catch {
        return $false
    }
}


function Download-Image {
    param(
        [string]$Name,
        [string[]]$Urls
    )

    $OutputFile =
        Join-Path `
            $Destination `
            $Name

    $TemporaryFile =
        "$OutputFile.part"


    # --------------------------------------------------------
    # Already downloaded?
    # --------------------------------------------------------

    if (
        Test-ValidImageFile `
            $OutputFile
    ) {
        Write-Host "[SKIP] $Name already exists."

        return $true
    }


    if (
        Test-Path $OutputFile
    ) {
        Remove-Item `
            $OutputFile `
            -Force `
            -ErrorAction SilentlyContinue
    }


    foreach (
        $Url in $Urls
    ) {
        for (
            $Attempt = 1;
            $Attempt -le 3;
            $Attempt++
        ) {
            Write-Host ""
            Write-Host "[DOWNLOAD] $Name"
            Write-Host "Attempt: $Attempt / 3"
            Write-Host "Source: $Url"


            if (
                Test-Path $TemporaryFile
            ) {
                Remove-Item `
                    $TemporaryFile `
                    -Force `
                    -ErrorAction SilentlyContinue
            }


            # ------------------------------------------------
            # Use Windows curl instead of Invoke-WebRequest.
            #
            # curl handles redirects and CDN responses more
            # reliably for image assets.
            # ------------------------------------------------

            & curl.exe `
                -L `
                --fail `
                --silent `
                --show-error `
                --connect-timeout 15 `
                --max-time 90 `
                --retry 2 `
                --retry-delay 3 `
                --user-agent "Mozilla/5.0 Vehnexa-Demo/1.0" `
                --output $TemporaryFile `
                $Url


            $CurlExitCode =
                $LASTEXITCODE


            if (
                $CurlExitCode -eq 0 -and
                (
                    Test-ValidImageFile `
                        $TemporaryFile
                )
            ) {
                Move-Item `
                    $TemporaryFile `
                    $OutputFile `
                    -Force

                $Size =
                    (
                        Get-Item $OutputFile
                    ).Length

                Write-Host "[OK] $Name ($Size bytes)"

                return $true
            }


            Write-Host "[FAILED] $Name attempt $Attempt"


            if (
                Test-Path $TemporaryFile
            ) {
                Remove-Item `
                    $TemporaryFile `
                    -Force `
                    -ErrorAction SilentlyContinue
            }


            if (
                $Attempt -lt 3
            ) {
                $WaitSeconds =
                    $Attempt * 5

                Write-Host "Waiting $WaitSeconds seconds before retry..."

                Start-Sleep `
                    -Seconds $WaitSeconds
            }
        }
    }


    Write-Host ""
    Write-Host "[ERROR] Could not download $Name"

    return $false
}


# ============================================================
# DOWNLOAD
# ============================================================

$Successful = @()
$Failed = @()


foreach (
    $Image in $Images
) {
    $Result =
        Download-Image `
            -Name $Image.Name `
            -Urls $Image.Urls

    if (
        $Result
    ) {
        $Successful +=
            $Image.Name
    }
    else {
        $Failed +=
            $Image.Name
    }


    # Small courtesy delay.
    Start-Sleep `
        -Seconds 2
}


# ============================================================
# RESULT
# ============================================================

Write-Host ""
Write-Host "========================================="
Write-Host " Vehnexa Image Installation Result"
Write-Host "========================================="
Write-Host ""

Write-Host "Successful:"
foreach (
    $Name in $Successful
) {
    Write-Host "  OK $Name"
}


if (
    $Failed.Count -gt 0
) {
    Write-Host ""
    Write-Host "Failed:"

    foreach (
        $Name in $Failed
    ) {
        Write-Host "  X $Name"
    }
}


Write-Host ""
Write-Host "Files currently available:"
Write-Host ""

Get-ChildItem `
    $Destination |
    Select-Object `
        Name,
        Length |
    Format-Table `
        -AutoSize


if (
    $Failed.Count -gt 0
) {
    Write-Host ""
    Write-Host "Some images failed."
    Write-Host "Do not update page.tsx yet."
    Write-Host ""

    exit 1
}


Write-Host ""
Write-Host "All 8 Vehnexa component images are ready."
Write-Host ""

exit 0
