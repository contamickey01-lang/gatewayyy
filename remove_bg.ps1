Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\Gou\Downloads\GATEWAY DE PAGAMENTOS\frontend\public\logo.png")
$bitmap = New-Object System.Drawing.Bitmap($img)
$img.Dispose()
$bitmap.MakeTransparent([System.Drawing.Color]::White)
$bitmap.Save("c:\Users\Gou\Downloads\GATEWAY DE PAGAMENTOS\frontend\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
Write-Host "Background removed successfully!"
