import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiHelpCircle, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import './DentalAssistance.css';

const DentalAssistance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Ref for category details scroll
  const detailsRef = useRef(null);
  
  // Ref for chat messages to auto-scroll to bottom
  const chatMessagesRef = useRef(null);

  // Auto-scroll to details when category selected
  useEffect(() => {
    if (selectedCategory && detailsRef.current) {
      detailsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [selectedCategory]);

  // Auto-scroll to bottom of chat when new message added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

 const categories = [
    {
      name: 'Profilaktika',
      description: 'Muntazam tekshiruvlar, tozalash, fissura sealantlari va ftorli davolash tish muammolarining oldini olish uchun.',
      details: `Tishlar profilaktikasi - tish kasalliklarining oldini olish va og'iz bo'shlig'i sog'lig'ini saqlash bo'yicha chora-tadbirlar majmui. Bu sog'lom tabassum va umumiy salomatlikni ta'minlashning birinchi qadamidir.
      
Asosiy profilaktik choralar:
1. Muntazam tekshiruvlar - yiliga kamida 2 marta tish shifokoriga tashrif buyurish
2. Professional tish tozalash - tartar va cho'kmalarni olib tashlash
3. Fissura sealantlari - tishlarning chayqalgan joylarini himoya qilish uchun maxsus materiallar
4. Ftorli davolash - tish emalini mustahkamlash
5. To'g'ri parvarish - kuniga 2 marta tishlarni yuvish, tish ipidan foydalanish
6. Ovqatlanish tartibi - shakarli ovqatlarni cheklash
7. Antiseptik og'iz yuvish vositalari - bakteriyalarni yo'q qilish
8. Elektr tish cho'tkalari - yanada samarali tozalash uchun
9. Tish go'shti massaji - qon aylanishini yaxshilash

Profilaktika tishlar va qizilo'ngachning kariyes, periodontit, gingivit kabi kasalliklarining oldini oladi. Bolalarda va kattalarda profilaktik choralar tish shifokoriga tashriflar va davolash xarajatlarini sezilarli darajada kamaytiradi.`
    },
    {
      name: 'Restavratsiya',
      description: 'Shikastlangan tishlarni tiklash uchun plomba, koronka, ko‘prik va protezlar.',
      details: `Tish restavratsiyasi - shikastlangan yoki yo'qolgan tishlarni tiklash va ularning funksiyasini qaytarish bilan shug'ullanadigan stomatologiya sohasi. Bu jarayon tishning tabiiy ko'rinishi va funksionalligini tiklaydi.
      
Restavratsiya turlari:
1. Plombalash - kariyesdan keyin tishdagi tuynuklarni to'ldirish
   - Kompozit materiallar (tabiiy ko'rinish, eng keng tarqalgan)
   - Amalgama (kumush rangli, mustahkam)
   - Shisha ionomer plombalar (ftor chiqaradi, bolalarda ishlatiladi)
   - Sement plombalar (vaqtincha)
   
2. Koronkalar (tish qopqoqlari) - kuchli shikastlangan tishlarni qoplash
   - Metall (oltin, xrom-kobalt)
   - Sirkoniy (yuqori estetika)
   - Metallokeramika (mustahkamlik va go'zallik)
   - To'liq keramika (estetik jihatdan eng yaxshi)
   
3. Ko'priklar - bir yoki bir nechta yo'qolgan tishlarni almashtirish
   - Qo'shni tishlarga mahkamlanadi
   - Zamonaviy materiallar (sirkoniy, keramika)
   
4. Protezlar - ko'p sonli yo'qolgan tishlarni almashtirish
   - Qisqa muddatli va doimiy variantlar
   - Moslashuvchan protezlar (yumshoq materiallardan)
   
5. Inley va onley - katta plombalar o'rniga ishlatiladigan keramika yoki kompozit qoplamalar

Restavratsiya usullari bemorning ehtiyojlari, byudjeti va estetik talablariga qarab tanlanadi.`
    },
    {
      name: 'Kosmetik Stomatologiya',
      description: 'Tishlarning ko‘rinishini yaxshilash uchun oqartirish, vinirlar va bondinq.',
      details: `Kosmetik stomatologiya - tishlarning tashqi ko'rinishini yaxshilashga qaratilgan stomatologiya sohasi bo'lib, estetik va funksional jihatlarni muvozanatlashtiradi.
      
Asosiy xizmatlar:
1. Tishlarni oqartirish (bleaching)
   - Ofisda oqartirish (shifokor tomonidan, 1-2 soat)
   - Uyda oqartirish (maxsus kapkalar bilan, 2-4 hafta)
   - Oqartirish tayyorlari (dorixonada sotiladi, kamroq samarali)
   - Lazerli oqartirish (tez va samarali)
   
2. Vinirlar (laminates)
   - Juda nozik keramika plastinkalar
   - Tishning old qismiga yopishtiriladi
   - Rang, shakl va o'lchamdagi nuqsonlarni yashiradi
   - Ultra nozik vinirlar (minimal silliqlash talab qiladi)
   
3. Bonding (kompozit vinirlar)
   - Kompozit materialdan tishga shakl berish
   - Vinirlarga qaraganda arzonroq
   - 3-5 yilgacha xizmat qiladi
   
4. Tishlarning konturini o'zgartirish
   - Tishning chetlarini slliqlash
   - Tishlar orasidagi bo'shliqlarni yopish
   
5. Estetik bezaklar
   - Tishlarga olmos yoki dekorativ qoplamalar qo'yish
   - Vaqtincha yoki doimiy variantlar

Kosmetik stomatologiya tabassumni jozibali qilish va bemorlarning o'ziga ishonchini oshirishga yordam beradi.`
    },
    {
      name: 'Endodontiya',
      description: 'Yuqumli tishlarni saqlab qolish uchun ildiz kanali davolash.',
      details: `Endodontiya - tishning ichki qismi (pulpa) va uning atrofidagi to'qimalar bilan shug'ullanadigan stomatologiya sohasi. Asosiy maqsad - infektsiyalangan tishlarni saqlab qolish.
      
Ildiz kanali davolash jarayoni:
1. Diagnostika - rentgen yoki 3D tomografiya orqali zararlanishni aniqlash
2. Anesteziya - og'riqsiz davolash
3. Kirish ochishi - tishning markaziy qismiga kirish
4. Tozalash va shakllantirish - infektsiyalangan to'qimalarni olib tashlash
5. To'ldirish - maxsus materiallar bilan kanallarni to'ldirish
6. Restavratsiya - tishni koronka yoki plomba bilan tiklash

Talab qilinadigan holatlar:
- Chuqur kariyes
- Tishning sinishi yoki shikastlanishi
- Takroriy stomatologik protseduralar
- Tishda doimiy og'riq
- Issiqqa va sovuqqa sezgirlik
- Tish ildizidagi kista yoki abssess

Zamonaviy usullar:
- Mikroskopik endodontiya - yuqori aniqlik
- Lazerli tozalash - infektsiyani samarali yo'q qilish
- 3D tasvirlash - murakkab kanallarni aniqlash

Endodontik davolash tishni olib tashlash o'rniga uni saqlab qolishga imkon beradi.`
    },
    {
      name: 'Periodontologiya',
      description: 'Mushak kasalliklari davolash, skeyling va ildizlarni rejalashtirish.',
      details: `Periodontologiya - tishlarni qo'llab-quvvatlovchi to'qimalar (mushak, suyak, ligamentlar) kasalliklari bilan shug'ullanadigan stomatologiya sohasi.
      
Asosiy kasalliklar:
1. Gingivit - mushaklarning yallig'lanishi
   - Alomatlar: qizarish, shish, qon ketish
   - Sabablari: yomon og'iz gigienasi, tartar
   
2. Periodontit - mushak va suyakning chuqurroq infektsiyasi
   - Tish va mushak orasida "cho'ntak"lar paydo bo'lishi
   - Tishlarning yemirilishi va yo'qolishiga olib kelishi mumkin
   
Davolash usullari:
1. Konservativ davolash
   - Professional tish tozalash (skeyling)
   - Ildizlarni tekislash (zararlangan to'qimalarni olib tashlash)
   - Antiseptiklar bilan davolash
   - Lazerli terapiya (yallig'lanishni kamaytirish)
   
2. Jarrohlik davolash
   - Flap operatsiyasi (mushaklarni ochish va tozalash)
   - Suyak greftlari (suyakni tiklash)
   - Yumshoq to'qimalarni qayta qurish
   
3. Qo'shimcha davolash
   - Antibiotiklar (og'iz orqali yoki mahalliy)
   - Og'iz gigienasini yaxshilash bo'yicha maslahatlar
   - Muntazam profilaktik tekshiruvlar

Periodontologik davolash tishlarning barqarorligini ta'minlaydi va yo'qotish xavfini kamaytiradi.`
    },
    {
      name: 'Ogiz Jarrohligi',
      description: 'Tishlarni olib tashlash, aqllik tishlari olib tashlash va implantlar.',
      details: `Og'iz jarrohligi - og'iz bo'shlig'i, jag' va yuzdagi muammolarni operatsion usulda davolash bilan shug'ullanadigan stomatologiya sohasi.
      
Asosiy protseduralar:
1. Tishlarni olib tashlash (ekstraksiya)
   - Oddiy ekstraksiya - ko'rinadigan tishlar
   - Jarrohlik ekstraksiya - yashirin yoki sinib ketgan tishlar
   
2. Aqllik tishlarini olib tashlash
   - To'liq yoki qisman chiqmagan tishlar
   - Og'riq, infektsiya yoki boshqa tishlarga zarar yetkazishni oldini olish
   
3. Dental implantlar
   - Yo'qolgan tishlarning ildizini almashtirish
   - Titan yoki sirkoniydan yasalgan sun'iy ildiz
   - Ustiga koronka, ko'prik yoki protez o'rnatiladi
   - Mini-implantlar (vaqtincha yechimlar uchun)
   
4. Jag' jarrohligi
   - Jag'ning noto'g'ri joylashishini tuzatish
   - O'nglash osteotomiyasi (suyaklarni qayta shakllantirish)
   
5. Rezektsiya
   - Tish ildizi uchidagi kista yoki yallig'lanishni olib tashlash
   
6. Pretezik jarrohlik
   - Protezlar uchun suyak yoki yumshoq to'qimalarni tayyorlash
   
7. Yumshoq to'qima jarrohligi
   - Lab yoki til bog'ini tuzatish
   - Mushak greftlari

Og'iz jarrohligi mahalliy yoki umumiy anesteziya ostida amalga oshiriladi va tiklanish jarayoni muhim ahamiyatga ega.`
    },
    {
      name: 'Ortodontiya',
      description: 'Tishlarning tishlishi va joylashishidagi nuqsonlarni tuzatish uchun tish qavish va alignerlar.',
      details: `Ortodontiya - tishlarning noto'g'ri joylashishi va jag'larning noto'g'ri rivojlanishi bilan shug'ullanadigan stomatologiya sohasi. Maqsad - tishlashni tuzatish va estetik ko'rinishni yaxshilash.
      
Asosiy muammolar:
1. Tishlarning qalin joylashishi
2. Ortiqcha tishlar
3. Ochqotar (tishlar orasidagi bo'shliqlar)
4. Noto'g'ri tishlash (maloklyuziya)
   - II sinf maloklyuziya (yuqori jag'ning oldinga chiqishi)
   - III sinf maloklyuziya (pastki jag'ning oldinga chiqishi)
   - Ochiq tishlash (old tishlarning yopilmasligi)
   - Chuqur tishlash (yuqori tishlarning pastki tishlarni qoplashi)
   
Davolash usullari:
1. Tish qavish (breket sistemasi)
   - Metall breketlar (an'anaviy)
   - Keramika breketlar (kamroq ko'rinadigan)
   - Lingval breketlar (tishning ichki tomonida)
   - O'z-o'zini bog'laydigan breketlar
   
2. Alignerlar (aniqlashtirgichlar)
   - Ko'rinmaydigan, olib qo'yiladigan kapkanlar
   - Har 1-2 haftada almashtiriladi
   - Individual ishlab chiqariladi
   
3. Boshqa qurilmalar
   - Yonak kengaytirgichlari
   - Facemask yoki headgear (yuz kamarlari)
   - Reteynerlar (natijani saqlash uchun)
   - Tishlar orasidagi bo'shliqlarni yopish uchun rezinachalar

Ortodontik davolash 1-3 yil davom etadi, bolalarda tezroq natija beradi. Reteynerlar davolashdan keyin natijani saqlash uchun ishlatiladi.`
    },
    {
      name: 'Prostodontiya',
      description: 'Protezlar, qismlar va implant qo‘llab-quvvatlovchi protezlar.',
      details: `Prostodontiya - yo'qolgan tishlarni va og'iz bo'shlig'idagi to'qimalarni almashtirish bilan shug'ullanadigan stomatologiya sohasi. Maqsad - funksionallik va estetikani tiklash.
      
Protezlar turlari:
1. To'liq protezlar
   - Barcha yo'qolgan tishlarni almashtirish
   - Yuqori va pastki jag' uchun
   - Akril asosida yasalgan
   
2. Qisman protezlar
   - Bir nechta yo'qolgan tishlarni almashtirish
   - Metall yoki plastmassa asos
   - Qolgan tabiiy tishlarga mahkamlanadi
   
3. Implant qo'llab-quvvatlovchi protezlar
   - Dental implantlarga mahkamlangan
   - "All-on-4" yoki "All-on-6" tizimlari
   - Yuqori barqarorlik va qulaylik
   
4. Maxsus protezlar
   - Immediate protezlar (tish olib tashlashdan keyin darhol)
   - Overdenture protezlar (tish ildizlari yoki implantlar ustiga)
   - Moslashuvchan protezlar (yumshoq materiallardan)
   
Parvarish qoidalari:
- Kunlik tozalash maxsus cho'tkalar bilan
- Maxsus eritmalarda saqlash
- Muntazam stomatologik tekshiruvlar
- Protezlar uchun maxsus yopishtiruvchi kremlar (agar kerak bo'lsa)

Prostodontiya bemorlarga ovqatlanish, nutq va tabassum sifatini yaxshilash imkonini beradi.`
    },
    {
      name: 'Bolalar Stomatologiyasi',
      description: 'Bolalar tishlarini parvarish qilish va davolash, profilaktika va ortodontiya.',
      details: `Bolalar stomatologiyasi - bolalar tishlari va og'iz bo'shlig'ining sog'lig'iga ixtisoslashgan soha. Bolalar tishlari nozik bo'lib, maxsus yondashuv talab qiladi.
      
Asosiy xizmatlar:
1. Profilaktik choralar
   - Ftorli laklar - emalni mustahkamlash
   - Fissura sealantlari - tish chuqurchalarini himoya qilish
   - Muntazam tekshiruvlar (6 oydan boshlab)
   
2. Davolash
   - Kariesni davolash - bolalar uchun xavfsiz plombalar
   - Pulpotomiya - sut tishlarining ildiz kanali davolash
   - Tish olib tashlash - zarur hollarda
   
3. Ortodontiya
   - Erta ortodontik davolash (6-12 yosh)
   - Yonak kengaytirgichlari - jag' rivojlanishi uchun
   - Alignerlar yoki breketlar
   
4. Od atlarni shakllantirish
   - Tish yuvish odatini o'rgatish
   - Shakarli ovqatlarni cheklash bo'yicha maslahatlar
   - Bolalar uchun maxsus tish pastasi va cho'tkalari

Bolalar stomatologiyasi sog'lom tishlar rivojlanishini ta'minlaydi va kelajakda jiddiy muammolarni oldini oladi.`
    },
    {
      name: 'Lazer Stomatologiyasi',
      description: 'Lazer yordamida tish va mushak kasalliklarini davolash.',
      details: `Lazer stomatologiyasi - zamonaviy texnologiyalardan foydalangan holda og'iz bo'shlig'i kasalliklarini davolash usuli. Bu aniqlik, kam invazivlik va tez tiklanishni ta'minlaydi.
      
Afzalliklari:
- Kam og'riqli, ko'pincha anesteziya talab qilinmaydi
- Tez tiklanish - shish va qon ketish kamayadi
- Yuqori aniqlik - faqat zararlangan to'qimalarga ta'sir qiladi

Xizmatlar:
1. Mushak kasalliklarini davolash
   - Gingivit va periodontitni davolash
   - Mushak cho'ntaklarini tozalash
   - Lazerli skeyling
   
2. Tishlarni oqartirish
   - Lazerli bleaching - tez va samarali
   
3. Jarrohlik protseduralar
   - Yumshoq to'qimalarni kesish (lab yoki til bog'ini tuzatish)
   - Kistalarni olib tashlash
   - Tish ildizi yallig'lanishlarini davolash
   
4. Kariyesni davolash
   - Lazer yordamida kariesni aniqlash va olib tashlash
   - Emalni mustahkamlash

Lazer stomatologiyasi bemorlar uchun qulay ja xavfsiz yechimdir.`
    },
    {
      name: 'Tish Estetikasi',
      description: 'Tishlarning tashqi ko‘rinishi va tabassumni yaxshilash uchun maxsus protseduralar.',
      details: `Tish estetikasi - tishlarning ko'rinishini yaxshilashga qaratilgan stomatologik xizmatlar to'plami. Estetik va funksional jihatlarni birlashtiradi.
      
Xizmatlar:
1. Tishlarni shakllantirish
   - Konturing - tish chetlarini silliqlash
   - Bo'shliqlarni yopish
   - Tish shaklini tuzatish
   
2. Estetik plombalar
   - Kompozit materiallar bilan tish rangini tabiiylashtirish
   - Shikastlanishlarni yashirish
   
3. Vinirlar va lyuminirlar
   - Ultra nozik keramika qoplamalar
   - Tish rangi, shakli va joylashuvini tuzatish
   - 15-20 yil xizmat qilishi mumkin
   
4. Tish bezaklari
   - Olmos yoki dekorativ qoplamalar
   - Vaqtincha yoki doimiy variantlar
   
5. Raqamli tabassum dizayni (DSD)
   - Kompyuter yordamida tabassum shaklini loyihalash
   - Individual estetik yechimlar

Tish estetikasi bemorlarning o'ziga ishonchini oshiradi va jozibali tabassum yaratadi.`
    },
    {
      name: 'Implantologiya',
      description: 'Yo‘qolgan tishlarni almashtirish uchun dental implantlar o‘rnatish.',
      details: `Implantologiya - yo'qolgan tishlarni doimiy ravishda almashtirish uchun sun'iy tish ildizlarini (implantlarni) o'rnatish bilan shug'ullanadigan stomatologiya sohasi.
      
Implantlarning turlari:
1. Endosteal implantlar
   - Jag' suyagiga o'rnatiladigan titan yoki sirkoniy ildizlar
   - Eng keng tarqalgan tur
   
2. Subperiosteal implantlar
   - Suyak ustiga o'rnatiladi, kam suyakli bemorlar uchun
   - Kamroq ishlatiladi
   
3. Mini-implantlar
   - Vaqtincha protezlar yoki kichik bo'shliqlar uchun
   - Kichikroq o'lcham, tezroq o'rnatish
   
Jarayon:
1. Diagnostika - 3D tomografiya bilan suyak holatini baholash
2. Implant o'rnatish - jarrohlik yo'li bilan
3. Tiklanish davri - suyak bilan integratsiya (3-6 oy)
4. Koronka yoki protez o'rnatish - doimiy yechim

Afzalliklari:
- Tabiiy tishlarga o'xshash ko'rinish va funksiya
- Uzoq muddatli (20 yil va undan ko'proq)
- Qo'shni tishlarga zarar yetkazmaydi

Implantologiya yo'qolgan tishlarni eng zamonaviy usulda tiklash imkonini beradi.`
    },
    {
      name: 'Tish Travmatologiyasi',
      description: 'Tish va og‘iz bo‘shlig‘i shikastlanishlarini davolash.',
      details: `Tish travmatologiyasi - tishlar, mushaklar yoki jag' suyaklarinin shikastlanishlarini davolashga ixtisoslashgan soha. Shikastlanishlar odatda baxtsiz hodisalar, sport jarohatlari yoki tishlash natijasida yuzaga keladi.
      
Shikastlanish turlari:
1. Tish sinishi
   - Emal yoki dentin sinishi
   - Tish ildizi sinishi
   
2. Tishning joyidan siljishi (luxation)
   - Tishning qisman yoki to'liq joyidan chiqishi
   
3. Tishning to'liq yo'qolishi (avulsion)
   - Tishni qayta joylashtirish imkoniyati (agar tez harakat qilinsa)
   
Davolash usullari:
1. Tishni tiklash
   - Kompozit materiallar bilan sinishni tuzatish
   - Koronka o'rnatish
   
2. Tishni qayta joylashtirish
   - Splinting - tishni qo'shni tishlarga mahkamlash
   
3. Ildiz kanali davolash
   - Shikastlangan tishning pulpasi zararlangan bo'lsa
   
4. Jarrohlik aralashuv
   - Jag' suyagi sinishi yoki kistalarni davolash
   
5. Profilaktik choralar
   - Sportchilar uchun og'iz himoyachilari
   - Shikastlanish xavfini kamaytirish bo'yicha maslahatlar

Tish travmatologiyasi tezkor va professional yondashuvni talab qiladi, bu tishni saqlab qolish imkonini oshiradi.`
    },
    {
      name: 'Og‘iz Onkologiyasi',
      description: 'Og‘iz bo‘shlig‘i saratoni va oldingi saraton holatlarini aniqlash va davolash.',
      details: `Og'iz onkologiyasi - og'iz bo'shlig'i, lablar, til, qizilo'ngach va boshqa yumshoq to'qimalardagi saraton va oldingi saraton holatlarini aniqlash va davolash bilan shug'ullanadi.
      
Asosiy alomatlar:
- Og'izda o'chmaydigan yaralar yoki oq/qizil dog'lar
- Doimiy og'riq yoki noqulaylik
- Yutish yoki chaynashda qiyinchilik
- Bo'yin yoki jag'dagi shishlar

Diagnostika:
1. Biopsiya - shubhali to'qimalarni tekshirish
2. Tasvirlash - rentgen, KT, MRT
3. Skrining - muntazam tekshiruvlar orqali erta aniqlash

Davolash usullari:
1. Jarrohlik aralashuv
   - Saraton to'qimalarini olib tashlash
   - Yumshoq yoki qattiq to'qimalarni qayta tiklash
   
2. Radioterapiya
   - Saraton hujayralarini yo'q qilish uchun nurlanish
   
3. Kimyoterapiya
   - Saraton tarqalgan hollarda qo'llaniladi
   
4. Qo'llab-quvvatlovchi davolash
   - Og'iz gigienasi bo'yicha maslahatlar
   - Tiklanish davrida parvarish

Og'iz onkologiyasida erta aniqlash va davolash muvaffaqiyat darajasini sezilarli darajada oshiradi.`
    },
    {
      name: 'Tish va Jag‘ Ortopediyasi',
      description: 'Jag‘ va tishlarning tuzilishidagi anomaliyalarni tuzatish.',
      details: `Tish va jag' ortopediyasi - jag' suyaklari va tishlarning tuzilishidagi anomaliyalarni tuzatish bilan shug'ullanadigan soha. Ko'pincha ortodontiya va og'iz jarrohligi bilan hamkorlikda ishlaydi.
      
Asosiy muammolar:
1. Jag'ning noto'g'ri rivojlanishi
   - Yuqori yoki pastki jag'ning katta yoki kichikligi
   - Asimmetriya
   
2. Tishlash anomaliyalari
   - Ochiq tishlash
   - Chuqur tishlash
   - Jag'lar orasidagi nomuvofiqlik
   
Davolash usullari:
1. Ortopedik qurilmalar
   - Yonak kengaytirgichlari
   - Facemask yoki headgear
   
2. Jarrohlik aralashuv
   - Osteotomiya - jag' suyaklarini qayta shakllantirish
   - Suyak greftlari
   
3. Ortodontik davolash bilan integratsiya
   - Breketlar yoki alignerlar bilan tish joylashuvini tuzatish
   
4. Reabilitatsiya
   - Nutq va chaynash funksiyalarini tiklash
   - Estetik ko'rinishni yaxshilash

Tish va jag' ortopediyasi bemorlarning yuz simmetriyasini va funksionalligini tiklashga yordam beradi.`
    }
  ];    

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const newMessages = [...chatMessages, { type: 'user', text: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    // Simulyatsiya qilingan AI javobi
    setTimeout(() => {
      let aiResponse = "";
      
      // Savolni tahlil qilish va mos javob berish
      if (chatInput.toLowerCase().includes('ogriq') || chatInput.toLowerCase().includes('ogʻriq')) {
        aiResponse = "Tish og'rig'i turli sabablarga ko'ra paydo bo'lishi mumkin: kariyes, mushak yallig'lanishi, tish ildizi abssessi yoki boshqa muammolar. Vaqtincha yengillashtirish uchun: \n1. Iliq tuzli suv bilan og'iz chayish \n2. Muz qo'llash (tashqaridan) \n3. Dorixonadan sotiladigan og'riq qoldiruvchi dori (ibuprofen yoki paratsetamol asosida) \n4. Chinni yoki sarmisqoq qo'llash (vaqtincha) \n\nAmmo tez orada tish shifokoriga ko'rinishingizni tavsiya qilaman.";
      } else if (chatInput.toLowerCase().includes('kariyes') || chatInput.toLowerCase().includes('churuk')) {
        aiResponse = "Kariyes - bu tish emalining bakteriyalar tomonidan shikastlanishi. Oldini olish uchun: \n1. Kuniga 2 marta tishlarni yuvish \n2. Tish ipidan foydalanish \n3. Shakarli ovqatlarni cheklash \n4. Muntazam stomatologik tekshiruvlar \n\nAgar kariyes allaqachon paydo bo'lgan bo'lsa, plomba qo'yish kerak bo'ladi. Kechiktirmaslik kerak, chunki kariyes chuqurlashib, ildiz kanali davolashga olib kelishi mumkin.";
      } else if (chatInput.toLowerCase().includes('oqartirish') || chatInput.toLowerCase().includes('oppoq')) {
        aiResponse = "Tishlarni oqartirishning bir necha usullari mavjud: \n1. Professional oqartirish (shifokor tomonidan) - eng samarali va xavfsiz \n2. Uyda oqartirish (shifokor tomonidan tayyorlangan individual kapkanlar) \n3. Oqartirish tayyorlari (dorixonada sotiladi, kamroq samarali) \n\nOqartirishdan oldin tishlarning sog'omligini tekshirish kerak. Ba'zi hollarda (mushak kasalliklari, emalning nozikligi) oqartirish tavsiya etilmaydi.";
      } else if (chatInput.toLowerCase().includes('bolalar') || chatInput.toLowerCase().includes('bola')) {
        aiResponse = "Bolalar tish sog'ligi alohida e'tiborga muhtoj: \n1. Birinchi tish paydo bo'lishidan boshlab parvarish qilish kerak \n2. Maxsus bolalar tish pastasi va cho'tkasidan foydalanish \n3. 1 yoshidan boshlab tish shifokoriga ko'rinish \n4. Fissura sealantlari (6 yoshdan boshlab) \n5. Ftorli laklar \n6. Shakarli ovqatlar va ichimliklarni cheklash \n\nBolalarga ertaroq tishlarni parvarish qilish odatini o'rgatish muhim.";
      } else {
        aiResponse = "Tish sog'ligi haqida savolingiz uchun tashakkur! Sizga qanday yordam bera olaman? Quyidagi mavzularda ma'lumot bera olaman: \n- Tish og'rig'i \n- Kariyes va uning oldini olish \n- Tishlarni oqartirish \n- Bolalar tish sog'ligi \n- Tishlarni to'g'ri yuvish usullari \n- Implantlar va protezlar \n\nAniqroq savol bersangiz, yaxshiroq yordam bera olaman.";
      }

      setChatMessages([...newMessages, { type: 'ai', text: aiResponse }]);
      setChatLoading(false);
    }, 1500);
  };

  return (
    <div className="dental-assistance">
      <div className="page-header">
        <h1>Tish Davolashda Yordam</h1>
        <p>Tish va og'iz sog'lig'i bo'yicha batafsil ma'lumotlar va sun'iy intellekt yordamchisi</p>
      </div>

      <div className="sections">
        <h2>Bo'limlar</h2>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Bo'lim nomi yoki ta'rifi bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-list">
          {filteredCategories.map((cat, index) => (
            <div
              key={index}
              className={`category-card ${selectedCategory?.name === cat.name ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <FiHelpCircle className="category-icon" />
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
          ))}
        </div>

        {selectedCategory && (
          <div className="category-details" ref={detailsRef}>
            <div className="details-header">
              <h3>{selectedCategory.name}</h3>
              <button onClick={() => setSelectedCategory(null)} className="back-button">
                <FiArrowLeft /> Orqaga
              </button>
            </div>
            <div className="details-content">
              <p>{selectedCategory.details}</p>
            </div>
          </div>
        )}
      </div>

      <div className={`chat-section ${showChat ? 'expanded' : ''}`}>
        <div className="chat-header" onClick={() => setShowChat(!showChat)}>
          <h2>
            <FiMessageSquare /> Sun'iy Intellekt Yordamchisi
          </h2>
          <span className="toggle-chat">{showChat ? 'Yopish' : 'Ochish'}</span>
        </div>
        
        {showChat && (
          <>
            <div className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.length === 0 ? (
                <div className="message ai">
                  Salom! Men tish sog'ligi bo'yicha yordamchi dasturman. Quyidagi mavzularda sizga yordam bera olaman:
                  <ul>
                    <li>Tish og'rig'i va uning sabablari</li>
                    <li>Tishlarni to'g'ri parvarish qilish</li>
                    <li>Kariyesning oldini olish</li>
                    <li>Bolalar tish sog'ligi</li>
                    <li>Tishlarni oqartirish</li>
                    <li>Implantlar va protezlar</li>
                  </ul>
                  Sizga qanday yordam bera olaman?
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div key={index} className={`message ${msg.type}`}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="message ai">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Savolingizni kiriting..."
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              />
              <button onClick={handleChatSend} disabled={chatLoading} className="btn-primary">
                Yuborish
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DentalAssistance;