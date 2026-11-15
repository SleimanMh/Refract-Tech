# Crops a transparent logo to its artwork and pads it back to a centred square, so it sits in the
# middle of a round badge.   python3 scripts/center_logo.py in.png out.png [padding-fraction]
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; pad = float(sys.argv[3]) if len(sys.argv) > 3 else .06
im = Image.open(src).convert('RGBA'); box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
art = im.crop(box); w, h = art.size; side = int(max(w, h) * (1 + 2 * pad))
out = Image.new('RGBA', (side, side), (0, 0, 0, 0)); out.paste(art, ((side - w) // 2, (side - h) // 2), art); out.save(dst)
print('art box', box, '->', out.size)
