# Afro house original track, 120 BPM, synced to the edit (drop at M0).
import numpy as np, sys
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR=48000; BPM=120; B=60/BPM; ST=B/4; SW=0.018
M0=float(sys.argv[1]); TOTAL=float(sys.argv[2]); OUT=sys.argv[3]
N=int((TOTAL+3)*SR); L=np.zeros(N); R=np.zeros(N); rng=np.random.default_rng(11)
bus={k:(np.zeros(N),np.zeros(N)) for k in ("drums","perc","music")}
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2): return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
def add(sig,t,g=1.0,pan=0.0,b="music"):
    i=int(t*SR)
    if i<0 or i>=N: return
    s=sig[:N-i]; l,r=bus[b]
    l[i:i+len(s)]+=s*g*np.sqrt((1-pan)/2)*1.41; r[i:i+len(s)]+=s*g*np.sqrt((1+pan)/2)*1.41
def mtof(m): return 440*2**((m-69)/12)
def tt(d): return np.arange(int(d*SR))/SR
# ---- drums
def kick():
    t=tt(.5); f=48+90*np.exp(-t/0.03); s=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.26)
    s[:240]+=rng.normal(0,.25,240)*np.linspace(1,0,240); return np.tanh(1.8*s)
def clap():
    n=int(.28*SR); x=rng.normal(0,1,n); e=np.zeros(n)
    for o in (0,.008,.016,.024): i=int(o*SR); e[i:]+=np.exp(-np.arange(n-i)/SR/0.01)*.45
    e+=np.exp(-np.arange(n)/SR/0.07)*.55; return bp(x,1000,4200)*e
def hat(d): t=tt(d*6); return hp(rng.normal(0,1,len(t)),7500,4)*np.exp(-t/d)
def shaker(): t=tt(.09); return bp(rng.normal(0,1,len(t)),4500,11000)*np.minimum(1,t/0.012)*np.exp(-t/0.028)
# ---- afro percussion
def conga(f,d=0.22,slap=0.0):
    t=tt(d); ff=f*(1+0.35*np.exp(-t/0.012)); s=np.sin(2*np.pi*np.cumsum(ff)/SR)*np.exp(-t/(d/3.2))
    s+=0.45*np.sin(2*np.pi*np.cumsum(ff*1.52)/SR)*np.exp(-t/(d/6))
    if slap: s+=slap*bp(rng.normal(0,1,len(t)),1500,6000)*np.exp(-t/0.018)
    return s*0.8
def bongo(f): return conga(f,0.12,0.25)
def wood(): t=tt(.08); return (np.sin(2*np.pi*1150*t)+.5*np.sin(2*np.pi*2400*t))*np.exp(-t/0.018)
def rim(): t=tt(.07); return (bp(rng.normal(0,1,len(t)),1800,5000)*0.6+np.sin(2*np.pi*820*t))*np.exp(-t/0.012)
# ---- tonal
def saw(f,t): return 2*((f*t)%1)-1
def bass(m,d):
    t=tt(d); f=mtof(m); s=np.sin(2*np.pi*f*t)+.4*np.tanh(2.5*np.sin(2*np.pi*f*t))+.12*saw(f,t)
    return lp(s,330)*np.minimum(1,t/0.004)*np.exp(-t/(d*0.8))
def kalimba(m,d=0.9):
    t=tt(d); f=mtof(m)
    s=np.sin(2*np.pi*f*t)*np.exp(-t/0.45)+0.35*np.sin(2*np.pi*f*5.95*t)*np.exp(-t/0.05)+0.15*np.sin(2*np.pi*f*2*t)*np.exp(-t/0.2)
    s[:120]+=rng.normal(0,.2,120); return s*np.minimum(1,t/0.002)
def marimba(m,d=0.5):
    t=tt(d); f=mtof(m); return (np.sin(2*np.pi*f*t)+0.25*np.sin(2*np.pi*f*4*t)*np.exp(-t/0.03))*np.exp(-t/0.16)
def pad(notes,d,cut=2200):
    t=tt(d); s=np.zeros(len(t))
    for m in notes:
        for dt in (-0.07,0,0.07): s+=saw(mtof(m+dt),t+rng.random())
    s=lp(s/len(notes)/3,cut); return s*np.minimum(1,t/0.35)*np.clip((d-t)/0.35,0,1)
CH=[[57,60,64,67,71],[53,57,60,64,67],[48,55,59,62,64],[52,55,59,62,67]]   # Am9 Fmaj9 Cmaj9 Em7
ROOT=[45,41,48,40]
RIFF_A=[(0,81),(3,84),(6,88),(8,86),(10,84),(12,81),(14,79)]
RIFF_B=[(0,81),(3,84),(6,88),(8,91),(11,88),(14,86)]
BASSP=[(0,0,0.18),(3,0,0.15),(6,12,0.12),(8,0,0.2),(11,7,0.15),(14,0,0.12)]
def step_t(bar,s):   # time (music clock) of 16th step with swing
    return bar*16*ST+s*ST+(SW if s%2 else 0)
end_m=TOTAL-M0; nbar=int(np.ceil(end_m/(16*ST)))+1
STOP=(28.5,29.0)
def inside(m): return m<end_m-0.05 and not (STOP[0]<=m<STOP[1])
def perc_bar(T0, g=1.0):
    # T0 absolute time of bar start; afro conga/bongo/clave pattern
    for s in range(16):
        t=T0+s*ST+(SW if s%2 else 0)
        add(shaker(),t,(0.10 if s%4==2 else 0.055)*g,-0.35,"perc")
        if s in (3,11,14): add(conga(185),t,0.42*g,-0.25,"perc")
        if s in (6,7,15): add(conga(265),t,0.34*g,0.2,"perc")
        if s in (2,10): add(conga(330,0.18,0.6),t,0.3*g,0.3,"perc")
        if s in (0,5,9,13): add(bongo(520 if s%2 else 470),t,0.16*g,0.45,"perc")
        if s in (0,3,6,10,12): add(wood(),t,0.12*g,-0.5,"perc")
# ---- intro under the hook: filtered percussion + pad
bar_len=16*ST
first=M0-4*bar_len
for k in range(4):
    T0=first+k*bar_len
    if T0<-0.01: continue
    perc_bar(T0, 0.35+0.15*k)
    add(pad(CH[k%4],bar_len,900),T0,0.22)
    for s in (0,8): add(kick(),T0+s*ST,0.18 if k<3 else 0.3,0,"drums")
# riser + impact
t=tt(2.0); x=rng.normal(0,1,len(t)); rs=np.zeros(len(t))
for i in range(0,len(t),2400): rs[i:i+2400]=hp(x[i:i+2400],300+7000*(i/len(t))**2)
add(rs*(t/2.0)**2*0.22,M0-2.0,1,0,"music")
t=tt(1.4); boom=np.sin(2*np.pi*(38+50*np.exp(-t/0.05))*t)*np.exp(-t/0.45)
add(boom,M0,0.7,0,"drums")
# ---- main groove
kicks=[]
for bar in range(nbar):
    T0=M0+bar*bar_len; m0=bar*bar_len
    if m0>=end_m: break
    ch=bar%4
    for beat in range(4):
        m=m0+beat*B
        if not inside(m): continue
        add(kick(),M0+m,0.78,0,"drums"); kicks.append(M0+m)
        if beat in (1,3): add(clap(),M0+m,0.36,0.05,"drums")
        add(hat(0.06),M0+m+B/2,0.12,0.3,"drums")
    for s in range(16):
        m=step_t(bar,s)
        if not inside(m): continue
        t=M0+m
        add(shaker(),t,0.11 if s%4==2 else 0.06,-0.35,"perc")
        if s in (3,11,14): add(conga(185),t,0.45,-0.25,"perc")
        if s in (6,7,15): add(conga(265),t,0.36,0.2,"perc")
        if s in (2,10): add(conga(330,0.18,0.6),t,0.32,0.3,"perc")
        if s in (0,5,9,13): add(bongo(520 if s%2 else 470),t,0.17,0.45,"perc")
        if s in (0,3,6,10,12): add(wood(),t,0.13,-0.5,"perc")
        if s in (4,12) and bar%2==1: add(rim(),t,0.12,0.1,"perc")
    for s,iv,d in BASSP:
        m=step_t(bar,s)
        if inside(m): add(bass(ROOT[ch]+iv,d),M0+m,0.5,0,"music")
    if inside(m0): add(pad(CH[ch],bar_len),T0,0.26)
    riff=RIFF_A if bar%2==0 else RIFF_B
    for s,n in riff:
        m=step_t(bar,s)
        if inside(m): add(kalimba(n-12 if ch==1 and n>88 else n),M0+m,0.17,0.25)
    if bar>=4:
        for s in (2,7,10,15):
            m=step_t(bar,s)
            if inside(m): add(marimba(CH[ch][s%5]+12),M0+m,0.09,-0.4)
# price accent
t=tt(2.4); add(hp(rng.normal(0,1,len(t)),4500)*np.exp(-t/0.9),M0+29.0,0.12,0,"drums")
t=tt(0.5); add(hp(rng.normal(0,1,len(t)),2000)*(t/0.5)**3,M0+28.5,0.2,0,"drums")
add(boom[:SR],M0+29.0,0.5,0,"drums")
for s,n in RIFF_A[:4]: add(kalimba(n),M0+28.5+s*ST*0.5,0.16,0.2)
# ending
add(pad(CH[0],2.5,2600),TOTAL-0.7,0.25); add(kalimba(81,2.0),TOTAL-0.7,0.2)
# ---- sidechain + mix
sc=np.ones(N)
for T in kicks:
    i=int(T*SR); n=int(0.3*SR); e=1-0.6*np.exp(-np.arange(n)/SR/0.085); sc[i:i+n]=np.minimum(sc[i:i+n],e[:len(sc[i:i+n])])
ml,mr=bus["music"]; pl,pr=bus["perc"]; dl,dr=bus["drums"]
L=dl+pl*sc**0.3+ml*sc; R=dr+pr*sc**0.3+mr*sc
mix=np.stack([L,R],1); mix=np.tanh(mix*1.25)/1.25
mix=mix[:int((TOTAL+0.05)*SR)]; f=int(0.6*SR); mix[-f:]*=np.linspace(1,0,f)[:,None]
mix/=np.abs(mix).max()*1.1
wavfile.write(OUT,SR,(mix*32767).astype(np.int16)); print("ok")
