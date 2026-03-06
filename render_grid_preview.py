import argparse
import math
from dataclasses import dataclass

from PIL import Image, ImageDraw, ImageFont


@dataclass
class GridConfig:
    width: int = 2048
    height: int = 1024
    rotation_deg: float = 0.0
    line_density: int = 8
    fov_deg: float = 90.0
    output: str = "public/grid-preview.png"


def wrap01(value: float) -> float:
    return (value % 1.0 + 1.0) % 1.0


def longitude_to_x(lmb: float, width: int) -> float:
    return wrap01((lmb + math.pi) / (2 * math.pi)) * width


def draw_band(draw: ImageDraw.ImageDraw, center_lambda: float, width_px: float, color, cfg: GridConfig):
    cx = longitude_to_x(center_lambda + math.radians(cfg.rotation_deg), cfg.width)
    sx = cx - width_px / 2
    if sx < 0:
        draw.rectangle([sx + cfg.width, 0, sx + cfg.width + width_px, cfg.height], fill=color)
        draw.rectangle([0, 0, cx + width_px / 2, cfg.height], fill=color)
    elif sx + width_px > cfg.width:
        right = cfg.width - sx
        draw.rectangle([sx, 0, cfg.width, cfg.height], fill=color)
        draw.rectangle([0, 0, width_px - right, cfg.height], fill=color)
    else:
        draw.rectangle([sx, 0, sx + width_px, cfg.height], fill=color)


def draw_grid_preview(cfg: GridConfig):
    img = Image.new("RGBA", (cfg.width, cfg.height), (37, 236, 194, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # Face sectors
    band_w = cfg.width / 4
    draw_band(draw, -math.pi / 2, band_w, (22, 170, 140, 65), cfg)   # LEFT
    draw_band(draw, 0, band_w, (32, 224, 180, 75), cfg)               # FRONT
    draw_band(draw, math.pi / 2, band_w, (22, 170, 140, 65), cfg)     # RIGHT
    draw_band(draw, math.pi, band_w, (22, 170, 140, 55), cfg)         # BACK

    # Fine base mesh
    mesh_color = (0, 0, 0, 70)
    grid_step = max(cfg.width // 32, 32)
    for x in range(0, cfg.width + 1, grid_step):
        draw.line([(x, 0), (x, cfg.height)], fill=mesh_color, width=1)
    for y in range(0, cfg.height + 1, grid_step):
        draw.line([(0, y), (cfg.width, y)], fill=mesh_color, width=1)

    # Curves from math in grid-gen.md
    lambda0 = math.radians(cfg.rotation_deg)
    fov_rad = math.radians(cfg.fov_deg)
    half_count = max(cfg.line_density // 2, 1)
    alpha_max = fov_rad / 2
    curve_color = (0, 0, 0, 115)

    # Horizontal curves:
    # y(lambda)=H/pi * [pi/2 - atan(tan(alpha)*cos(lambda-lambda0))]
    for i in range(-half_count, half_count + 1):
        alpha = (i / half_count) * alpha_max
        if abs(alpha) >= math.pi / 2 - 0.01:
            continue
        pts = []
        for x in range(0, cfg.width + 1, 4):
            lmb = (x / cfg.width) * 2 * math.pi - math.pi
            phi = math.atan(math.tan(alpha) * math.cos(lmb - lambda0))
            y = (cfg.height / math.pi) * (math.pi / 2 - phi)
            pts.append((x, y))
        draw.line(pts, fill=curve_color, width=2)

    # Vertical curves via rectilinear sweep projection
    beta_max = fov_rad / 2
    for i in range(-half_count, half_count + 1):
        beta = (i / half_count) * beta_max
        y_loc = math.tan(beta)
        pts = []
        prev_x = None
        for j in range(-70, 71):
            sweep = (j / 70) * (math.pi / 2 - 0.06)
            z_loc = math.tan(sweep)
            mag = math.sqrt(y_loc * y_loc + z_loc * z_loc + 1)
            vx, vy, vz = y_loc / mag, z_loc / mag, 1 / mag

            # rotate around Y by lambda0
            cos_a, sin_a = math.cos(lambda0), math.sin(lambda0)
            rx = vx * cos_a + vz * sin_a
            rz = -vx * sin_a + vz * cos_a
            ry = vy

            lmb = math.atan2(rx, rz)
            phi = math.asin(ry)
            x_px = ((lmb + math.pi) / (2 * math.pi)) * cfg.width
            y_px = (0.5 - phi / math.pi) * cfg.height

            if prev_x is not None and abs(x_px - prev_x) > cfg.width / 2:
                if len(pts) > 1:
                    draw.line(pts, fill=curve_color, width=2)
                pts = [(x_px, y_px)]
            else:
                pts.append((x_px, y_px))
            prev_x = x_px
        if len(pts) > 1:
            draw.line(pts, fill=curve_color, width=2)

    # Reference axes
    axis_color = (0, 0, 0, 180)
    for lon in (-180, -90, 0, 90, 180):
        x = longitude_to_x(math.radians(lon) + lambda0, cfg.width)
        draw.line([(x, 0), (x, cfg.height)], fill=axis_color, width=2)
    for lat in (-90, -45, 0, 45, 90):
        y = ((90 - lat) / 180) * cfg.height
        draw.line([(0, y), (cfg.width, y)], fill=axis_color, width=2)

    # Frame
    draw.rectangle([1, 1, cfg.width - 2, cfg.height - 2], outline=(0, 0, 0, 180), width=3)

    # Labels
    font = ImageFont.load_default()
    labels = [("LEFT", -90), ("FRONT", 0), ("RIGHT", 90), ("BACK", 180)]
    for text, lon in labels:
        x = longitude_to_x(math.radians(lon) + lambda0, cfg.width)
        y = cfg.height * 0.5
        draw.text((x - 30, y - 8), text, fill=(0, 0, 0, 220), font=font)

    draw.text((cfg.width // 2 - 28, cfg.height - 34), "Longitude", fill=(0, 0, 0, 220), font=font)
    draw.text((10, 10), "Latitude", fill=(0, 0, 0, 220), font=font)
    draw.text((5, cfg.height * 0.5 - 8), "0°", fill=(0, 0, 0, 220), font=font)
    draw.text((5, 4), "90°", fill=(0, 0, 0, 220), font=font)
    draw.text((5, cfg.height - 20), "-90°", fill=(0, 0, 0, 220), font=font)
    draw.text((8, cfg.height - 40), "-180°", fill=(0, 0, 0, 220), font=font)
    draw.text((cfg.width // 2 - 8, cfg.height - 40), "0°", fill=(0, 0, 0, 220), font=font)
    draw.text((cfg.width - 58, cfg.height - 40), "180°", fill=(0, 0, 0, 220), font=font)

    img.save(cfg.output)
    print(f"saved {cfg.output}")


def parse_args() -> GridConfig:
    parser = argparse.ArgumentParser(description="Render equirectangular mathematical grid preview PNG")
    parser.add_argument("--width", type=int, default=2048, help="output width (2:1 expected)")
    parser.add_argument("--height", type=int, default=1024, help="output height")
    parser.add_argument("--rotation", type=float, default=0.0, help="lambda0 rotation in degrees")
    parser.add_argument("--density", type=int, default=8, help="grid line density")
    parser.add_argument("--fov", type=float, default=90.0, help="virtual rectilinear FOV in degrees")
    parser.add_argument("--output", type=str, default="public/grid-preview.png", help="output PNG path")
    args = parser.parse_args()
    return GridConfig(
        width=args.width,
        height=args.height,
        rotation_deg=args.rotation,
        line_density=max(args.density, 2),
        fov_deg=max(min(args.fov, 179.0), 1.0),
        output=args.output,
    )


if __name__ == "__main__":
    draw_grid_preview(parse_args())
