import os
import math
import struct
import zlib

def create_png(width, height, draw_func, filename):
    # Raw RGBA buffer
    pixels = bytearray(width * height * 4)
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            idx = (y * width + x) * 4
            pixels[idx] = r
            pixels[idx+1] = g
            pixels[idx+2] = b
            pixels[idx+3] = a

    # PNG File Generation
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0
        raw_data.extend(pixels[y*width*4:(y+1)*width*4])

    compressed = zlib.compress(raw_data)
    
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png_bytes = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png_bytes)
    print(f"Generated {filename}")

def draw_icon(x, y, w, h):
    # Normalized coords [0, 1]
    nx = x / (w - 1) if w > 1 else 0.5
    ny = y / (h - 1) if h > 1 else 0.5

    # Center (0.5, 0.5)
    cx, cy = 0.5, 0.5
    dx = nx - cx
    dy = ny - cy
    dist = math.sqrt(dx*dx + dy*dy)

    # Background: Dark rounded square
    corner_radius = 0.2
    # Distance from rounded box
    box_dx = max(0, abs(dx) - (0.5 - corner_radius))
    box_dy = max(0, abs(dy) - (0.5 - corner_radius))
    box_dist = math.sqrt(box_dx*box_dx + box_dy*box_dy)

    if box_dist > corner_radius:
        return (0, 0, 0, 0) # Transparent outside

    # Google brand colors based on angle around center
    angle = math.atan2(dy, dx) # -pi to pi
    if angle < -math.pi / 2: # Top-Left: Red (#EA4335)
        color = (234, 67, 53)
    elif angle < 0: # Top-Right: Blue (#4285F4)
        color = (66, 133, 244)
    elif angle < math.pi / 2: # Bottom-Right: Green (#34A853)
        color = (52, 168, 83)
    else: # Bottom-Left: Yellow (#FBBC05)
        color = (251, 188, 5)

    # Circle ring for Google "G" / Magnifier
    if 0.22 <= dist <= 0.38:
        # Check right gap for 'G' shape
        if dy > -0.08 and dy < 0.08 and dx > 0.1:
            # Cutout for G mouth
            return (15, 23, 42, 255) # Dark BG color
        return (color[0], color[1], color[2], 255)
    elif dist < 0.22:
        # Center bar for G
        if dy >= -0.05 and dy <= 0.05 and dx >= 0.0:
            return (66, 133, 244, 255)
        return (15, 23, 42, 255)
    else:
        # Outer ring glow
        bg_r, bg_g, bg_b = 15, 23, 42
        return (bg_r, bg_g, bg_b, 255)

out_dir = r"C:\Users\siroe\.gemini\antigravity\scratch\brave-google-search-redirector\icons"
create_png(16, 16, draw_icon, os.path.join(out_dir, "icon16.png"))
create_png(48, 48, draw_icon, os.path.join(out_dir, "icon48.png"))
create_png(128, 128, draw_icon, os.path.join(out_dir, "icon128.png"))
