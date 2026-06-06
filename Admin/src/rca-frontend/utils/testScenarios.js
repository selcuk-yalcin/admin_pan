// Test senaryolarından örnek veriler
export const TEST_SCENARIOS = {
  fall_from_height: {
    id: 'fall_from_height',
    name: {
      tr: 'Yüksekten Düşme',
      en: 'Fall from Height',
      de: 'Sturz aus der Höhe',
      fr: 'Chute de Hauteur',
      es: 'Caída desde Altura',
      ar: 'السقوط من ارتفاع',
    },
    formData: {
      // Reporter Info
      reportedBy: 'Mustafa Çelik - Şantiye Şefi',
      reportDate: '2026-02-18',
      reportTime: '11:00',
      
      // Incident Details
      incidentDate: '2026-02-18',
      incidentTime: '10:35',
      location: 'Yapı İnşaat Şantiyesi - 4. Kat İskele Alanı',
      department: 'İnşaat / İskele Montaj',
      eventCategory: 'incident',
      
      // Description
      incidentDescription: `İskele montaj işçisi Hasan Yıldız (32) yaklaşık 6 metre yükseklikteki iskeleden düşerek zemine çakıldı. İşçi ağır yaralanarak ambulansla hastaneye kaldırıldı.`,
      
      whatHappened: 'İşçi iskele kenarında çalışırken dengesini kaybetti ve 6 metre yükseklikten zemine düştü. Omurga kırığı ve iç kanama tespit edildi.',
      
      whereHappened: '4. Kat iskele alanı, platform kenarı (korkuluksuz taraf)',
      
      whenHappened: '18 Şubat 2026, Saat 10:35, Gündüz vardiyası sırasında',
      
      whoInvolved: 'Hasan Yıldız (32) - İskele Montaj İşçisi, 8 ay deneyim',
      
      emergencyMeasures: 'İlk yardım uygulandı (10:42), 112 arandı (10:37), ambulansla hastaneye sevk (10:55)',
      
      // Safety Equipment
      fallProtection: 'no',
      safetyHarness: 'no',
      safetyTraining: 'partial',
      ppeUsed: 'Baret, iş ayakkabısı',
      
      // Witnesses
      witnessesPresent: 'yes',
      witnessNames: 'Ali Demir (İşçi), Mehmet Kara (Usta)',
      witnessStatements: 'Ali Demir: "Hasan kemersiz çalışıyordu. Herkes öyle yapıyor. Şef acele ediyor diye korkuluksuz tarafa geçtik."\nMehmet Kara: "Korkuluk yarın takılacaktı. Bugün platform montajı bitmeliydi."',
      
      // Environment
      weatherConditions: 'Açık, rüzgarlı',
      lightingConditions: 'İyi (gündüz)',
      noiseLevel: 'Normal',
      temperature: '15°C',
      
      // Work Conditions
      workType: 'İskele platform montajı',
      workHeight: '6 metre',
      experienceLevel: '8 ay',
      shiftTime: 'Gündüz (08:00-17:00)',
      workDuration: '2.5 saat (vardiya başından itibaren)',
      
      // Injuries
      injuryType: 'Düşme, darbe',
      injurySeverity: 'severe',
      bodyPart: 'L2 omurga, pelvis, dalak',
      medicalTreatment: 'Yoğun bakım, ameliyat (omurga stabilizasyonu)',
      propertyDamage: 'Yok',
      
      // Root Cause
      rootCauseInitial: `1. Emniyet kemeri takılmamış (prosedür ihlali)
2. Korkuluk montajı tamamlanmadan çalışma başlatılmış
3. İş izni sistemi eksik (risk değerlendirmesi yetersiz)
4. Üretim baskısı (proje gecikmiş, hızlı bitirme talimatı)
5. Güvenlik denetimi yetersiz`,
      
      correctiveActions: `1. Tüm yüksekte çalışmalarda emniyet kemeri zorunlu kontrolü
2. İskele montajında aşama aşama onay sistemi (korkuluk önce)
3. İş izin sistemi güncelleme (yüksekte çalışma risk değerlendirmesi)
4. Güvenlik brifinglərinin günlük yapılması
5. Proje takviminin güvenlik odaklı revize edilmesi`,
      
      additionalNotes: 'Proje 3 hafta gecikmeli. Güvenlik toplantıları 2 aydır yapılmıyor. Risk değerlendirmesi 6 ay önce güncellenmemiş.',
    },
  },
  
  electrical_shock: {
    id: 'electrical_shock',
    name: {
      tr: 'Elektrik Çarpması',
      en: 'Electrical Shock',
      de: 'Elektrischer Schlag',
      fr: 'Choc Électrique',
      es: 'Descarga Eléctrica',
      ar: 'صدمة كهربائية',
    },
    formData: {
      // Reporter Info
      reportedBy: 'İbrahim Aydın - Elektrik Bakım Sorumlusu',
      reportDate: '2026-02-20',
      reportTime: '16:00',
      
      // Incident Details
      incidentDate: '2026-02-20',
      incidentTime: '15:20',
      location: 'Üretim Tesisi - Ana Elektrik Panosu (MDB-02)',
      department: 'Bakım / Elektrik',
      eventCategory: 'incident',
      
      // Description
      incidentDescription: `Bakım teknisyeni Kemal Arslan (29) elektrik panosunda arıza giderme çalışması yaparken 380V yüksek voltaj akımına kapıldı. LOTO prosedürü uygulanmadan enerjili sistemde çalışıldı.`,
      
      whatHappened: 'Teknisyen elektrik panosuna enerjili halde müdahale etti, şalter bağlantısına dokunurken 380V akıma kapıldı. Kardiyak arrest yaşadı.',
      
      whereHappened: 'Ana elektrik panosu (MDB-02), üretim tesisi zemin kat',
      
      whenHappened: '20 Şubat 2026, Saat 15:20, Gündüz vardiyası',
      
      whoInvolved: 'Kemal Arslan (29) - Elektrik Bakım Teknisyeni, 4 yıl deneyim',
      
      emergencyMeasures: 'Ana şalter kapatıldı (15:21), CPR uygulandı, defibrilasyon (15:35), hastaneye sevk (15:50)',
      
      // Safety Equipment
      fallProtection: 'unknown',
      safetyHarness: 'unknown',
      safetyTraining: 'yes',
      ppeUsed: 'Baret (yetersiz - yalıtımlı eldiven, ayakkabı YOK)',
      
      // Witnesses
      witnessesPresent: 'yes',
      witnessNames: 'Ali Yılmaz (Teknisyen), Bakım Sorumlusu',
      witnessStatements: 'Ali Yılmaz: "Kemal acele ediyordu. Üretim duracak diye enerjiyi kesmedi. Hep böyle yapıyoruz."\nÜretim Müdürü: "Elektrik kesilirse 2 saat üretim kaybı olur."',
      
      // Environment
      weatherConditions: 'İç mekan',
      lightingConditions: 'İyi',
      noiseLevel: 'Yüksek (üretim sesleri)',
      temperature: '22°C',
      
      // Work Conditions
      workType: 'Elektrik panosu arıza giderme',
      workHeight: 'Zemin seviyesi',
      experienceLevel: '4 yıl',
      shiftTime: 'Gündüz (08:00-17:00)',
      workDuration: '50 dakika (arıza bildirimi sonrası)',
      
      // Injuries
      injuryType: 'Elektrik çarpması, kardiyak arrest',
      injurySeverity: 'severe',
      bodyPart: 'Sağ el, kol, kalp',
      medicalTreatment: 'Yoğun bakım 2 gün, defibrilasyon, yanık tedavisi',
      propertyDamage: 'Pano şalteri hasarlı',
      
      // Root Cause
      rootCauseInitial: `1. LOTO (Lockout/Tagout) prosedürü uygulanmadı
2. Üretim baskısı - "duruş olmasın" kültürü
3. Risk normalleşmesi - "hızlıca hallederiz" anlayışı
4. Gözetim eksikliği - tek kişi çalışması
5. LOTO eğitimi yetersiz (2 yıl önce, tekrar yok)
6. İş izin sistemi elektrik işleri için zorunlu değil`,
      
      correctiveActions: `1. LOTO prosedürü tüm elektrik işlerinde zorunlu hale getirildi
2. Elektrik işleri için çift kişi zorunluluğu
3. İş izin sistemi başlatıldı (elektrik işleri)
4. LOTO eğitimi tüm teknisyenlere verildi
5. Üretim vs güvenlik politikası revize edildi
6. Düzenli LOTO uygunluk denetimi`,
      
      additionalNotes: 'Üretim hedefi baskısı mevcut. LOTO prosedürü kağıt üzerinde var ancak pratikte uygulanmıyor. "Gereksiz zaman kaybı" algısı dominant.',
    },
  },
  
  machine_entrapment: {
    id: 'machine_entrapment',
    name: {
      tr: 'Makine Sıkışması',
      en: 'Machine Entrapment',
      de: 'Maschinenklemmung',
      fr: 'Coincement Machine',
      es: 'Atrapamiento de Máquina',
      ar: 'احتجاز الآلة',
    },
    formData: {
      // Reporter Info
      reportedBy: 'Ayşe Demir - Hat Şefi',
      reportDate: '2026-02-22',
      reportTime: '11:45',
      
      // Incident Details
      incidentDate: '2026-02-22',
      incidentTime: '11:15',
      location: 'Ambalaj Hattı 3 - Konveyör Bandı Sistemi',
      department: 'Üretim / Ambalaj',
      eventCategory: 'incident',
      
      // Description
      incidentDescription: `Konveyör bandı operatörü Fatma Yıldız (27) bantda takılan ürünü temizlerken sağ elini konveyör ruloları arasına soktu. Makine çalışır durumdayken müdahale edildi, acil durdurma butonu kullanılmadı.`,
      
      whatHappened: 'Operatör çalışan konveyör bandına elle müdahale etti, eli rulo ile bant arasında sıkıştı. Üç parmak kırıldı ve ezildi.',
      
      whereHappened: 'Ambalaj hattı 3, konveyör bandı sistemi',
      
      whenHappened: '22 Şubat 2026, Saat 11:15, Gündüz vardiyası',
      
      whoInvolved: 'Fatma Yıldız (27) - Konveyör Bandı Operatörü, 14 ay deneyim',
      
      emergencyMeasures: 'Acil durdurma butonu basıldı (11:17), el çıkarıldı, ilk yardım (11:20), 112 arandı (11:25), hastaneye sevk (11:40)',
      
      // Safety Equipment
      fallProtection: 'unknown',
      safetyHarness: 'unknown',
      safetyTraining: 'partial',
      ppeUsed: 'İş eldiveni (ancak koruyucu değil)',
      
      // Witnesses
      witnessesPresent: 'yes',
      witnessNames: 'Elif Kaya (Operatör), Bakım Teknisyeni',
      witnessStatements: 'Elif Kaya: "Fatma hep öyle yapıyordu. Hepimiz yapıyoruz. Bandı durdurup tekrar başlatmak 5 dakika sürer. Şef acele ediyor."\nHat Şefi: "Sıkışma çok sık oluyor. Operatörler hızlıca çözüyor."',
      
      // Environment
      weatherConditions: 'İç mekan',
      lightingConditions: 'İyi',
      noiseLevel: 'Yüksek (makine gürültüsü)',
      temperature: '20°C',
      
      // Work Conditions
      workType: 'Konveyör bandı operasyonu',
      workHeight: 'Zemin seviyesi',
      experienceLevel: '14 ay',
      shiftTime: 'Gündüz (07:00-16:00)',
      workDuration: '4.25 saat (vardiya başından itibaren)',
      
      // Injuries
      injuryType: 'Ezilme, kırık (3 parmak)',
      injurySeverity: 'moderate',
      bodyPart: 'Sağ el: işaret, orta, yüzük parmağı',
      medicalTreatment: 'Acil cerrahi, fonksiyon kaybı riski var, 4 ay iş göremezlik',
      propertyDamage: 'Konveyör bandı hasarlı',
      
      // Root Cause
      rootCauseInitial: `1. Makine çalışır durumdayken elle müdahale
2. Koruyucu kapak/sensör sistemi yok
3. Üretim baskısı - "durdurmayalım" kültürü
4. Sık sıkışma sorunu (kronik) - normalleşmiş risk
5. Acil durdurma butonlarının konumu uygunsuz
6. İşbaşı eğitimi yetersiz (makine güvenliği detay yok)`,
      
      correctiveActions: `1. Konveyör bandına koruyucu kapak montajı
2. İki el kumanda sistemi kurulumu
3. "Makineyi durdur önce müdahale et" prosedürü zorunlu
4. Sıkışma kök nedeninin çözümü (bakım/ayar)
5. Acil durdurma butonları yeniden konumlandırıldı
6. Detaylı makine güvenliği eğitimi verildi`,
      
      additionalNotes: 'Benzer olaylar önceden de yaşanmış (6 ay önce, 1 yıl önce). Kronik sıkışma sorunu var. Üretim hedefi günlük 5000 ünite. Verimlilik öncelikli kültür.',
    },
  },
  
  excavation_collapse: {
    id: 'excavation_collapse',
    name: {
      tr: 'Kazı Göçüğü',
      en: 'Excavation Collapse',
      de: 'Erdrutsch',
      fr: 'Effondrement d\'Excavation',
      es: 'Colapso de Excavación',
      ar: 'انهيار حفرة',
    },
    formData: {
      // Reporter Info
      reportedBy: 'Serkan Aydın - Saha İSG Uzmanı',
      reportDate: '2026-03-08',
      reportTime: '18:10',
      
      // Incident Details
      incidentDate: '2026-03-08',
      incidentTime: '15:40',
      location: 'Kuzey Otoyolu Genişletme Projesi, Lot-7, PK 42+800',
      department: 'Altyapı / Kazı ve Boru Hattı',
      eventCategory: 'incident',
      
      // Description
      incidentDescription: `HDPE boru kaynakçısı Emre Polat (46), yağmur sonrası kazı hattında boru hizalama yaparken şev yüzeyinde ani toprak kayması meydana geldi. Çalışan yaklaşık 4 dakika göçük altında kaldı; ekip tarafından kurtarıldı.`,
      
      whatHappened: 'Öğleden sonra yağıştan sonra kazı kenarında çatlak oluştu. Çalışan uyarıya rağmen kısa sürede göçük altında kaldı; ekip manuel kazı ile çıkardı.',
      
      whereHappened: 'PK 42+800 mevkii, drenaj hattı kazı alanı, yaklaşık 2,4 m derinlik',
      
      whenHappened: '8 Mart 2026, Saat 15:40, Yağış sonrası yeniden başlatılan çalışma',
      
      whoInvolved: 'Emre Polat (46) - HDPE Boru Kaynakçısı, 3 yıl deneyim',
      
      emergencyMeasures: 'Saha ekibi kurtarma (15:40-15:44), 112 arandı, şantiye ambulansı ile sevk (16:05), bilinç açık',
      
      // Safety Equipment
      fallProtection: 'no',
      safetyHarness: 'no',
      safetyTraining: 'yes',
      ppeUsed: 'Baret, iş eldiveni, çelik burunlu iş ayakkabısı',
      
      // Witnesses
      witnessesPresent: 'yes',
      witnessNames: 'Burak Şen (kazı ekibi), Oğuz Yılmaz (ekskavatör operatörü)',
      witnessStatements: 'Burak Şen: "Şevde hareket gördüm, bağırarak uyardım ama çok hızlı oldu."\nOğuz Yılmaz: "Yağış nedeniyle çalışma durdurulmuştu; kısa süreli devam kararı alındı."',
      
      // Environment
      weatherConditions: 'Yağışlı (13:20-14:10 orta şiddetli yağmur)',
      lightingConditions: 'Zayıf (gün batımına yakın)',
      noiseLevel: 'Normal',
      temperature: '11°C',
      
      // Work Conditions
      workType: 'Ø500 mm beton drenaj borusu montajı ve dolgu',
      workHeight: 'Kazı derinliği ~2,4 m',
      experienceLevel: '3 yıl',
      shiftTime: 'Gündüz (07:30-16:30)',
      workDuration: 'Onay dışı yeniden başlatma (~6 dakika)',
      
      // Injuries
      injuryType: 'Ezilme, göçük altında kalma',
      injurySeverity: 'moderate',
      bodyPart: 'Gövde ve alt ekstremite (genel ezilme)',
      medicalTreatment: 'Bölge hastanesine sevk, görüntüleme ve gözlem',
      propertyDamage: 'Kazı şevi çökmüş, boru segmenti hasarlı',
      
      // Root Cause
      rootCauseInitial: `1. Yağış sonrası kazı stabilitesi kontrol edilmeden çalışmaya devam edildi
2. Durdurulan iş onay alınmadan yeniden başlatıldı
3. Kazı şev açısı ve geçici destekleme yetersizdi
4. Günlük saha brifingi kazı risklerine odaklanmadı
5. Göçük acil durum tatbikatı bilgisi sahada uygulanmadı`,
      
      correctiveActions: `1. Yağış sonrası kazı güvenlik kontrolü zorunlu hale getirildi
2. İş izni olmadan kazıya giriş engellendi
3. Kazı şev açıları ve destekleme planı revize edildi
4. Geçici şev stabilizasyonu güçlendirildi
5. Kazı tehlikeleri eğitimi işe özel güncellendi
6. Günlük toolbox konuları saha işleriyle eşleştirildi`,
      
      additionalNotes: 'Temel iş güvenliği sertifikası güncel. Son 12 ayda 28 toolbox ve 6 interaktif eğitim kaydı var. Göçük tatbikatı 6 ay önce yapıldı; sahada uygulama eksikliği tespit edildi.',
    },
  },
};

// Tüm test senaryolarından ortak form şablonu çıkar
export const getCommonFormTemplate = () => {
  return {
    // Reporter Info (3 fields)
    reporterInfo: [
      { id: 'reportedBy', type: 'text', required: true },
      { id: 'reportDate', type: 'date', required: true },
      { id: 'reportTime', type: 'time', required: true },
    ],
    
    // Incident Details (5 fields)
    incidentDetails: [
      { id: 'incidentDate', type: 'date', required: true },
      { id: 'incidentTime', type: 'time', required: true },
      { id: 'location', type: 'text', required: true },
      { id: 'department', type: 'text', required: false },
      { id: 'eventCategory', type: 'select', required: true, options: ['incident', 'near_miss', 'unsafe_condition', 'property_damage'] },
    ],
    
    // Description (6 fields)
    description: [
      { id: 'incidentDescription', type: 'textarea', required: true, rows: 6 },
      { id: 'whatHappened', type: 'textarea', required: false, rows: 3 },
      { id: 'whereHappened', type: 'textarea', required: false, rows: 3 },
      { id: 'whenHappened', type: 'textarea', required: false, rows: 3 },
      { id: 'whoInvolved', type: 'textarea', required: false, rows: 3 },
      { id: 'emergencyMeasures', type: 'textarea', required: false, rows: 3 },
    ],
    
    // Safety Equipment (4 fields)
    safetyEquipment: [
      { id: 'fallProtection', type: 'select', required: false, options: ['yes', 'no', 'unknown'] },
      { id: 'safetyHarness', type: 'select', required: false, options: ['yes', 'no', 'unknown'] },
      { id: 'safetyTraining', type: 'select', required: false, options: ['yes', 'no', 'unknown', 'partial'] },
      { id: 'ppeUsed', type: 'text', required: false },
    ],
    
    // Witnesses (3 fields)
    witnesses: [
      { id: 'witnessesPresent', type: 'select', required: false, options: ['yes', 'no', 'unknown'] },
      { id: 'witnessNames', type: 'textarea', required: false, rows: 2 },
      { id: 'witnessStatements', type: 'textarea', required: false, rows: 4 },
    ],
    
    // Environment (4 fields)
    environment: [
      { id: 'weatherConditions', type: 'text', required: false },
      { id: 'lightingConditions', type: 'text', required: false },
      { id: 'noiseLevel', type: 'text', required: false },
      { id: 'temperature', type: 'text', required: false },
    ],
    
    // Work Conditions (5 fields)
    workConditions: [
      { id: 'workType', type: 'text', required: false },
      { id: 'workHeight', type: 'text', required: false },
      { id: 'experienceLevel', type: 'text', required: false },
      { id: 'shiftTime', type: 'text', required: false },
      { id: 'workDuration', type: 'text', required: false },
    ],
    
    // Injuries (5 fields)
    injuries: [
      { id: 'injuryType', type: 'text', required: false },
      { id: 'injurySeverity', type: 'select', required: false, options: ['minor', 'moderate', 'severe', 'fatal'] },
      { id: 'bodyPart', type: 'text', required: false },
      { id: 'medicalTreatment', type: 'text', required: false },
      { id: 'propertyDamage', type: 'text', required: false },
    ],
    
    // Root Cause (3 fields)
    rootCause: [
      { id: 'rootCauseInitial', type: 'textarea', required: false, rows: 4 },
      { id: 'correctiveActions', type: 'textarea', required: false, rows: 4 },
      { id: 'additionalNotes', type: 'textarea', required: false, rows: 3 },
    ],
  };
};

// Test senaryosu seç ve formu doldur
export const loadTestScenario = (scenarioId) => {
  const scenario = TEST_SCENARIOS[scenarioId];
  if (!scenario) {
    console.error(`Test scenario not found: ${scenarioId}`);
    return null;
  }
  return scenario.formData;
};

// Tüm test senaryolarının listesi
export const getTestScenarioList = (language = 'tr') => {
  return Object.keys(TEST_SCENARIOS).map(id => ({
    id,
    name: TEST_SCENARIOS[id].name[language] || TEST_SCENARIOS[id].name.tr,
  }));
};

export default TEST_SCENARIOS;
