import numpy as np, sys
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
SR=48000; BPM=120; B=60/BPM
M0=float(sys.argv[1]); TOTAL=float(sys.argv[2]); OUT=sys.argv[3]
N=int((TOTAL+2)*SR); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b): return sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); 
    if i>=N or i+len(sig)<0: return
    s=sig[:N-i] if i>=0 else sig[-i:N]; i=max(i,0)
    L[i:i+len(s)]+=s*g*np.sqrt((1-pan)/2)*1.4; R[i:i+len(s)]+=s*g*np.sqrt((1+pan)/2)*1.4
def mtof(m): return 440*2**((m-69)/12)
def env(n,a,d): 
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))*np.exp(-t/d); return e
# instruments
def kick():
    n=int(.45*SR); t=np.arange(n)/SR; f=45+75*np.exp(-t/0.035); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t/0.22); s[:200]+=rng.normal(0,.3,200)*np.linspace(1,0,200); return np.tanh(1.6*s)
def clap():
    n=int(.3*SR); x=rng.normal(0,1,n); e=np.zeros(n)
    for o in (0,.009,.018): i=int(o*SR); e[i:]+=np.exp(-np.arange(n-i)/SR/0.012)*.5
    e+=np.exp(-np.arange(n)/SR/0.09)*.6; return bp(x,900,3500)*e
def hat(d=0.03): n=int((d*6)*SR); return hp(rng.normal(0,1,n),7000,4)*env(n,0.001,d)
def shaker(): n=int(.08*SR); return hp(rng.normal(0,1,n),5000,2)*env(n,0.01,0.025)
def bass(m,d):
    n=int(d*SR); t=np.arange(n)/SR; f=mtof(m); s=np.sin(2*np.pi*f*t)+.35*np.sin(4*np.pi*f*t)+.15*np.tanh(3*np.sin(2*np.pi*f*t))
    return lp(s,400)*env(n,0.005,d*0.7)
def saw(f,t): return 2*((f*t)%1)-1
def pad(notes,d,cut=1800):
    n=int(d*SR); t=np.arange(n)/SR; s=np.zeros(n)
    for m in notes:
        for dt in (-0.08,0.0,0.08): s+=saw(mtof(m+dt),t+rng.random())
    s=lp(s/len(notes)/3,cut,2); a=np.minimum(1,t/0.25)*np.minimum(1,(d-t)/0.3).clip(0); return s*a
def keys(notes,d=0.6):
    n=int(d*SR); t=np.arange(n)/SR; s=np.zeros(n)
    for m in notes:
        f=mtof(m); mod=np.sin(2*np.pi*f*t)*2.0*np.exp(-t/0.15); s+=np.sin(2*np.pi*f*t+mod)*np.exp(-t/0.35)
    return s/len(notes)
def pluck(m,d=0.25):
    n=int(d*SR); t=np.arange(n)/SR; s=saw(mtof(m),t)*np.exp(-t/0.08); return lp(s,3000)
# chords: Am9, Fmaj9, Cmaj7, G6
CH=[[57,60,64,67,71],[53,57,60,64,67],[48,55,59,64,67],[55,59,62,64,67]]
ROOT=[45,41,48,43]
def sec(m): return M0+m
end_m=TOTAL-M0
nbar=int(np.ceil(end_m/(4*B)))
kicks=[]
# pre-intro pad under hook (filtered, soft)
add(pad([57,60,64,71],M0+0.2,cut=700),0.0,0.10)
# riser into M0
n=int(2.2*SR); t=np.arange(n)/SR; x=rng.normal(0,1,n)
rs=np.zeros(n)
for i in range(0,n,2400):
    seg=x[i:i+2400]; rs[i:i+2400]=hp(seg,300+6000*(i/n)**2,2)
add(rs*(t/2.2)**2*0.25,M0-2.2,1.0)
# impact at M0
n=int(1.5*SR); t=np.arange(n)/SR; boom=np.sin(2*np.pi*(40+40*np.exp(-t/0.05))*t)*np.exp(-t/0.5)
add(boom,M0,0.7); add(lp(rng.normal(0,1,n),2000)*np.exp(-t/0.4),M0,0.15)
STOP=(29-0.5, 29.0)   # drum stop before price (music time)
for bar in range(nbar):
    for beat in range(4):
        m=bar*4*B+beat*B
        if m>=end_m-0.05: continue
        stop = STOP[0]<=m<STOP[1]
        T=sec(m)
        if not stop:
            add(kick(),T,0.75); kicks.append(T)
            if beat in (1,3): add(clap(),T,0.5,0.05)
            add(hat(0.025),T+B/2,0.16,0.3)
            if bar>=4: add(hat(0.09),T+B/2,0.09,-0.3)
            for k in range(4): add(shaker(),T+k*B/4,0.05 if k%2 else 0.03,-0.4)
            # offbeat bass
            add(bass(ROOT[bar%4],B*0.45),T+B/2,0.42)
            if beat==3 and bar%2==1: add(bass(ROOT[bar%4]+12,B*0.25),T+B*0.75,0.25)
    # pad per bar
    m=bar*4*B
    if m<end_m: add(pad(CH[bar%4],4*B,2600),sec(m),0.42)
    # keys stabs syncopated
    for off in (0.0,1.5,2.5) if bar%2==0 else (0.5,2.0,3.5):
        mm=m+off*B
        if mm<end_m-0.3 and not (STOP[0]<=mm<STOP[1]): add(keys([n_+12 for n_ in CH[bar%4][1:4]]),sec(mm),0.34,0.15)
    # arp from bar 4
    if bar>=4:
        for k in range(8):
            mm=m+k*B/2
            if mm<end_m-0.2: add(pluck(CH[bar%4][k%5]+12),sec(mm)+B/4,0.13,0.5 if k%2 else -0.5)
# crash on price + reverse swell before
n=int(2.5*SR); t=np.arange(n)/SR; cr=hp(rng.normal(0,1,n),4000)*np.exp(-t/0.9)
add(cr,sec(29.0),0.12)
n=int(0.5*SR); t=np.arange(n)/SR; add(hp(rng.normal(0,1,n),2000)*(t/0.5)**3,sec(28.5),0.2)
add(boom[:int(1.0*SR)],sec(29.0),0.5)
# final chord ring
add(pad(CH[0],2.5,2500),TOTAL-0.6,0.18); add(keys([69,72,76,79],2.0),TOTAL-0.6,0.18)
# sidechain pump
sc=np.ones(N)
for T in kicks:
    if T<M0: continue
    i=int(T*SR); n=int(0.32*SR); e=1-0.55*np.exp(-np.arange(n)/SR/0.09)
    sc[i:i+n]=np.minimum(sc[i:i+n],e[:len(sc[i:i+n])])
# apply sidechain only to non-kick? approximate: whole mix gently
L*=sc**0.6; R*=sc**0.6
mix=np.stack([L,R],1); mix=np.tanh(mix*1.2)/1.2
mix=mix[:int((TOTAL+0.05)*SR)]
fade=int(0.6*SR); mix[-fade:]*=np.linspace(1,0,fade)[:,None]
mix/=np.abs(mix).max()*1.12
wavfile.write(OUT,SR,(mix*32767).astype(np.int16))
print("ok",len(mix)/SR)
