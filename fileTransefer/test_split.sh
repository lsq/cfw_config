cd /home/claude/filetransfer && make clean >/dev/null && make >/dev/null 2>&1
rm -rf src dst && mkdir -p src dst
for s in 1 8 100 300; do head -c ${s}M /dev/urandom > src/f_${s}M.bin; done
echo "源文件:"; ls -la src/ | awk '{print $5, $9}'
./server 9097 dst >/tmp/s.log 2>&1 & SRV=$!
sleep 0.5
echo "--- 6 并发连接传输 (100M/300M 会被切成多片) ---"
time ./client 127.0.0.1 9097 6 src/*.bin
echo "--- 服务端分片日志(节选) ---"; grep "shard" /tmp/s.log | head -20
echo "--- 完整性比对 ---"
(cd src && md5sum *.bin)|sort>/tmp/a; (cd dst && md5sum *.bin)|sort>/tmp/b
diff -q /tmp/a /tmp/b >/dev/null && echo "ALL MATCH ✔" || { echo MISMATCH; diff /tmp/a /tmp/b; }
kill $SRV 2>/dev/null