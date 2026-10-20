import numpy as np, sys
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=48000; TOT=47.2; x=np.zeros(int(TOT*SR)); rng=np.random.default_rng(3)
def add(s,t,g):
    i=int(t*SR); x[i:i+len(s)]+=s[:len(x)-i]*g
def ding():
    out=np.zeros(int(0.6*SR))
    for k,(f,o) in enumerate([(1568,0),(2093,0.09)]):
        n=int(0.5*SR); t=np.arange(n)/SR; s=(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*2*f*t))*np.exp(-t/0.12)*np.minimum(1,t/0.003)
        i=int(o*SR); out[i:i+n]+=s
    return out
def whoosh(d=0.6,up=True):
    n=int(d*SR); t=np.arange(n)/SR; w=rng.normal(0,1,n); out=np.zeros(n)
    for i in range(0,n,1200):
        p=i/n; f=(400+5000*p) if up else (5000-4400*p)
        sos=butter(2,[f*0.6,min(f*1.6,20000)],'band',fs=SR,output='sos'); out[i:i+1200]=sosfilt(sos,w[i:i+1200])
    return out*np.sin(np.pi*t/d)**2
for t in (5.55,6.25,6.95): add(ding(),t,0.35)
add(whoosh(0.5,False),7.75,0.5)   # notifications vanish / airplane on
add(whoosh(0.45),9.25,0.25); add(whoosh(0.45),36.75,0.3)
x=x/ max(1,np.abs(x).max()/0.9)
wavfile.write(sys.argv[1],SR,(np.stack([x,x],1)*32767).astype(np.int16))
