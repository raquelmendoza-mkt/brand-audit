import json, subprocess, os, sys
from concurrent.futures import ThreadPoolExecutor
S=sys.argv[1]; e=json.load(open(f'{S}/ad2/edl.json')); RAW=S; os.makedirs(f'{S}/ad2/segs',exist_ok=True)
def src(c):
    for p in (f'{S}/raw/{c}.MOV',f'{S}/raw/{c}.mp4',f'{S}/ai/{c}.mp4'):
        if os.path.exists(p): return p
import itertools
CUM=[0]+list(itertools.accumulate(x[2] for x in e))
def job(i):
    c,a,d,k=e[i]; nf=round(CUM[i+1]*30)-round(CUM[i]*30); z0,z1={'hook':(1.0,1.05),'talk':(1.0,1.04),'screen':(1.0,1.03),'punch':(1.12,1.15),'hero':(1.0,1.12),'endcard':(1.06,1.12),'ai':(1.0,1.06)}.get(k,(1.0,1.08))
    pre = 'crop=1145:2036:507:1790,' if k=='cropbuilding' else ''
    zx=f"({z0}+({z1}-{z0})*t/{d})"
    vf=(f"{pre}scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30,"
        f"scale=w='trunc(1080*{zx}/2)*2':h='trunc(1920*{zx}/2)*2':eval=frame:flags=bicubic,crop=1080:1920,"
        f"eq=contrast=1.04:saturation=1.07:gamma=0.99,colorbalance=rs=0.015:bs=-0.015:rh=0.01:bh=-0.01,unsharp=5:5:0.35,setsar=1,format=yuv420p")+(",gblur=sigma=14,eq=brightness=-0.13:saturation=0.85" if k=='endcard' else "")
    cmd=['ffmpeg','-v','error','-y','-ss',str(a),'-i',src(c),'-t',str(d+0.3),'-frames:v',str(nf),'-an','-vf',vf,'-r','30','-c:v','libx264','-preset','medium','-crf','13',f'{S}/ad2/segs/s{i:02d}.mp4']
    r=subprocess.run(cmd,capture_output=True,text=True); return i,r.returncode,r.stderr[-300:]
with ThreadPoolExecutor(4) as ex:
    for i,rc,err in ex.map(job,range(len(e))): print(i,rc,err)
