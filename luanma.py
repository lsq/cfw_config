# 假设 s 是乱码字符串
s = 'è\x8a\x82ç\x82¹'

# 先用 latin1 编码回原始字节
original_bytes = s.encode('latin1')  # b'\xe8\x8a\x82\xe7\x82\xb9'
print(f'byte(latin1): {original_bytes}')

# 再用 utf-8 解码
correct_text = original_bytes.decode('utf-8')  # '节点'
print(f'解码后：{correct_text}')

s = '鍧€'
original_bytes = s.encode('gbk')  # b'\xe8\x8a\x82\xe7\x82\xb9'
print(f'byte(latin1): {original_bytes}')
correct_text = original_bytes.decode('utf-8')  # '节点'
print(f'解码后：{correct_text}')
