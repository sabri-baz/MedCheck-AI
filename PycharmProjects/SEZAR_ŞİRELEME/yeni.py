def block_encerypt(text,key,block_size=4):
    chiper = ""
    for i in range (0,len(text),block_size):
        block=text[i:i+block_size]
        while len(block)<block_size:
            block+="_"
        for j in range (block_size):
            chiper+=chr(ord(block[j])^ord(key[j%len(key)]))

    return chiper
text ="MERHABAMERHABA"
KEY="KEY1"
encerypted = block_encerypt(text,KEY)

print("şifreli:",[ord(c) for c in encerypted])