cd /home/claude/filetransfer && rm -rf dst && mkdir -p dst
SIZE=314572800; SS=39321600; DONE=4
dd if=src/f_300M.bin of=dst/f_300M.bin.part bs=$SS count=$DONE status=none
python3 - << 'PY'
import struct
size,ss,n,done=314572800,39321600,8,4
out=struct.pack(">IQII",0x46544632,size,0x81cfbbf7,n)
for i in range(n):
    ln=min(ss,size-i*ss)
    out+=struct.pack(">QB",ln,1) if i<done else struct.pack(">QB",0,0)
open("dst/f_300M.bin.state","wb").write(out)
PY
stdbuf -oL ./server 9093 dst >/tmp/sr.log 2>&1 & SRV=$!
sleep 0.5
./client 127.0.0.1 9093 4 src/f_300M.bin >/dev/null
sleep 0.2
echo "--- 服务端分片 resume 起点 (39321600=该片已完成被跳过, 0=从头传) ---"
grep -oE "shard [0-7]/8 off=[0-9]+ len=[0-9]+ resume@[0-9]+" /tmp/sr.log | sort
kill $SRV 2>/dev/null