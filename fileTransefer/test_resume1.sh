cd /home/claude/filetransfer && rm -rf dst && mkdir -p dst
SIZE=314572800; SHARDS=8; SS=$(( (SIZE + SHARDS - 1) / SHARDS ))   # 每片大小
DONE=4                                                            # 预置前4片已完成
echo "每片大小=$SS, 预置前 $DONE 片 (= $((DONE*SS)) 字节) 到 .part"
dd if=src/f_300M.bin of=dst/f_300M.bin.part bs=$SS count=$DONE status=none
# 构造 .state (大端): magic,total_size,total_crc(=0x81cfbbf7),shard_count + 每片[received u64][done u8]
python3 - "$SIZE" "$SS" "$SHARDS" "$DONE" << 'PY'
import sys,struct
size,ss,n,done=map(int,sys.argv[1:5])
magic=0x46544632; crc=0x81cfbbf7
out=struct.pack(">IQII",magic,size,crc,n)
for i in range(n):
    off=i*ss; ln=min(ss,size-off)
    if i<done: out+=struct.pack(">QB",ln,1)      # 已完成
    else:      out+=struct.pack(">QB",0,0)        # 未开始
open("dst/f_300M.bin.state","wb").write(out)
print("已写 .state, 大小",len(out),"字节")
PY
echo "--- 启动服务端并运行客户端(应只续传后 4 片) ---"
./server 9094 dst >/tmp/sr.log 2>&1 & SRV=$!
sleep 0.5
./client 127.0.0.1 9094 4 src/f_300M.bin
echo "--- 服务端各分片 resume 起点 (前4片应=每片大小即已完成跳过, 后4片=0) ---"
grep "f_300M" /tmp/sr.log | sort
echo "--- 最终校验 ---"
md5sum src/f_300M.bin dst/f_300M.bin
kill $SRV 2>/dev/null