from PIL import Image
import numpy as np

original_path = r"C:\Users\david\OneDrive\Desktop\New Course-20261028T181040Z-1-001\New Course\Branding\Textured Golden Monstera Leaf.png"
output_path = r"images\botanical-monstera.png"

img = Image.open(original_path)
print(f"Original image: {img.size}")

# Convert to RGBA
img = img.convert('RGBA')
data = np.array(img)

# Find content bounding box by detecting non-white pixels
r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# A pixel is "content" if it's not mostly white (luminance < 245)
luminance = (0.299 * r + 0.587 * g + 0.114 * b)
content_mask = luminance < 245

# Find bounding box of content
rows = np.any(content_mask, axis=1)
cols = np.any(content_mask, axis=0)
if rows.any() and cols.any():
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]

    # Add small padding to preserve antialiasing
    padding = 20
    ymin = max(0, ymin - padding)
    xmin = max(0, xmin - padding)
    ymax = min(data.shape[0], ymax + padding)
    xmax = min(data.shape[1], xmax + padding)

    # Crop to content
    cropped = img.crop((xmin, ymin, xmax, ymax))
    cropped.save(output_path, 'PNG')
    print(f"Cropped to {cropped.size} and saved")
else:
    print("Could not find content to crop")
