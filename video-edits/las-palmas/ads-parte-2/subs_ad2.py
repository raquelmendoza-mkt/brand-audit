import json, sys, re
S=sys.argv[1]; W=json.load(open(f'{S}/words.json'))
HELV="Nimbus Sans"; GOLD="&H6FC6E9&"
def ts(t):
    t=max(t,0); return f"{int(t//3600)}:{int(t%3600//60):02d}:{t%60:05.2f}"
ev=[]
def E(a,b,text,style="Sub",layer=0): ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},{style},,0,0,0,,{text}")
def rrect(w,h,r):
    k=r*0.45
    return (f"m {r} 0 l {w-r} 0 b {w-k} 0 {w} {k} {w} {r} l {w} {h-r} b {w} {h-k} {w-k} {h} {w-r} {h} "
            f"l {r} {h} b {k} {h} 0 {h-k} 0 {h-r} l 0 {r} b 0 {k} {k} 0 {r} 0")
def title(a,b,y,text,size=120,font="Poppins Black",color="&HFFFFFF&",delay=0,x=540):
    E(a,b,f"{{\\an8\\fn{font}\\fs{size}\\c{color}\\bord0\\shad3\\4a&H70&\\move({x},{y+50},{x},{y},{delay},{delay+260})\\alpha&HFF&\\t({delay},{delay+200},\\alpha&H00&)\\fad(0,140)}}{text}","Gfx",5)
def label(a,b,y,text,size=44,delay=120,color="&HFFFFFF&",spacing=6,x=540,bold=1):
    E(a,b,f"{{\\an8\\fn{HELV}\\b{bold}\\fs{size}\\fsp{spacing}\\c{color}\\bord0\\shad2\\4a&H60&\\move({x},{y+30},{x},{y},{delay},{delay+260})\\alpha&HFF&\\t({delay},{delay+200},\\alpha&H00&)\\fad(0,140)}}{text}","Gfx",5)
def line(a,b,y,w=160,delay=60):
    E(a,b,f"{{\\an8\\pos(540,{y})\\p1\\c{GOLD}\\bord0\\shad0\\fscx0\\t({delay},{delay+300},\\fscx100)\\fad(0,140)}}m 0 0 l {w} 0 l {w} 5 l 0 5{{\\p0}}","Gfx",5)
def shade(a,b,y0,h,alpha="&H70&"):
    E(a,b,f"{{\\an7\\pos(-300,{y0})\\p1\\c&H000000&\\alpha{alpha}\\bord0\\shad0\\blur90\\fad(150,150)}}m 0 0 l 1680 0 l 1680 {h} l 0 {h}{{\\p0}}","Gfx",3)
# ---- voice-over subtitles (Helvetica + Poppins gold keywords, word-by-word)
SEG=[("IMG_0718",2.72,0.10,8.45),("IMG_0721",4.08,10.80,6.75),("IMG_0743",2.00,17.55,3.98)]
FIX={"Te":"¿Te"}
HL={"balcón","naturaleza","café.","estudio","casa.","aquí?","viviendo"}
words=[]
for c,a,T0,b in SEG:
    for w,t in W[c]:
        if a-0.02<=t<b: words.append([T0+(t-a),FIX.get(w,w),T0+(b-a)])
chunks=[]; cur=[]
for i,(t,w,se) in enumerate(words):
    cur.append((t,w,se)); nxt=words[i+1] if i+1<len(words) else None
    L=sum(len(x[1])+1 for x in cur)
    if nxt is None or nxt[2]!=se or re.search(r"[,?.]$",w) or len(cur)>=4 or L>16 or (nxt and L+len(nxt[1])>19):
        chunks.append(cur); cur=[]
for i,ch in enumerate(chunks):
    a=ch[0][0]-0.06; se=ch[-1][2]; nx=chunks[i+1][0][0]-0.06 if i+1<len(chunks) else 1e9
    b=min(nx,se,ch[-1][0]+0.8); sp=[]; gl=[]
    for k,(t,w,_) in enumerate(ch):
        d=max(0,int((t-a)*1000)); txt=w.rstrip('.,')
        if k==0 and i>0 and chunks[i-1][-1][2]!=se: txt=txt[:1].upper()+txt[1:] if txt[0]!='¿' else txt
        f=f"\\fnPoppins Bold\\fs104\\c{GOLD}" if w in HL else f"\\fn{HELV}\\b0\\fs84\\c&HFFFFFF&"
        sp.append("{"+f+f"\\alpha&HFF&\\fscy55\\t({d},{d+120},\\alpha&H00&\\fscy100)}}"+txt)
        gl.append("{"+f+f"\\1a&HFF&\\3a&HFF&\\fscy55\\t({d},{d+120},\\3a&H50&\\fscy100)}}"+txt)
    E(a,b,"{\\bord0\\shad0}"+" ".join(sp),"Sub",2)
    E(a,b,"{\\bord11\\blur16\\3c&H000000&\\shad0}"+" ".join(gl),"Sub",1)
# first chunk starts with lowercase "este" -> capitalise
ev=[e.replace("}este","}Este",1) if i<2 else e for i,e in enumerate(ev)]
# ---- opening identity (top)
shade(0.0,4.0,120,420,"&H98&")
label(0.15,4.0,215,"EL POBLADO · MEDELLÍN",34,0,GOLD,10)
title(0.15,4.0,265,"Las Palmas",120,"Poppins SemiBold",delay=100)
# ---- montage
shade(5.75,10.75,1120,560,"&H88&")
label(5.75,7.0,1260,"APARTAMENTO EN VENTA",40,0,spacing=10)
line(5.75,7.0,1325,160,120)
title(7.0,8.25,1180,"117,5 m²",150)
label(7.0,8.25,1385,"SALA Y COMEDOR AMPLIOS",40,180,spacing=6)
title(8.25,9.25,1230,"Cocina abierta",96,"Poppins ExtraBold")
label(8.25,9.25,1370,"DISEÑO MODERNO",34,150,GOLD,8)
title(9.25,10.75,1200,"2 habitaciones",96,"Poppins ExtraBold")
line(9.25,10.75,1340,160,150)
label(9.25,10.75,1365,"CON BAÑO PRIVADO · VESTIER",38,200,spacing=5)
# ---- amenities / parking
shade(13.5,15.5,1120,520,"&H88&")
title(13.5,14.5,1230,"Zonas comunes",92,"Poppins ExtraBold")
title(14.5,15.5,1200,"2 parqueaderos",96,"Poppins ExtraBold")
label(14.5,15.5,1340,"CUARTO ÚTIL · VIGILANCIA 24 H",36,150,GOLD,5)
# ---- price
shade(15.5,17.5,640,760,"&H55&")
label(15.5,17.5,760,"LAS PALMAS · EL POBLADO",34,0,GOLD,8)
E(15.5,17.5,"{\\an8\\pos(540,850)\\p1\\c&HFFFFFF&\\bord0\\shad0\\alpha&HFF&\\t(60,220,\\alpha&H00&)\\fad(0,140)}"+rrect(260,70,35)+"{\\p0}","Gfx",5)
E(15.5,17.5,"{\\an8\\pos(540,858)\\fn"+HELV+"\\b1\\fs40\\fsp8\\c&H1A1A1A&\\bord0\\shad0\\alpha&HFF&\\t(60,220,\\alpha&H00&)\\fad(0,140)}VENTA","Gfx",6)
title(15.5,17.5,960,"$1.340.000.000",112,"Poppins Black",delay=120)
label(15.5,17.5,1110,"COP",40,200,spacing=10)
line(15.5,17.5,1185,200,240)
label(15.5,17.5,1215,"Administración: $1.000.000/mes",44,300,spacing=1,bold=0)
# ---- end card (19.5 - 22.5)
A,B=19.5,22.5
label(A,B,560,"LAS PALMAS · EL POBLADO",32,0,GOLD,10)
title(A,B,640,"Felipe Peláez",132,"Poppins SemiBold",delay=120)
line(A,B,830,220,260)
label(A,B,870,"REALTOR",48,320,GOLD,22)
label(A+0.45,B,1130,"Haz clic en el botón de abajo",56,0,spacing=1,bold=0)
title(A+0.45,B,1205,"para más información",88,"Poppins Bold",GOLD,delay=120)
# bouncing chevron
chev="m 0 0 l 50 46 l 100 0 l 100 24 l 50 70 l 0 24"
t=A+0.9; k=0
while t<B-0.05:
    e2=min(B,t+0.5); fade="\\alpha&HFF&\\t(0,150,\\alpha&H00&)" if k==0 else ""
    E(t,e2,f"{{\\an8\\move(540,1430,540,1475,0,500)\\p1\\c&HFFFFFF&\\bord0\\shad2\\4a&H60&{fade}}}{chev}{{\\p0}}","Gfx",5)
    E(t+0.12,e2,f"{{\\an8\\move(540,1500,540,1545,0,380)\\p1\\c{GOLD}\\bord0\\shad2\\4a&H60&{fade}}}{chev}{{\\p0}}","Gfx",5)
    t=e2; k+=1
hdr="""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Nimbus Sans,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,0,0,2,50,50,470,1
Style: Gfx,Poppins,60,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,2,8,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(f'{S}/ad2/subs.ass','w').write(hdr+"\n".join(ev)+"\n"); print(len(ev))
for l in ev:
    if l.startswith("Dialogue: 2,"): print(l.split(",")[1],re.sub(r"\{[^}]*\}","",l.split(",",9)[9]))
