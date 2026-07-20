cd /home/claude/filetransfer && rm -rf dst2 && mkdir -p dst2
# 模拟"上次只收到了 60M 文件的前 30M"：手动放一个 30M 的 .part
head -c 30M src/file_60M.bin > dst2/file_60M.bin.part
echo "已存在的 .part 大小: $(stat -c%s dst2/file_60M.bin.part) bytes (= 前 30M)"
./server 9098 dst2 >/tmp/srv2.log 2>&1 &
SRV=$!
sleep 0.5
echo "--- 续传该文件 ---"
./client 127.0.0.1 9098 1 src/file_60M.bin
kill $SRV 2>/dev/null
echo "--- 服务端日志(注意 resume@) ---"; cat /tmp/srv2.log
echo "--- 续传结果校验 ---"
md5sum src/file_60M.bin dst2/file_60M.bin