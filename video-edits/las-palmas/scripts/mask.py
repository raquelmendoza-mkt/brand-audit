import sys, os, glob, numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove
sess=new_session(sys.argv[3])
fs=sorted(glob.glob(sys.argv[1]+'/*.png'))
if len(sys.argv)>4: fs=[fs[int(i)] for i in sys.argv[4].split(',')]
for f in fs:
    im=Image.open(f).convert('RGB')
    m=remove(im,session=sess,only_mask=True,post_process_mask=True)
    m.save(os.path.join(sys.argv[2],os.path.basename(f)))
    print(os.path.basename(f),flush=True)
