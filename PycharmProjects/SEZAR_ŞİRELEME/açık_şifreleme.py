def stream_encyrpt(text,key):
    chiper = ""
    for i in range (len(text)):
        chiper+=chr(ord(text[i])^ord(key[i%len(key)]))

    return chiper

text="zaman"

key="abc"
encrypted = stream_encyrpt(text,key)
decrypted = stream_encyrpt(encrypted,key)

print("orjinal:",text)
print("şifreli:",[ord(c) for c in encrypted])
print ("çözülmüş: ",decrypted)