cd /home/claude/filetransfer && rm -rf dst && mkdir -p dst
# 第一次传输 300M 文件, 中途强杀服务端模拟崩溃
./server 9095 dst >/tmp/s1.log 2>&1 & SRV=$!
sleep 0.4
./client 127.0.0.1 9095 6 src/f_300M.bin >/tmp/c1.log 2>&1 &
CLI=$!
sleep 0.5
kill -9 $SRV 2>/dev/null            # 模拟服务端崩溃
wait $CLI 2>/dev/null
echo "--- 崩溃后磁盘残留 ---"
ls -la dst/
echo ".part 已落盘字节: $(stat -c%s dst/f_300M.bin.part 2>/dev/null) / 314572800"
echo ".state 各分片 received(前若干字节非0即说明有进度):"
xxd dst/f_300M.bin.state 2>/dev/null | head -3
echo
echo "--- 重启服务端并续传 ---"
./server 9095 dst >/tmp/s2.log 2>&1 & SRV2=$!
sleep 0.5
./client 127.0.0.1 9095 6 src/f_300M.bin
grep -E "resume@[1-9]" /tmp/s2.log | head -8 && echo "(上面 resume@非0 即为续传起点)"
echo "--- 最终校验 ---"
md5sum src/f_300M.bin dst/f_300M.bin
kill $SRV2 2>/dev/null