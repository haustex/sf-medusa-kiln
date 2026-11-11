from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import sys
f=TTFont("josefin300.woff2"); gs=f.getGlyphSet(); cmap=f.getBestCmap(); hmtx=f["hmtx"]
upm=f["head"].unitsPerEm
text=sys.argv[2]; track=float(sys.argv[1])*upm
os2=f["OS/2"]; cap=os2.sCapHeight
x=0; pen=SVGPathPen(gs, ntos=lambda v: str(round(v)))
last=len(text)-1
for i,ch in enumerate(text):
    g=cmap[ord(ch)]
    tp=TransformPen(pen,(1,0,0,-1,x,cap))  # flip y, baseline at cap height => top of caps at y=0
    gs[g].draw(tp)
    x+=hmtx[g][0]+(track if i<last else 0)
# compute bbox
from fontTools.pens.boundsPen import BoundsPen
bp=BoundsPen(gs); x=0
for i,ch in enumerate(text):
    g=cmap[ord(ch)]
    gs[g].draw(TransformPen(bp,(1,0,0,-1,x,cap))); x+=hmtx[g][0]+(track if i<last else 0)
print("upm",upm,"cap",cap,"bounds",bp.bounds)
open("wm.path","w").write(pen.getCommands())
print(len(pen.getCommands()))
