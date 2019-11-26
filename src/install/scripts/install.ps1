new-module -name Omnitruck -scriptblock {
[Console]::OutputEncoding = New-Object -typename System.Text.ASCIIEncoding
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]'Tls,Tls11,Tls12'

function Get-PlatformVersion {
  switch -regex ((Get-Win32OS).version) {
    '10\.0\.\d+' {$platform_version = '2016'}
    '6\.3\.\d+'  {$platform_version = '2012r2'}
    '6\.2\.\d+'  {$platform_version = '2012'}
    '6\.1\.\d+'  {$platform_version = '2008r2'}
    '6\.0\.\d+'  {$platform_version = '2008'}
  }

  if(Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Server\ServerLevels') {
    $levels = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Server\ServerLevels'
    if($levels.NanoServer -eq 1) { $platform_version += 'nano' }
  }

  return $platform_version
}

function Get-PlatformArchitecture {
  if ((Get-Win32OS).osarchitecture -like '64-bit') {
    $architecture = 'x86_64'
  } else {
    $architecture = 'i386'
  }
  return $architecture
}

function Get-Win32OS {
  if(!$global:win32OS)
  {
    $global:win32OS = Get-WMIQuery win32_operatingsystem
  }
  $global:win32OS
}

function New-Uri {
  param ($baseuri, $newuri)

  try {
    $base = new-object System.Uri $baseuri
    new-object System.Uri $base, $newuri
  }
  catch [System.Management.Automation.MethodInvocationException]{
    Write-Error "$($_.exception.message)"
    throw $_.exception
  }
}

function Get-WebContent {
  param ($uri, $filepath)

  try {
    if($PSVersionTable.PSEdition -eq 'Core') {
      Get-WebContentOnCore $uri $filepath
    }
    else {
      Get-WebContentOnFullNet $uri $filepath
    }
  }
  catch {
    $exception = $_.Exception
    Write-Host "There was an error: "
    do {
      Write-Host "`t$($exception.message)"
      $exception = $exception.innerexception
    } while ($exception)
    throw "Failed to download from $uri."
  }
}

function Get-WebContentOnFullNet {
  param ($uri, $filepath)

  $proxy = New-Object -TypeName System.Net.WebProxy
  $wc = new-object System.Net.WebClient
  $wc.Headers.Add("user-agent", "mixlib-install/3.11.21")
  $proxy.Address = $env:http_proxy
  $wc.Proxy = $proxy

  if ([string]::IsNullOrEmpty($filepath)) {
    $wc.downloadstring($uri)
  }
  else {
    $wc.downloadfile($uri, $filepath)
  }
}

function Get-WebContentOnCore {
  param ($uri, $filepath)

  $handler = New-Object System.Net.Http.HttpClientHandler
  $client = New-Object System.Net.Http.HttpClient($handler)
  $client.DefaultRequestHeaders.UserAgent.ParseAdd("mixlib-install/3.11.21")
  $client.Timeout = New-Object System.TimeSpan(0, 30, 0)
  $cancelTokenSource = [System.Threading.CancellationTokenSource]::new()
  $responseMsg = $client.GetAsync([System.Uri]::new($uri), $cancelTokenSource.Token)
  $responseMsg.Wait()
  if (!$responseMsg.IsCanceled) {
    $response = $responseMsg.Result
    if ($response.IsSuccessStatusCode) {
      if ([string]::IsNullOrEmpty($filepath)) {
        $response.Content.ReadAsStringAsync().Result
      }
      else {
        $downloadedFileStream = [System.IO.FileStream]::new($filepath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
        $copyStreamOp = $response.Content.CopyToAsync($downloadedFileStream)
        $copyStreamOp.Wait()
        $downloadedFileStream.Close()
        if ($copyStreamOp.Exception -ne $null) {
          throw $copyStreamOp.Exception
        }
      }
    }
  }
}

function Test-ProjectPackage {
  [cmdletbinding()]
  param ($Path, $Algorithm = 'SHA256', $Hash)
  if (!$env:Valid_ProjectPackage){
    Write-Verbose "Testing the $Algorithm hash for $path."
    $ActualHash = (Custom-GetFileHash -Algorithm $Algorithm -Path $Path).Hash.ToLower()

    Write-Verbose "`tDesired Hash - '$Hash'"
    Write-Verbose "`tActual Hash  - '$ActualHash'"
    $env:Valid_ProjectPackage = $ActualHash -eq $Hash
    if (-not $env:Valid_ProjectPackage) {
      Write-Error "Failed to validate the downloaded installer.  The expected $Algorithm hash was '$Hash' and the actual hash was '$ActualHash' for $path"
    }
  }
  return $env:Valid_ProjectPackage
}

function Custom-GetFileHash ($Path, $Algorithm) {
  function disposable($o){($o -is [IDisposable]) -and (($o | get-member | foreach-object {$_.name}) -contains 'Dispose')}
  function use($obj, [scriptblock]$sb){try {& $sb} catch [exception]{throw $_} finally {if (disposable $obj) {$obj.Dispose()}} }
  $Path = (resolve-path $Path).providerpath
  $hash = @{Algorithm = $Algorithm; Path = $Path}
  use ($c = Get-SHA256Converter) {
    use ($in = (gi $Path).OpenRead()) {
      $hash.Hash = ([BitConverter]::ToString($c.ComputeHash($in))).Replace("-", "").ToUpper()
    }
  }
  return $hash
}

function Get-SHA256Converter {
  if ($(Is-FIPS) -ge 1) {
    New-Object -TypeName Security.Cryptography.SHA256Cng
  } else {
    if($PSVersionTable.PSEdition -eq 'Core') {
      [System.Security.Cryptography.SHA256]::Create()
    }
    else {
      New-Object -TypeName Security.Cryptography.SHA256Managed
    }
  }
}

function Is-FIPS {
  if (!$env:fips){
    $env:fips = (Get-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\Lsa\FipsAlgorithmPolicy).Enabled
  }
  return $env:fips
}

function Get-WMIQuery {
  param ($class)

  if(Get-Command -Name Get-CimInstance -ErrorAction SilentlyContinue) {
    Get-CimInstance $class
  }
  else {
    Get-WmiObject $class
  }
}

function Get-ProjectMetadata {
  <#
    .SYNOPSIS
    Get metadata for a Chef Software, Inc. project
    .DESCRIPTION
    Get metadata for project
    .EXAMPLE
    iex (new-object net.webclient).downloadstring('https://omnitruck.chef.io/install.ps1'); Get-ProjectMetadata -project chef -channel stable

    Gets the download url and SHA256 checksum for the latest stable release of Chef.
    .EXAMPLE
    iex (irm 'https://omnitruck.chef.io/install.ps1'); Get-ProjectMetadata -project chefdk -channel stable -version 0.8.0

    Gets the download url and SHA256 checksum for ChefDK 0.8.0.
  #>
  [cmdletbinding()]
  param (
    # Base url to retrieve metadata from.
    [uri]$base_server_uri = 'https://omnitruck.chef.io',
    [string]
    # Project to install
    [string]
    $project = 'chef',
    # Version of the application to install
    # This parameter is optional, if not supplied it will provide the latest version,
    # and if an iteration number is not specified, it will grab the latest available iteration.
    # Partial version numbers are also acceptable (using v=11
    # will grab the latest 11.x client which matches the other flags).
    [string]
    $version,
    # Release channel to install from
    [validateset('current', 'stable', 'unstable')]
    [string]
    $channel = 'stable',
    # The following legacy switches are just aliases for the current channel
    [switch]
    $prerelease,
    [switch]
    $nightlies,
    [validateset('auto', 'i386', 'x86_64')]
    [string]
    $architecture = 'auto'
  )

  # The following legacy switches are just aliases for the current channel
  if (($prerelease -eq $true)) { $channel = 'current'}
  if (($nightlies -eq $true)) { $channel = 'current'}

  # PowerShell is only on Windows ATM
  $platform = 'windows'
  Write-Verbose "Platform: $platform"

  $platform_version = Get-PlatformVersion
  Write-Verbose "Platform Version: $platform_version"

  if ($architecture -eq 'auto') {
    $architecture = Get-PlatformArchitecture
  }

  Write-Verbose "Architecture: $architecture"
  Write-Verbose "Project: $project"

  $metadata_base_url = "/$($channel)/$($project)/metadata"
  $metadata_array = ("?v=$($version)",
    "p=$platform",
    "pv=$platform_version",
    "m=$architecture")
  $metadata_base_url += [string]::join('&', $metadata_array)
  $metadata_url = new-uri $base_server_uri $metadata_base_url

  Write-Verbose "Downloading $project details from $metadata_url"
  $package_metadata = (Get-WebContent $metadata_url).trim() -split '\n' |
    foreach { $hash = @{} } {$key, $value = $_ -split '\s+'; $hash.Add($key, $value)} {$hash}

  Write-Verbose "Project details: "
  foreach ($key in $package_metadata.keys) {
    Write-Verbose "`t$key = $($package_metadata[$key])"
  }
  $package_metadata
}

function Install-Project {
  <#
    .SYNOPSIS
    Install a Chef Software, Inc. product
    .DESCRIPTION
    Install a Chef Software, Inc. product
    .EXAMPLE
    iex (new-object net.webclient).downloadstring('https://omnitruck.chef.io/install.ps1'); Install-Project -project chef -channel stable

    Installs the latest stable version of Chef.
    .EXAMPLE
    iex (irm 'https://omnitruck.chef.io/install.ps1'); Install-Project -project chefdk -channel current

    Installs the latest integration build of the Chef Development Kit
  #>
  [cmdletbinding(SupportsShouldProcess=$true)]
  param (
    # Project to install
    [string]
    $project = 'chef',
    # Release channel to install from
    [validateset('current', 'stable', 'unstable')]
    [string]
    $channel = 'stable',
    # Version of the application to install
    # This parameter is optional, if not supplied it will provide the latest version,
    # and if an iteration number is not specified, it will grab the latest available iteration.
    # Partial version numbers are also acceptable (using v=11
    # will grab the latest 11.x client which matches the other flags).
    [string]
    $version,
    # Full path for the downloaded installer.
    [string]
    $filename,
    # Full path to the location to download the installer
    [string]
    $download_directory = $env:temp,
    # The following legacy switches are just aliases for the current channel
    [switch]
    $prerelease,
    [switch]
    $nightlies,
    [validateset('auto', 'i386', 'x86_64')]
    [string]
    $architecture = 'auto',
    [validateset('auto', 'service', 'task')]
    [string]
    $daemon = 'auto',
    [string]
    $http_proxy,
    # Specify an alternate download url
    [string]
    $download_url_override,
    # SHA256 checksum to verify cached files (optional)
    [string]
    $checksum,
    # Set to 'once' to skip install if project is detected
    [string]
    $install_strategy
  )

  if ((Test-Path "$env:systemdrive\opscode\$project\embedded") -and ($install_strategy -eq 'once')) {
    Write-Host "$project installation detected"
    Write-Host "install_strategy set to 'once'"
    Write-Host "Nothing to install"
    exit
  }

  # Set http_proxy as env var
  if(-not [string]::IsNullOrEmpty($http_proxy)) {
    $env:http_proxy = $http_proxy
  }

  $cached_installer_available = $false
  $verify_checksum = $true
  
  if (-not [string]::IsNullOrEmpty($download_url_override)) {
    $download_url = $download_url_override
    $sha256 = $checksum
  } else {
    $package_metadata = Get-ProjectMetadata -project $project -channel $channel -version $version -prerelease:$prerelease -nightlies:$nightlies -architecture $architecture
    $download_url = $package_metadata.url
    $sha256 = $package_metadata.sha256
  }

  if (-not [string]::IsNullOrEmpty($filename)) {
    $download_directory = split-path $filename
    $filename = split-path $filename -leaf
    if ([string]::IsNullOrEmpty($download_directory)) {
      $download_directory = $pwd
    }
  }
  else {
    $filename = ($download_url -split '/')[-1]
  }
  Write-Verbose "Download directory: $download_directory"
  Write-Verbose "Filename: $filename"

  if (-not (test-path $download_directory)) {
    mkdir $download_directory
  }

  $download_directory = (resolve-path $download_directory).providerpath
  $download_destination = join-path $download_directory $filename

  if ((test-path $download_destination)) {
    Write-Verbose "Found existing installer at $download_destination."
    if (-not [string]::IsNullOrEmpty($sha256)) {
      Write-Verbose "Checksum specified"
      $valid_checksum = Test-ProjectPackage -Path $download_destination -Algorithm 'SHA256' -Hash $sha256
      if ($valid_checksum -eq $true) {
        Write-Verbose "Checksum verified, using existing installer."
        $cached_installer_available=$true # local file OK
        $verify_checksum = $false # no need to re-verify checksums
      }
      else {
        Write-Verbose "Checksum mismatch, ignoring existing installer."
        $cached_installer_available=$false # bad local file
        $verify_checksum = $false # re-verify checksums
      }
    }
    else {
      Write-Verbose "Checksum not specified, existing installer ignored."
      $cached_installer_available=$false # ignore local file
      $verify_checksum = $false # no checksum to compare
    }
  }

  if (-not ($cached_installer_available)) {
    if ($pscmdlet.ShouldProcess("$($download_url)", "Download $project")) {
      Write-Verbose "Downloading $project from $($download_url) to $download_destination."
      Get-WebContent $download_url -filepath $download_destination
    }
  }

  if ($pscmdlet.ShouldProcess("$download_destination", "Installing")) {
    if (($verify_checksum) -and (-not (Test-ProjectPackage -Path $download_destination -Algorithm 'SHA256' -Hash $sha256))) {
      throw "Failed to validate the downloaded installer for $project."
    }

    Write-Host "Installing $project from $download_destination"
    $installingProject = $True
    $installAttempts = 0
    while ($installingProject) {
      $installAttempts++
      $result = $false
      if($download_destination.EndsWith(".appx")) {
        $result = Install-ChefAppx $download_destination $project
      }
      else {
        $result = Install-ChefMsi $download_destination $daemon
      }
      if(!$result) { continue }
      $installingProject = $False
    }
  }
}
set-alias install -value Install-Project

Function Install-ChefMsi($msi, $addlocal) {
  if ($addlocal -eq "service") {
    $p = Start-Process -FilePath "msiexec.exe" -ArgumentList "/qn /i $msi ADDLOCAL=`"ChefClientFeature,ChefServiceFeature`"" -Passthru -Wait -NoNewWindow
  }
  ElseIf ($addlocal -eq "task") {
    $p = Start-Process -FilePath "msiexec.exe" -ArgumentList "/qn /i $msi ADDLOCAL=`"ChefClientFeature,ChefSchTaskFeature`"" -Passthru -Wait -NoNewWindow
  }
  ElseIf ($addlocal -eq "auto") {
    $p = Start-Process -FilePath "msiexec.exe" -ArgumentList "/qn /i $msi" -Passthru -Wait -NoNewWindow
  }

  $p.WaitForExit()
  if ($p.ExitCode -eq 1618) {
    Write-Host "$((Get-Date).ToString()) - Another msi install is in progress (exit code 1618), retrying ($($installAttempts))..."
    return $false
  } elseif ($p.ExitCode -ne 0) {
    throw "msiexec was not successful. Received exit code $($p.ExitCode)"
  }
  return $true
}

Function Install-ChefAppx($appx, $project) {
  Add-AppxPackage -Path $appx -ErrorAction Stop
  $package = (Get-AppxPackage -Name $project).InstallLocation
  $installRoot = "$env:SystemDrive/opscode"
  $omnibusRoot = Join-Path $installRoot $project

  if(!(Test-Path $installRoot)) {
    New-Item -ItemType Directory -Path $installRoot
  }

  # Remove old version of chef if it is here
  if(Test-Path $omnibusRoot) {
    Remove-Item -Path $omnibusRoot -Recurse -Force
  }

  # copy the appx install to the omnibus root. There are serious
  # ACL related issues with running chef from the appx InstallLocation
  # Hoping this is temporary and we can eventually just symlink
  Copy-Item $package $omnibusRoot -Recurse

  return $true
}

export-modulemember -function 'Install-Project','Get-ProjectMetadata' -alias 'install'

}