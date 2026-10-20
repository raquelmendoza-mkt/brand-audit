import sys, json, subprocess, numpy as np, sherpa_onnx
P="/tmp/asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/"
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=P+"encoder.int8.onnx", decoder=P+"decoder.int8.onnx", joiner=P+"joiner.int8.onnx", tokens=P+"tokens.txt", model_type="nemo_transducer", num_threads=4)
out={}
for f in sys.argv[2:]:
    a = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    x = np.frombuffer(a,np.int16).astype(np.float32)/32768
    r=rec.create_stream(); r.accept_waveform(16000,x); rec.decode_stream(r)
    toks=list(zip(r.result.tokens, r.result.timestamps))
    # group into words
    words=[]
    for t,ts in toks:
        if t.startswith((" ","▁")) or not words: words.append([t.strip(" ▁"),ts])
        else: words[-1][0]+=t
    k=f.split('/')[-1].replace('.mp4','')
    out[k]=words
    print(k,"|",r.result.text); print("   ", " ".join(f"{w}@{ts:.2f}" for w,ts in words))
json.dump(out,open(sys.argv[1],"w"),ensure_ascii=False,indent=1)
