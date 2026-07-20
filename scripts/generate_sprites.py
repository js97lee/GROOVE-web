from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
OUTPUT = ASSETS / "sprites"
FRAME_SIZE = 320
FRAME_COUNT = 6

PROFILES = {
    "coffee": {
        "source": "character-coffee.png",
        "angles": (-3, -1, 2, 3, 1, -3),
        "scales": (0.96, 0.99, 1.02, 1.01, 0.98, 0.96),
        "y": (10, 5, 0, 3, 7, 10),
    },
    "cozy": {
        "source": "character-cozy.png",
        "angles": (-1, 0, 1, 0, -1, -1),
        "scales": (0.96, 0.98, 1.01, 1.02, 0.99, 0.96),
        "y": (7, 5, 2, 0, 4, 7),
    },
    "cocktail": {
        "source": "character-cocktail.png",
        "angles": (-4, -1, 3, 4, 1, -4),
        "scales": (0.97, 1.0, 1.02, 1.0, 0.98, 0.97),
        "y": (8, 4, 0, 3, 6, 8),
    },
    "listen": {
        "source": "character-listen.png",
        "angles": (-5, -2, 4, 1, -3, -5),
        "scales": (0.94, 1.0, 1.05, 0.98, 1.02, 0.94),
        "y": (12, 3, -3, 5, 1, 12),
    },
}


def trim(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    return image.crop(bounds) if bounds else image


def make_sheet(name: str, profile: dict) -> None:
    source = trim(Image.open(ASSETS / profile["source"]).convert("RGBA"))
    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))

    for index in range(FRAME_COUNT):
        scale = profile["scales"][index]
        target = int(FRAME_SIZE * 0.78 * scale)
        ratio = min(target / source.width, target / source.height)
        resized = source.resize(
            (max(1, round(source.width * ratio)), max(1, round(source.height * ratio))),
            Image.Resampling.LANCZOS,
        )
        rotated = resized.rotate(
            profile["angles"][index],
            resample=Image.Resampling.BICUBIC,
            expand=True,
        )
        x = index * FRAME_SIZE + (FRAME_SIZE - rotated.width) // 2
        y = (FRAME_SIZE - rotated.height) // 2 + profile["y"][index]
        sheet.alpha_composite(rotated, (x, y))

    sheet.save(OUTPUT / f"{name}-sprite.png", optimize=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for variant, settings in PROFILES.items():
        make_sheet(variant, settings)
    print(f"Generated {len(PROFILES)} sprite sheets in {OUTPUT}")
