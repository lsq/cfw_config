cd /home/claude/filetransfer && rm -rf src dst && mkdir -p src dst
# 造 5 个大小不一的文件 (1MB ~ 60MB)
for s in 1 5 20 50 60; do
  head -c ${s}M /dev/urandom > src/file_${s}M.bin
done
ls -la src/
echo "--- 启动服务端 ---"
./server 9099 dst >/tmp/srv.log 2>&1 &
SRV=$!
sleep 0.5
echo "--- 并行传输 (4 线程) ---"
./client 127.0.0.1 9099 4 src/*.bin
echo "--- 校验源/目标 MD5 是否一致 ---"
( cd src && md5sum *.bin ) | sort > /tmp/src.md5
( cd dst && md5sum *.bin ) | sort > /tmp/dst.md5
if diff -q /tmp/src.md5 /tmp/dst.md5 >/dev/null; then echo "ALL FILES MATCH ✔"; else echo "MISMATCH �’"; diff /tmp/src.md5 /tmp/dst.md5; fi
kill $SRV 2>/dev/null
echo "--- server log ---"; cat /tmp/srv.log