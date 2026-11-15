import math
from PIL import Image, ImageDraw

def create_padre_cedric():
    # 36 x 72 canvas
    img = Image.new("RGBA", (36, 72), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Palette
    c_robe = (65, 52, 42, 255)       # Humble dark brown monk robe
    c_robe_shade = (45, 35, 28, 255)
    c_robe_hi = (85, 70, 58, 255)
    c_cowl = (55, 44, 35, 255)
    c_skin = (210, 175, 145, 255)
    c_skin_shade = (165, 130, 105, 255)
    c_beard = (230, 230, 235, 255)
    c_beard_shade = (180, 180, 190, 255)
    c_wood = (90, 55, 25, 255)
    c_fire = (255, 180, 40, 255)
    c_fire_hi = (255, 240, 120, 255)
    c_fire_glow = (255, 100, 20, 200)
    c_rosary = (190, 150, 90, 255)
    c_boots = (35, 28, 22, 255)

    # 1. Body Robe (bottom anchored at y=70)
    # Skirt / lower robe
    d.polygon([(10, 38), (26, 38), (30, 68), (6, 68)], fill=c_robe)
    d.polygon([(6, 68), (14, 68), (12, 40), (10, 38)], fill=c_robe_shade)
    d.polygon([(22, 38), (26, 38), (30, 68), (24, 68)], fill=c_robe_hi)

    # Boots
    d.rectangle([9, 68, 15, 71], fill=c_boots)
    d.rectangle([21, 68, 27, 71], fill=c_boots)

    # 2. Torso & Belt
    d.rectangle([11, 24, 25, 42], fill=c_robe)
    # Rope Belt / cord
    d.line([(10, 40), (26, 40)], fill=(180, 160, 130, 255), width=2)
    # Hanging wooden rosary
    d.line([(18, 41), (19, 52)], fill=c_rosary, width=1)
    d.point([(18, 43), (19, 46), (19, 49)], fill=c_rosary)
    # Wooden cross at tip of rosary
    d.line([(18, 52), (20, 52)], fill=c_rosary, width=1)
    d.line([(19, 51), (19, 55)], fill=c_rosary, width=1)

    # 3. Arms & Torch
    # Left arm holding torch forward (to right side)
    d.polygon([(23, 26), (30, 28), (32, 32), (25, 32)], fill=c_cowl)
    d.rectangle([30, 30, 33, 33], fill=c_skin) # hand

    # Torch Wood Handle
    d.rectangle([31, 16, 33, 38], fill=c_wood)
    # Torch Bound head
    d.rectangle([30, 12, 34, 16], fill=(50, 40, 35, 255))
    # Flames
    d.polygon([(29, 12), (32, 2), (35, 12)], fill=c_fire)
    d.polygon([(30, 11), (32, 5), (34, 11)], fill=c_fire_hi)
    d.point([(32, 0), (31, 1)], fill=c_fire_glow)

    # Right arm resting
    d.polygon([(11, 26), (8, 36), (10, 40), (13, 30)], fill=c_cowl)
    d.rectangle([9, 40, 11, 42], fill=c_skin)

    # 4. Head, Hood & Beard
    # Cowl / hood around head
    d.polygon([(9, 12), (18, 6), (27, 12), (26, 24), (10, 24)], fill=c_cowl)
    # Face
    d.rectangle([13, 13, 23, 21], fill=c_skin)
    d.rectangle([13, 18, 23, 22], fill=c_skin_shade)
    # Eyes & Eyebrows
    d.point([(15, 15), (20, 15)], fill=(40, 30, 25, 255)) # eyes
    d.line([(14, 14), (16, 14)], fill=(200, 200, 205, 255)) # gray eyebrows
    d.line([(19, 14), (21, 14)], fill=(200, 200, 205, 255))

    # White Beard
    d.polygon([(12, 19), (24, 19), (22, 30), (18, 33), (14, 30)], fill=c_beard)
    d.polygon([(14, 25), (18, 33), (22, 25)], fill=c_beard_shade)

    return img

def create_portrait_cedric():
    # 128 x 128 portrait
    img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Background frame
    d.rectangle([2, 2, 125, 125], fill=(22, 16, 28, 255), outline=(180, 145, 75, 255), width=2)
    d.rectangle([6, 6, 121, 121], outline=(75, 50, 95, 255), width=1)

    # Monk cowl
    d.polygon([(15, 125), (30, 45), (64, 25), (98, 45), (113, 125)], fill=(55, 42, 32, 255))
    d.polygon([(15, 125), (35, 55), (64, 35), (45, 125)], fill=(40, 30, 22, 255)) # shadow

    # Face
    d.polygon([(42, 45), (86, 45), (82, 85), (64, 98), (46, 85)], fill=(215, 180, 150, 255))
    # Warm light highlight from torch on right side
    d.polygon([(72, 45), (86, 45), (82, 85), (75, 90)], fill=(245, 205, 165, 255))

    # Eyes & Kind expression
    d.line([(49, 56), (57, 57)], fill=(50, 35, 25, 255), width=2)
    d.line([(71, 57), (79, 56)], fill=(50, 35, 25, 255), width=2)
    # Pupils
    d.rectangle([52, 59, 55, 62], fill=(60, 45, 30, 255))
    d.rectangle([73, 59, 76, 62], fill=(60, 45, 30, 255))
    # Crow's feet / wrinkles of wisdom
    d.line([(45, 57), (48, 58)], fill=(170, 135, 110, 255))
    d.line([(80, 58), (83, 57)], fill=(190, 155, 120, 255))

    # White Hair & Beard
    d.polygon([(36, 65), (92, 65), (84, 112), (64, 122), (44, 112)], fill=(235, 235, 240, 255))
    d.polygon([(46, 75), (82, 75), (76, 108), (64, 118), (52, 108)], fill=(210, 210, 218, 255))
    d.polygon([(56, 85), (72, 85), (68, 112), (64, 116), (60, 112)], fill=(185, 185, 195, 255))

    # Wooden cross around neck
    d.line([(64, 115), (64, 126)], fill=(200, 160, 90, 255), width=3)
    d.line([(59, 120), (69, 120)], fill=(200, 160, 90, 255), width=3)

    return img

def create_lamento_oakhaven():
    # 48 x 48 weapon drop sprite
    img = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 3 Chains suspended from top
    c_chain = (150, 140, 130, 255)
    c_gold = (220, 180, 60, 255)
    c_gold_shade = (140, 105, 30, 255)
    c_green_ember = (80, 255, 140, 255)
    c_green_glow = (40, 190, 90, 180)

    # Ring holder at top
    d.ellipse([21, 4, 27, 10], outline=c_gold, width=2)

    # Chains
    d.line([(22, 10), (16, 26)], fill=c_chain, width=1)
    d.line([(24, 10), (24, 26)], fill=c_chain, width=1)
    d.line([(26, 10), (32, 26)], fill=c_chain, width=1)

    # Ornate Censer Body (Incensario)
    # Top lid with spire
    d.polygon([(24, 20), (29, 26), (19, 26)], fill=c_gold)
    d.line([(24, 18), (24, 22)], fill=c_gold, width=2) # cross tip

    # Mid section with filigree holes & glowing emerald fire
    d.rectangle([17, 26, 31, 35], fill=c_gold_shade)
    d.rectangle([19, 28, 29, 33], fill=c_green_glow)
    d.point([(21, 30), (24, 29), (27, 30), (24, 32)], fill=c_green_ember)

    # Lower bowl
    d.polygon([(17, 35), (31, 35), (28, 42), (20, 42)], fill=c_gold)
    # Bottom finial teardrop
    d.polygon([(23, 42), (25, 42), (24, 45)], fill=c_gold)

    # Subtle rising emerald/abyssal smoke wisps
    d.point([(22, 16), (26, 14), (20, 12), (28, 8)], fill=(90, 230, 150, 160))

    return img

def create_boss_astaroth():
    # 80 x 100 colossal scale
    img = Image.new("RGBA", (80, 100), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Palette
    c_body = (25, 15, 35, 255)
    c_body_shade = (12, 7, 18, 255)
    c_rune = (230, 60, 160, 255)       # Corrupted magenta/abyssal rune
    c_rune_glow = (160, 30, 110, 180)
    c_gold_corrupt = (255, 190, 40, 255)
    c_horn = (18, 10, 26, 255)
    c_wing = (35, 20, 48, 220)
    c_wing_edge = (60, 30, 85, 240)

    # 1. Sprawling Shadow Wings
    # Left wing
    d.polygon([(40, 40), (10, 20), (2, 35), (14, 55), (30, 60)], fill=c_wing)
    d.line([(40, 40), (10, 20), (2, 35)], fill=c_wing_edge, width=2)
    # Right wing
    d.polygon([(40, 40), (70, 20), (78, 35), (66, 55), (50, 60)], fill=c_wing)
    d.line([(40, 40), (70, 20), (78, 35)], fill=c_wing_edge, width=2)

    # 2. Eclipse Halo behind head
    d.ellipse([26, 8, 54, 36], outline=c_gold_corrupt, width=2)
    d.ellipse([28, 10, 52, 34], fill=(10, 5, 15, 230))

    # 3. Massive Torso & Robes of Ash (anchored at y=98)
    d.polygon([(26, 45), (54, 45), (62, 96), (18, 96)], fill=c_body)
    d.polygon([(18, 96), (28, 96), (26, 50), (20, 50)], fill=c_body_shade)
    d.polygon([(52, 50), (58, 50), (62, 96), (54, 96)], fill=c_body_shade)

    # 4. Glowing Runic Fissures on Chest (Abyssal Core)
    d.line([(40, 46), (40, 72)], fill=c_rune, width=2)
    d.line([(32, 54), (48, 54)], fill=c_rune, width=2)
    d.line([(35, 64), (45, 64)], fill=c_rune, width=2)
    d.ellipse([37, 51, 43, 57], fill=(255, 180, 220, 255)) # core eye/heart

    # 5. Colossal Horned Head
    d.polygon([(34, 25), (46, 25), (44, 42), (36, 42)], fill=c_body)
    # Sweeping Obsidian Horns
    d.polygon([(34, 26), (24, 12), (18, 4), (24, 18), (35, 29)], fill=c_horn)
    d.polygon([(46, 26), (56, 12), (62, 4), (56, 18), (45, 29)], fill=c_horn)

    # Burning Eclipse Eyes (dual light)
    d.rectangle([36, 32, 38, 34], fill=c_gold_corrupt) # Corrupted gold
    d.rectangle([42, 32, 44, 34], fill=c_rune)         # Abyssal magenta

    # 6. Arms with Obsidian Claws
    d.polygon([(26, 46), (18, 62), (22, 68), (30, 52)], fill=c_body)
    d.line([(18, 68), (14, 75)], fill=c_horn, width=2) # Claws
    d.line([(20, 68), (18, 77)], fill=c_horn, width=2)
    d.line([(22, 68), (22, 76)], fill=c_horn, width=2)

    d.polygon([(54, 46), (62, 62), (58, 68), (50, 52)], fill=c_body)
    d.line([(62, 68), (66, 75)], fill=c_horn, width=2)
    d.line([(60, 68), (62, 77)], fill=c_horn, width=2)
    d.line([(58, 68), (58, 76)], fill=c_horn, width=2)

    return img

def create_portrait_astaroth():
    # 128 x 128
    img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Gothic border
    d.rectangle([2, 2, 125, 125], fill=(12, 6, 18, 255), outline=(180, 40, 110, 255), width=2)
    d.rectangle([6, 6, 121, 121], outline=(230, 170, 40, 255), width=1)

    # Eclipse disc background
    d.ellipse([24, 14, 104, 94], fill=(25, 12, 35, 255), outline=(240, 180, 50, 255), width=2)

    # Curved Horns
    d.polygon([(45, 45), (28, 20), (12, 8), (24, 28), (48, 52)], fill=(18, 9, 25, 255))
    d.polygon([(83, 45), (100, 20), (116, 8), (104, 28), (80, 52)], fill=(18, 9, 25, 255))

    # Face & Crown
    d.polygon([(46, 42), (82, 42), (76, 92), (64, 106), (52, 92)], fill=(28, 16, 40, 255))

    # Abyssal runic cracks
    d.line([(64, 44), (64, 76)], fill=(240, 60, 160, 255), width=2)
    d.line([(54, 58), (74, 58)], fill=(240, 60, 160, 255), width=2)

    # Eyes: Left Gold Eclipse, Right Violet Void
    d.polygon([(50, 62), (58, 64), (52, 68)], fill=(255, 210, 60, 255))
    d.polygon([(78, 62), (70, 64), (76, 68)], fill=(255, 60, 180, 255))

    # Shroud of Ash
    d.polygon([(20, 125), (46, 95), (82, 95), (108, 125)], fill=(18, 10, 26, 255))

    return img

if __name__ == "__main__":
    cedric = create_padre_cedric()
    cedric.save("public/assets/characters/padre_cedric.png")

    p_cedric = create_portrait_cedric()
    p_cedric.save("public/assets/characters/portrait_cedric.png")

    censer = create_lamento_oakhaven()
    censer.save("public/assets/characters/lamento_oakhaven.png")

    astaroth = create_boss_astaroth()
    astaroth.save("public/assets/characters/boss_astaroth.png")

    p_astaroth = create_portrait_astaroth()
    p_astaroth.save("public/assets/characters/portrait_astaroth.png")

    print("All lore character assets successfully generated!")
