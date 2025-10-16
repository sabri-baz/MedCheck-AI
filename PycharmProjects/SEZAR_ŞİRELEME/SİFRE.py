def sezar_sifrele(metin, kaydirma):
    alfabe = "abcçdefgğhıijklmnoöprsştuüvyzwx"
    sifreli_metin = ""

    for harf in metin.lower():
        if harf in alfabe:
            eski_index = alfabe.index(harf)
            yeni_index = (eski_index - kaydirma) % len(alfabe)
            sifreli_metin += alfabe[yeni_index]
        else:
            sifreli_metin += harf

    return sifreli_metin


def sezar_coz(sifreli_metin, kaydirma):
    alfabe = "abcçdefgğhıijklmnoöprsştuüvyzwx"
    cozulmus_metin = ""

    for harf in sifreli_metin.lower():
        if harf in alfabe:
            eski_index = alfabe.index(harf)
            yeni_index = (eski_index + kaydirma) % len(alfabe)
            cozulmus_metin += alfabe[yeni_index]
        else:
            cozulmus_metin += harf

    return cozulmus_metin


# Kullanım
metin = input("Metin giriniz: ")
kaydirma = int(input("Kaydırma miktarını giriniz: "))

sifreli = sezar_sifrele(metin, kaydirma)
print("Şifreli metin:", sifreli)

cozulmus = sezar_coz(sifreli, kaydirma)
print("Çözülmüş metin:", cozulmus)
