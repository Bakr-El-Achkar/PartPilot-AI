$ErrorActionPreference = "Stop"

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


function Write-Svg {
    param(
        [string]$Name,
        [string]$Content
    )

    $Path =
        Join-Path `
            $Destination `
            $Name

    Set-Content `
        -Path $Path `
        -Value $Content `
        -Encoding UTF8

    Write-Host "OK $Name"
}


Write-Host ""
Write-Host "Generating Vehnexa neutral brake reference assets..."
Write-Host ""


# ============================================================
# BRAKE PAD
# ============================================================

Write-Svg `
    -Name "brake-pad.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#ffffff"/>

  <g transform="translate(165 160)">
    <path
      d="M70 250 C75 125 155 60 280 60 C405 60 490 125 495 250 L450 350 L115 350 Z"
      fill="#30363c"
      stroke="#171b1f"
      stroke-width="15"
    />

    <path
      d="M125 245 C135 160 190 115 280 115 C370 115 425 160 440 245"
      fill="none"
      stroke="#727980"
      stroke-width="40"
    />

    <circle cx="150" cy="305" r="20" fill="#a8afb5"/>
    <circle cx="415" cy="305" r="20" fill="#a8afb5"/>

    <path
      d="M380 310 C390 215 460 155 565 155 C665 155 730 215 740 310 L700 400 L410 400 Z"
      fill="#444b51"
      stroke="#202429"
      stroke-width="14"
    />
  </g>

  <text
    x="500"
    y="620"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    BRAKE PAD
  </text>
</svg>
'@


# ============================================================
# BRAKE ROTOR
# ============================================================

Write-Svg `
    -Name "brake-rotor.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <defs>
    <radialGradient id="disc" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#f0f2f4"/>
      <stop offset="65%" stop-color="#b1b7bd"/>
      <stop offset="100%" stop-color="#747b82"/>
    </radialGradient>
  </defs>

  <rect width="1000" height="700" fill="#ffffff"/>

  <circle
    cx="500"
    cy="320"
    r="220"
    fill="url(#disc)"
    stroke="#5c6369"
    stroke-width="12"
  />

  <circle
    cx="500"
    cy="320"
    r="90"
    fill="#858c92"
    stroke="#555c62"
    stroke-width="10"
  />

  <circle
    cx="500"
    cy="320"
    r="37"
    fill="#ffffff"
  />

  <g fill="#ffffff">
    <circle cx="500" cy="245" r="17"/>
    <circle cx="571" cy="297" r="17"/>
    <circle cx="544" cy="381" r="17"/>
    <circle cx="456" cy="381" r="17"/>
    <circle cx="429" cy="297" r="17"/>
  </g>

  <circle
    cx="500"
    cy="320"
    r="164"
    fill="none"
    stroke="#d6dade"
    stroke-width="4"
  />

  <text
    x="500"
    y="620"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    BRAKE ROTOR
  </text>
</svg>
'@


# ============================================================
# BRAKE CALIPER
# ============================================================

Write-Svg `
    -Name "brake-caliper.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#ffffff"/>

  <g transform="translate(165 120)">
    <path
      d="M165 120
         C220 65 330 40 450 70
         C555 95 630 170 650 265
         L625 360
         C605 430 535 470 465 455
         L330 425
         C280 415 250 380 235 340
         L135 340
         C90 340 65 315 65 270
         L65 195
         C65 145 100 120 165 120 Z"
      fill="#555c62"
      stroke="#252a2f"
      stroke-width="16"
    />

    <path
      d="M300 140
         C355 115 450 120 505 160
         C550 195 575 245 570 300
         L500 290
         C495 245 460 215 410 210
         C355 205 310 230 290 275
         L215 260
         C220 205 245 165 300 140 Z"
      fill="#858c92"
    />

    <circle
      cx="160"
      cy="225"
      r="37"
      fill="#252a2f"
    />

    <circle
      cx="550"
      cy="372"
      r="28"
      fill="#252a2f"
    />
  </g>

  <text
    x="500"
    y="620"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    BRAKE CALIPER
  </text>
</svg>
'@


# ============================================================
# ABS WHEEL SPEED SENSOR
# ============================================================

Write-Svg `
    -Name "abs-wheel-speed-sensor.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#ffffff"/>

  <path
    d="M190 365
       C285 170 470 160 575 260
       C640 320 645 400 725 410"
    fill="none"
    stroke="#252a2f"
    stroke-width="30"
    stroke-linecap="round"
  />

  <g transform="translate(110 320)">
    <rect
      x="0"
      y="0"
      width="125"
      height="75"
      rx="22"
      fill="#4c5359"
    />

    <rect
      x="15"
      y="17"
      width="55"
      height="41"
      rx="12"
      fill="#6e757b"
    />
  </g>

  <g transform="translate(705 365)">
    <rect
      x="0"
      y="0"
      width="145"
      height="90"
      rx="24"
      fill="#41474c"
    />

    <rect
      x="105"
      y="20"
      width="75"
      height="50"
      rx="12"
      fill="#6d747a"
    />

    <circle
      cx="30"
      cy="45"
      r="12"
      fill="#c3c8cc"
    />
  </g>

  <text
    x="500"
    y="620"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    ABS WHEEL SPEED SENSOR
  </text>
</svg>
'@


# ============================================================
# BRAKE HOSE
# ============================================================

Write-Svg `
    -Name "brake-hose.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#ffffff"/>

  <path
    d="M190 380
       C315 170 655 165 805 365"
    fill="none"
    stroke="#252a2f"
    stroke-width="35"
    stroke-linecap="round"
  />

  <g transform="translate(110 340)">
    <rect
      x="0"
      y="0"
      width="110"
      height="55"
      rx="14"
      fill="#747b81"
    />

    <rect
      x="-45"
      y="12"
      width="60"
      height="31"
      rx="8"
      fill="#a7adb2"
    />
  </g>

  <g transform="translate(785 335)">
    <rect
      x="0"
      y="0"
      width="105"
      height="60"
      rx="14"
      fill="#747b81"
    />

    <rect
      x="90"
      y="14"
      width="65"
      height="31"
      rx="8"
      fill="#a7adb2"
    />
  </g>

  <rect
    x="465"
    y="220"
    width="70"
    height="52"
    rx="9"
    fill="#838a90"
  />

  <text
    x="500"
    y="620"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    BRAKE HOSE
  </text>
</svg>
'@


# ============================================================
# BRAKE FLUID
# ============================================================

Write-Svg `
    -Name "brake-fluid.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#ffffff"/>

  <g transform="translate(340 95)">
    <rect
      x="105"
      y="0"
      width="110"
      height="65"
      rx="12"
      fill="#30363b"
    />

    <path
      d="M75 65
         L245 65
         L280 125
         L280 430
         C280 465 255 490 220 490
         L100 490
         C65 490 40 465 40 430
         L40 125 Z"
      fill="#e7eaed"
      stroke="#737a80"
      stroke-width="12"
    />

    <rect
      x="67"
      y="185"
      width="186"
      height="150"
      rx="15"
      fill="#ffffff"
      stroke="#a7adb2"
      stroke-width="7"
    />

    <text
      x="160"
      y="245"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="33"
      font-weight="700"
      fill="#30363b"
    >
      BRAKE
    </text>

    <text
      x="160"
      y="285"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="33"
      font-weight="700"
      fill="#30363b"
    >
      FLUID
    </text>

    <text
      x="160"
      y="320"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="20"
      fill="#737a80"
    >
      DOT 4
    </text>
  </g>

  <text
    x="500"
    y="625"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    BRAKE FLUID
  </text>
</svg>
'@


# ============================================================
# BRAKE MASTER CYLINDER
# ============================================================

Write-Svg `
    -Name "brake-master-cylinder.svg" `
    -Content @'
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#ffffff"/>

  <g transform="translate(155 165)">
    <rect
      x="210"
      y="20"
      width="260"
      height="145"
      rx="35"
      fill="#eceff1"
      stroke="#8d949a"
      stroke-width="10"
    />

    <rect
      x="255"
      y="-15"
      width="70"
      height="45"
      rx="10"
      fill="#52595f"
    />

    <rect
      x="365"
      y="-15"
      width="70"
      height="45"
      rx="10"
      fill="#52595f"
    />

    <path
      d="M140 180
         L515 180
         C555 180 585 210 585 250
         L585 320
         C585 355 555 380 520 380
         L135 380
         C100 380 75 355 75 320
         L75 245
         C75 210 105 180 140 180 Z"
      fill="#737a80"
      stroke="#343a3f"
      stroke-width="12"
    />

    <rect
      x="0"
      y="245"
      width="110"
      height="70"
      rx="20"
      fill="#4b5156"
    />

    <rect
      x="570"
      y="245"
      width="110"
      height="70"
      rx="20"
      fill="#4b5156"
    />

    <circle
      cx="220"
      cy="280"
      r="27"
      fill="#b8bec3"
    />

    <circle
      cx="450"
      cy="280"
      r="27"
      fill="#b8bec3"
    />
  </g>

  <text
    x="500"
    y="620"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#667085"
  >
    BRAKE MASTER CYLINDER
  </text>
</svg>
'@


Write-Host ""
Write-Host "Neutral brake assets generated."
Write-Host ""

Get-ChildItem `
    $Destination `
    -Filter "*.svg" |
    Select-Object `
        Name,
        Length |
    Format-Table `
        -AutoSize