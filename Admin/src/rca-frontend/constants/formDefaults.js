/** Bildiren — form şablonu; rapor HTML/DOCX içinde düzenlenir. */
export const DEFAULT_REPORTER_NAME = 'Ahmet Yılmaz';

/** Yeni tanık satırında önerilen örnek isimler (CV şablonu tarzı, nötr). */
export const TEMPLATE_WITNESS_NAMES = [
  'Mehmet Yılmaz',
  'Ayşe Demir',
  'Ali Kaya',
  'Fatma Şahin',
  'Mustafa Öztürk',
  'Zeynep Aydın',
  'Hasan Çelik',
];

export function templateWitnessNameForIndex(index) {
  const list = TEMPLATE_WITNESS_NAMES;
  return list[Math.max(0, index) % list.length];
}
