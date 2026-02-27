import urllib.request
import os
try:
    from PIL import Image, ImageEnhance
except ImportError:
    import sys
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageEnhance

url = "https://i.imgur.com/kXJpZld.png"
output_path = r"c:\Users\Gou\Downloads\GATEWAY DE PAGAMENTOS\frontend\public\logo.png"

# Download the image
temp_path = r"c:\Users\Gou\Downloads\GATEWAY DE PAGAMENTOS\frontend\public\temp_logo.png"
urllib.request.urlretrieve(url, temp_path)

# Open the image, resize (upscale) it with antialiasing, and enhance sharpness
img = Image.open(temp_path)
width, height = img.size
# Let's double the resolution
new_width = width * 2
new_height = height * 2

img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

# Enhance sharpness
enhancer = ImageEnhance.Sharpness(img_resized)
img_enhanced = enhancer.enhance(1.5) # subtle sharpening

img_enhanced.save(output_path, "PNG", quality=100)
os.remove(temp_path)

print(f"Successfully downloaded and enhanced logo to {output_path}. Original size: {width}x{height}, New size: {new_width}x{new_height}")
