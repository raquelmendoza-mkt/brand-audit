import json, sys, re
S=sys.argv[1]; W=json.load(open(f'{S}/words.json'))
HELV="Liberation Sans"   # Helvetica-metric stand-in
def ts(t):
    t=max(t,0); h=int(t//3600); m=int(t%3600//60); s=t%60; return f"{h}:{m:02d}:{s:05.2f}"
GOLD="&H6FC6E9&"   # #E9C66F (BGR)
ev=[]
def E(a,b,text,style="Sub",layer=0): ev.append(f"Dialogue: {layer},{ts(a)},{ts(b)},{style},,0,0,0,,{text}")
# ---- spoken subtitles ----
# (clip, src_in, timeline_start, src_end, corrected words, highlight set)
SEG=[("IMG_0742_ai_a",0.0,0.0,5.4,"¿Y si tu próximo lujo fuera tener un espacio donde te puedas poner en modo avión?"),
     ("IMG_0721",3.7,22.5,6.7,"Y un estudio para trabajar desde casa"),
     ("IMG_0718",2.45,25.5,8.45,"Y este balcón para disfrutar una pausa conectada con la naturaleza y disfrutar de un buen café"),
     ("IMG_0748",4.95,31.5,5.65,None),("IMG_0748",5.95,32.2,10.75,None),
     ("IMG_0743",1.95,40.0,9.05,"¿Te imaginas viviendo aquí? Comenta la palabra PALMAS y te envío todos los detalles para agendar tu próxima visita")]
HL={"lujo","modo","avión?","estudio","casa","balcón","naturaleza","café","dos","parqueaderos","24","horas.","Además,","PALMAS","aquí?","visita"}
words=[]  # (t_timeline, text)
park_txt="Además, cuenta con dos parqueaderos privados, cuarto útil y vigilancia 24 horas.".split()
pk=0
for c,a,T0,b,txt in SEG:
    ws=W[c]
    ws=[(w,t) for w,t in ws if a-0.05<=t<b]
    if txt: tw=txt.split()
    else: tw=park_txt[pk:pk+len(ws)]; pk+=len(ws)
    assert len(tw)==len(ws),(c,tw,ws)
    for (w,t),cw in zip(ws,tw): words.append([T0+(t-a),cw,T0+(b-a)])
# chunking
chunks=[]; cur=[]
for i,(t,w,segend) in enumerate(words):
    cur.append((t,w,segend))
    nxt=words[i+1] if i+1<len(words) else None
    txtlen=sum(len(x[1])+1 for x in cur)
    brk = (nxt is None or nxt[2]!=segend or re.search(r"[,?.]$",w) or len(cur)>=3 or txtlen>14
           or (nxt and txtlen+len(nxt[1])>15))
    if brk: chunks.append(cur); cur=[]
for i,ch in enumerate(chunks):
    a=ch[0][0]-0.04; segend=ch[-1][2]
    nxt=chunks[i+1][0][0]-0.04 if i+1<len(chunks) else 1e9
    b=min(nxt, segend, ch[-1][0]+0.75)
    toks=[]
    for _,w,_ in ch:
        up=w.upper().rstrip('.,')
        toks.append(f"{{\\c{GOLD}}}{up}{{\\c&HFFFFFF&}}" if w in HL or w.strip("¿?.,") in {"lujo","PALMAS"} else up)
    E(a,b,"{\\fscx70\\fscy70\\t(0,110,\\fscx104\\fscy104)\\t(110,180,\\fscx100\\fscy100)}"+" ".join(toks))
# ---- helpers for graphics ----
def rrect(w,h,r):
    k=r*0.45
    return (f"m {r} 0 l {w-r} 0 b {w-k} 0 {w} {k} {w} {r} l {w} {h-r} b {w} {h-k} {w-k} {h} {w-r} {h} "
            f"l {r} {h} b {k} {h} 0 {h-k} 0 {h-r} l 0 {r} b 0 {k} {k} 0 {r} 0")
def title(a,b,y,text,size=120,font="Poppins Black",color="&HFFFFFF&",delay=0,an=8,x=540,bord=0,shad=3):
    E(a,b,f"{{\\an{an}\\fn{font}\\fs{size}\\c{color}\\bord{bord}\\shad{shad}\\4a&H70&\\move({x},{y+50},{x},{y},{delay},{delay+260})\\alpha&HFF&\\t({delay},{delay+200},\\alpha&H00&)\\fad(0,160)}}{text}","Gfx",5)
def label(a,b,y,text,size=44,delay=120,color="&HFFFFFF&",spacing=6,x=540,an=8,bold=1):
    E(a,b,f"{{\\an{an}\\fn{HELV}\\b{bold}\\fs{size}\\fsp{spacing}\\c{color}\\bord0\\shad2\\4a&H60&\\move({x},{y+30},{x},{y},{delay},{delay+260})\\alpha&HFF&\\t({delay},{delay+200},\\alpha&H00&)\\fad(0,160)}}{text}","Gfx",5)
def line(a,b,y,w=160,delay=60):
    E(a,b,f"{{\\an8\\pos(540,{y})\\p1\\c{GOLD}\\bord0\\shad0\\fscx0\\t({delay},{delay+300},\\fscx100)\\fad(0,160)}}m 0 0 l {w} 0 l {w} 5 l 0 5{{\\p0}}","Gfx",5)
def shade(a,b,y0,h,alpha="&H70&"):
    E(a,b,f"{{\\an7\\pos(-300,{y0})\\p1\\c&H000000&\\alpha{alpha}\\bord0\\shad0\\blur90\\fad(200,200)}}m 0 0 l 1680 0 l 1680 {h} l 0 {h}{{\\p0}}","Gfx",3)
# ---- notifications (5.45 -> 8.0) ----
NOT=[(5.5,"&HF0A030&","Calendario","Reunión","Comité de ventas · 10:00 a. m."),
     (6.2,"&H2E9BF5&","Recordatorios","Pendiente","Enviar propuesta antes de las 12"),
     (6.9,"&H5CC734&","Teléfono","Otra llamada","3 llamadas perdidas")]
OFF=7.98
for k,(t,col,app,ttl,body) in enumerate(NOT):
    y=1180+k*175; x=70; dur_ms=int((OFF-t)*1000)
    anim=f"\\move({x},{y-70},{x},{y},0,220)\\alpha&HFF&\\t(0,160,\\alpha&H00&)\\t({dur_ms},{dur_ms+180},\\alpha&HFF&)"
    E(t,OFF+0.2,f"{{\\an7{anim}\\p1\\c&HF2F2F2&\\bord0\\shad0\\blur1.2\\1a&H18&}}{rrect(940,150,38)}{{\\p0}}","Gfx",6)
    anim2=anim.replace(f"\\move({x},{y-70},{x},{y}",f"\\move({x+28},{y-70+29},{x+28},{y+29}")
    E(t,OFF+0.2,f"{{\\an7{anim2}\\p1\\c{col}\\bord0\\shad0}}{rrect(92,92,22)}{{\\p0}}","Gfx",7)
    def txt(dx,dy,s,size,bold,color="&H1A1A1A&"):
        a2=anim.replace(f"\\move({x},{y-70},{x},{y}",f"\\move({x+dx},{y-70+dy},{x+dx},{y+dy}")
        E(t,OFF+0.2,f"{{\\an7{a2}\\fn{HELV}\\fs{size}\\b{bold}\\c{color}\\bord0\\shad0}}{s}","Gfx",8)
    txt(142,24,ttl,40,1); txt(142,78,body,32,0,"&H3A3A3A&")
    a3=anim.replace(f"\\move({x},{y-70},{x},{y}",f"\\move({x+910},{y-70+28},{x+910},{y+28}")
    E(t,OFF+0.2,f"{{\\an9{a3}\\fn{HELV}\\fs{28}\\b0\\c&H808080&\\bord0\\shad0}}ahora","Gfx",8)
# airplane mode on badge
E(8.08,8.5,"{\\an8\\pos(540,1395)\\p1\\c&H141414&\\1a&H30&\\bord0\\shad0\\fscx60\\fscy60\\t(0,140,\\fscx100\\fscy100)\\fad(0,150)}"+rrect(660,96,48)+"{\\p0}","Gfx",4)
E(8.08,8.5,"{\\an8\\pos(540,1420)\\fn"+HELV+"\\b1\\fs46\\fsp4\\c&HFFFFFF&\\bord0\\shad3\\4a&H50&\\fscx60\\fscy60\\t(0,140,\\fscx100\\fscy100)\\fad(0,150)}MODO AVIÓN ACTIVADO","Gfx",5)
# ---- intro / bienvenida ----
shade(8.5,12.0,1180,500,"&H80&")
label(8.5,9.55,1260,"BIENVENIDO A",46,0,spacing=10)
title(8.5,9.55,1320,"Las Palmas",128,"Poppins ExtraBold",delay=80)
line(8.5,9.55,1490,160,150)
label(8.5,9.55,1520,"EL POBLADO · MEDELLÍN",36,220,GOLD,8)
label(9.9,12.0,1480,"Tu próximo hogar moderno",52,0,spacing=1)
label(9.9,12.0,1548,"rodeado de naturaleza",52,120,GOLD,1)
shade(12.0,13.5,1220,420,"&H90&")
label(12.0,13.5,1330,"Confort  ·  Tranquilidad",50,0,spacing=2)
label(12.0,13.5,1400,"UNO DE LOS SECTORES MÁS EXCLUSIVOS",30,150,GOLD,5)
# ---- features ----
shade(13.5,22.5,1150,560,"&H88&")
title(13.5,16.0,1180,"117,5 m²",150,"Poppins Black")
line(13.5,16.0,1385,160,200)
label(13.5,16.0,1410,"SALA Y COMEDOR AMPLIOS",42,250,spacing=6)
title(16.0,18.5,1230,"Cocina abierta",96,"Poppins ExtraBold")
label(16.0,18.5,1370,"PARA COMPARTIR TUS MEJORES MOMENTOS",30,180,GOLD,5)
title(18.5,21.5,1200,"2 habitaciones",96,"Poppins ExtraBold")
line(18.5,21.5,1340,160,200)
label(18.5,21.5,1365,"AMBAS CON BAÑO PRIVADO",42,250,spacing=6)
title(21.5,22.5,1230,"Vestier",104,"Poppins ExtraBold",delay=0)
label(21.5,22.5,1375,"EN LA HABITACIÓN PRINCIPAL",34,100,GOLD,6)
# ---- parking badges (top) ----
shade(31.5,37.0,170,420,"&HA0&")
title(31.6,37.0,250,"2 parqueaderos",84,"Poppins ExtraBold",delay=500)
label(31.6,37.0,370,"PRIVADOS  ·  CUARTO ÚTIL  ·  VIGILANCIA 24 H",28,800,GOLD,4)
# ---- price ----
shade(37.0,40.0,640,760,"&H55&")
label(37.0,40.0,760,"LAS PALMAS · EL POBLADO",34,0,GOLD,8)
E(37.0,40.0,"{\\an8\\pos(540,850)\\p1\\c&HFFFFFF&\\bord0\\shad0\\alpha&HFF&\\t(80,260,\\alpha&H00&)\\fad(0,160)}"+rrect(260,70,35).replace(" ",' ')+"{\\p0}","Gfx",5)
E(37.0,40.0,"{\\an8\\pos(540,858)\\fn"+HELV+"\\b1\\fs40\\fsp8\\c&H1A1A1A&\\bord0\\shad0\\alpha&HFF&\\t(80,260,\\alpha&H00&)\\fad(0,160)}VENTA","Gfx",6)
title(37.0,40.0,960,"$1.340.000.000",112,"Poppins Black",delay=160)
label(37.0,40.0,1110,"COP",40,260,spacing=10)
line(37.0,40.0,1185,200,300)
label(37.0,40.0,1215,"Administración: $1.000.000/mes",44,380,spacing=1,bold=0)
# ---- CTA pill ----
E(40.2,47.1,"{\\an8\\pos(540,260)\\p1\\c"+GOLD+"\\bord0\\shad3\\4a&H60&\\fscx40\\fscy40\\alpha&HFF&\\t(0,220,\\fscx100\\fscy100\\alpha&H00&)}"+rrect(640,120,60)+"{\\p0}","Gfx",5)
E(40.2,47.1,"{\\an8\\pos(540,282)\\fnPoppins Bold\\fs52\\c&H1A1A1A&\\bord0\\shad0\\fscx40\\fscy40\\alpha&HFF&\\t(0,220,\\fscx100\\fscy100\\alpha&H00&)}Comenta {\\fnPoppins Black}PALMAS","Gfx",6)
E(40.6,47.1,"{\\an8\\pos(540,400)\\fn"+HELV+"\\b1\\fs32\\fsp4\\c&HFFFFFF&\\bord0\\shad2\\4a&H40&\\fad(250,0)}Y AGENDA TU VISITA","Gfx",5)
hdr=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Poppins ExtraBold,82,&H00FFFFFF,&H00FFFFFF,&H00101010,&H90000000,0,0,0,0,100,100,1,0,1,5,3,2,60,60,520,1
Style: Gfx,Poppins,60,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,2,8,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(f'{S}/subs.ass','w').write(hdr+"\n".join(ev)+"\n")
# also export plain SRT of speech
srt=[]; n=1
for l in ev:
    if ",Sub," in l:
        p=l.split(",",9); txt=re.sub(r"\{[^}]*\}","",p[9])
        f=lambda s: "0"+s.replace(".",",")+"0" if len(s.split(":")[0])==1 else s
        srt.append(f"{n}\n{f(p[1])} --> {f(p[2])}\n{txt}\n"); n+=1
open(f'{S}/subtitulos.srt','w').write("\n".join(srt))
print(len(ev),"events")
