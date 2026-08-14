// src/data/pays-iso.ts
//
// Liste ISO 3166-1 alpha-2 pour le CountrySelect (US-B6) — les 54 pays
// d'Afrique (le perimetre naturel de FinZuu), nom FR/EN + indicatif.
// Demande explicite de Yaniv : une liste deroulante ISO, jamais un champ
// texte libre. Le formulaire pre-remplit name_fr/name_en/dial_code depuis
// cette liste ; tout reste editable avant envoi.

export interface PaysIso {
  iso: string
  nameFr: string
  nameEn: string
  dial: string
}

export const PAYS_AFRIQUE: PaysIso[] = [
  { iso: 'DZ', nameFr: 'Algérie', nameEn: 'Algeria', dial: '213' },
  { iso: 'AO', nameFr: 'Angola', nameEn: 'Angola', dial: '244' },
  { iso: 'BJ', nameFr: 'Bénin', nameEn: 'Benin', dial: '229' },
  { iso: 'BW', nameFr: 'Botswana', nameEn: 'Botswana', dial: '267' },
  { iso: 'BF', nameFr: 'Burkina Faso', nameEn: 'Burkina Faso', dial: '226' },
  { iso: 'BI', nameFr: 'Burundi', nameEn: 'Burundi', dial: '257' },
  { iso: 'CV', nameFr: 'Cap-Vert', nameEn: 'Cabo Verde', dial: '238' },
  { iso: 'CM', nameFr: 'Cameroun', nameEn: 'Cameroon', dial: '237' },
  { iso: 'CF', nameFr: 'République centrafricaine', nameEn: 'Central African Republic', dial: '236' },
  { iso: 'TD', nameFr: 'Tchad', nameEn: 'Chad', dial: '235' },
  { iso: 'KM', nameFr: 'Comores', nameEn: 'Comoros', dial: '269' },
  { iso: 'CG', nameFr: 'Congo', nameEn: 'Congo', dial: '242' },
  { iso: 'CD', nameFr: 'Congo (RDC)', nameEn: 'DR Congo', dial: '243' },
  { iso: 'CI', nameFr: "Côte d'Ivoire", nameEn: "Côte d'Ivoire", dial: '225' },
  { iso: 'DJ', nameFr: 'Djibouti', nameEn: 'Djibouti', dial: '253' },
  { iso: 'EG', nameFr: 'Égypte', nameEn: 'Egypt', dial: '20' },
  { iso: 'GQ', nameFr: 'Guinée équatoriale', nameEn: 'Equatorial Guinea', dial: '240' },
  { iso: 'ER', nameFr: 'Érythrée', nameEn: 'Eritrea', dial: '291' },
  { iso: 'SZ', nameFr: 'Eswatini', nameEn: 'Eswatini', dial: '268' },
  { iso: 'ET', nameFr: 'Éthiopie', nameEn: 'Ethiopia', dial: '251' },
  { iso: 'GA', nameFr: 'Gabon', nameEn: 'Gabon', dial: '241' },
  { iso: 'GM', nameFr: 'Gambie', nameEn: 'Gambia', dial: '220' },
  { iso: 'GH', nameFr: 'Ghana', nameEn: 'Ghana', dial: '233' },
  { iso: 'GN', nameFr: 'Guinée', nameEn: 'Guinea', dial: '224' },
  { iso: 'GW', nameFr: 'Guinée-Bissau', nameEn: 'Guinea-Bissau', dial: '245' },
  { iso: 'KE', nameFr: 'Kenya', nameEn: 'Kenya', dial: '254' },
  { iso: 'LS', nameFr: 'Lesotho', nameEn: 'Lesotho', dial: '266' },
  { iso: 'LR', nameFr: 'Libéria', nameEn: 'Liberia', dial: '231' },
  { iso: 'LY', nameFr: 'Libye', nameEn: 'Libya', dial: '218' },
  { iso: 'MG', nameFr: 'Madagascar', nameEn: 'Madagascar', dial: '261' },
  { iso: 'MW', nameFr: 'Malawi', nameEn: 'Malawi', dial: '265' },
  { iso: 'ML', nameFr: 'Mali', nameEn: 'Mali', dial: '223' },
  { iso: 'MR', nameFr: 'Mauritanie', nameEn: 'Mauritania', dial: '222' },
  { iso: 'MU', nameFr: 'Maurice', nameEn: 'Mauritius', dial: '230' },
  { iso: 'MA', nameFr: 'Maroc', nameEn: 'Morocco', dial: '212' },
  { iso: 'MZ', nameFr: 'Mozambique', nameEn: 'Mozambique', dial: '258' },
  { iso: 'NA', nameFr: 'Namibie', nameEn: 'Namibia', dial: '264' },
  { iso: 'NE', nameFr: 'Niger', nameEn: 'Niger', dial: '227' },
  { iso: 'NG', nameFr: 'Nigéria', nameEn: 'Nigeria', dial: '234' },
  { iso: 'RW', nameFr: 'Rwanda', nameEn: 'Rwanda', dial: '250' },
  { iso: 'ST', nameFr: 'Sao Tomé-et-Principe', nameEn: 'Sao Tome and Principe', dial: '239' },
  { iso: 'SN', nameFr: 'Sénégal', nameEn: 'Senegal', dial: '221' },
  { iso: 'SC', nameFr: 'Seychelles', nameEn: 'Seychelles', dial: '248' },
  { iso: 'SL', nameFr: 'Sierra Leone', nameEn: 'Sierra Leone', dial: '232' },
  { iso: 'SO', nameFr: 'Somalie', nameEn: 'Somalia', dial: '252' },
  { iso: 'ZA', nameFr: 'Afrique du Sud', nameEn: 'South Africa', dial: '27' },
  { iso: 'SS', nameFr: 'Soudan du Sud', nameEn: 'South Sudan', dial: '211' },
  { iso: 'SD', nameFr: 'Soudan', nameEn: 'Sudan', dial: '249' },
  { iso: 'TZ', nameFr: 'Tanzanie', nameEn: 'Tanzania', dial: '255' },
  { iso: 'TG', nameFr: 'Togo', nameEn: 'Togo', dial: '228' },
  { iso: 'TN', nameFr: 'Tunisie', nameEn: 'Tunisia', dial: '216' },
  { iso: 'UG', nameFr: 'Ouganda', nameEn: 'Uganda', dial: '256' },
  { iso: 'ZM', nameFr: 'Zambie', nameEn: 'Zambia', dial: '260' },
  { iso: 'ZW', nameFr: 'Zimbabwe', nameEn: 'Zimbabwe', dial: '263' },
]
