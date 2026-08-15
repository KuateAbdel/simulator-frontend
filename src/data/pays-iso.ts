// src/data/pays-iso.ts
//
// Liste ISO 3166-1 alpha-2 pour le CountrySelect (US-B6) — les pays
// d'Afrique (le perimetre naturel de FinZuu), nom FR/EN + indicatif +
// MONNAIE ISO 4217 (demande Yaniv 15/08 : la devise d'un pays est une
// donnee CONNUE, elle se pre-remplit — tout reste editable avant envoi).
// `deviseDecimales` suit l'ISO 4217 : les francs CFA/GNF/RWF/BIF/KMF/DJF/UGX
// n'ont pas de subdivision.

export interface PaysIso {
  iso: string
  nameFr: string
  nameEn: string
  dial: string
  /** Code ISO 4217 de la monnaie du pays. */
  devise: string
  deviseFr: string
  deviseEn: string
  deviseDecimales: boolean
}

export const PAYS_AFRIQUE: PaysIso[] = [
  { iso: 'DZ', nameFr: 'Algérie', nameEn: 'Algeria', dial: '213', devise: 'DZD', deviseFr: 'Dinar algérien', deviseEn: 'Algerian dinar', deviseDecimales: true },
  { iso: 'AO', nameFr: 'Angola', nameEn: 'Angola', dial: '244', devise: 'AOA', deviseFr: 'Kwanza', deviseEn: 'Kwanza', deviseDecimales: true },
  { iso: 'BJ', nameFr: 'Bénin', nameEn: 'Benin', dial: '229', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'BW', nameFr: 'Botswana', nameEn: 'Botswana', dial: '267', devise: 'BWP', deviseFr: 'Pula', deviseEn: 'Pula', deviseDecimales: true },
  { iso: 'BF', nameFr: 'Burkina Faso', nameEn: 'Burkina Faso', dial: '226', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'BI', nameFr: 'Burundi', nameEn: 'Burundi', dial: '257', devise: 'BIF', deviseFr: 'Franc burundais', deviseEn: 'Burundian franc', deviseDecimales: false },
  { iso: 'CV', nameFr: 'Cap-Vert', nameEn: 'Cabo Verde', dial: '238', devise: 'CVE', deviseFr: 'Escudo cap-verdien', deviseEn: 'Cabo Verde escudo', deviseDecimales: true },
  { iso: 'CM', nameFr: 'Cameroun', nameEn: 'Cameroon', dial: '237', devise: 'XAF', deviseFr: 'Franc CFA (BEAC)', deviseEn: 'CFA franc (BEAC)', deviseDecimales: false },
  { iso: 'CF', nameFr: 'République centrafricaine', nameEn: 'Central African Republic', dial: '236', devise: 'XAF', deviseFr: 'Franc CFA (BEAC)', deviseEn: 'CFA franc (BEAC)', deviseDecimales: false },
  { iso: 'TD', nameFr: 'Tchad', nameEn: 'Chad', dial: '235', devise: 'XAF', deviseFr: 'Franc CFA (BEAC)', deviseEn: 'CFA franc (BEAC)', deviseDecimales: false },
  { iso: 'KM', nameFr: 'Comores', nameEn: 'Comoros', dial: '269', devise: 'KMF', deviseFr: 'Franc comorien', deviseEn: 'Comorian franc', deviseDecimales: false },
  { iso: 'CG', nameFr: 'Congo', nameEn: 'Congo', dial: '242', devise: 'XAF', deviseFr: 'Franc CFA (BEAC)', deviseEn: 'CFA franc (BEAC)', deviseDecimales: false },
  { iso: 'CD', nameFr: 'Congo (RDC)', nameEn: 'DR Congo', dial: '243', devise: 'CDF', deviseFr: 'Franc congolais', deviseEn: 'Congolese franc', deviseDecimales: true },
  { iso: 'CI', nameFr: "Côte d'Ivoire", nameEn: "Côte d'Ivoire", dial: '225', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'DJ', nameFr: 'Djibouti', nameEn: 'Djibouti', dial: '253', devise: 'DJF', deviseFr: 'Franc de Djibouti', deviseEn: 'Djiboutian franc', deviseDecimales: false },
  { iso: 'EG', nameFr: 'Égypte', nameEn: 'Egypt', dial: '20', devise: 'EGP', deviseFr: 'Livre égyptienne', deviseEn: 'Egyptian pound', deviseDecimales: true },
  { iso: 'GQ', nameFr: 'Guinée équatoriale', nameEn: 'Equatorial Guinea', dial: '240', devise: 'XAF', deviseFr: 'Franc CFA (BEAC)', deviseEn: 'CFA franc (BEAC)', deviseDecimales: false },
  { iso: 'ER', nameFr: 'Érythrée', nameEn: 'Eritrea', dial: '291', devise: 'ERN', deviseFr: 'Nakfa', deviseEn: 'Nakfa', deviseDecimales: true },
  { iso: 'SZ', nameFr: 'Eswatini', nameEn: 'Eswatini', dial: '268', devise: 'SZL', deviseFr: 'Lilangeni', deviseEn: 'Lilangeni', deviseDecimales: true },
  { iso: 'ET', nameFr: 'Éthiopie', nameEn: 'Ethiopia', dial: '251', devise: 'ETB', deviseFr: 'Birr', deviseEn: 'Birr', deviseDecimales: true },
  { iso: 'GA', nameFr: 'Gabon', nameEn: 'Gabon', dial: '241', devise: 'XAF', deviseFr: 'Franc CFA (BEAC)', deviseEn: 'CFA franc (BEAC)', deviseDecimales: false },
  { iso: 'GM', nameFr: 'Gambie', nameEn: 'Gambia', dial: '220', devise: 'GMD', deviseFr: 'Dalasi', deviseEn: 'Dalasi', deviseDecimales: true },
  { iso: 'GH', nameFr: 'Ghana', nameEn: 'Ghana', dial: '233', devise: 'GHS', deviseFr: 'Cedi ghanéen', deviseEn: 'Ghanaian cedi', deviseDecimales: true },
  { iso: 'GN', nameFr: 'Guinée', nameEn: 'Guinea', dial: '224', devise: 'GNF', deviseFr: 'Franc guinéen', deviseEn: 'Guinean franc', deviseDecimales: false },
  { iso: 'GW', nameFr: 'Guinée-Bissau', nameEn: 'Guinea-Bissau', dial: '245', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'KE', nameFr: 'Kenya', nameEn: 'Kenya', dial: '254', devise: 'KES', deviseFr: 'Shilling kényan', deviseEn: 'Kenyan shilling', deviseDecimales: true },
  { iso: 'LS', nameFr: 'Lesotho', nameEn: 'Lesotho', dial: '266', devise: 'LSL', deviseFr: 'Loti', deviseEn: 'Loti', deviseDecimales: true },
  { iso: 'LR', nameFr: 'Libéria', nameEn: 'Liberia', dial: '231', devise: 'LRD', deviseFr: 'Dollar libérien', deviseEn: 'Liberian dollar', deviseDecimales: true },
  { iso: 'LY', nameFr: 'Libye', nameEn: 'Libya', dial: '218', devise: 'LYD', deviseFr: 'Dinar libyen', deviseEn: 'Libyan dinar', deviseDecimales: true },
  { iso: 'MG', nameFr: 'Madagascar', nameEn: 'Madagascar', dial: '261', devise: 'MGA', deviseFr: 'Ariary', deviseEn: 'Ariary', deviseDecimales: false },
  { iso: 'MW', nameFr: 'Malawi', nameEn: 'Malawi', dial: '265', devise: 'MWK', deviseFr: 'Kwacha malawien', deviseEn: 'Malawian kwacha', deviseDecimales: true },
  { iso: 'ML', nameFr: 'Mali', nameEn: 'Mali', dial: '223', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'MR', nameFr: 'Mauritanie', nameEn: 'Mauritania', dial: '222', devise: 'MRU', deviseFr: 'Ouguiya', deviseEn: 'Ouguiya', deviseDecimales: true },
  { iso: 'MU', nameFr: 'Maurice', nameEn: 'Mauritius', dial: '230', devise: 'MUR', deviseFr: 'Roupie mauricienne', deviseEn: 'Mauritian rupee', deviseDecimales: true },
  { iso: 'MA', nameFr: 'Maroc', nameEn: 'Morocco', dial: '212', devise: 'MAD', deviseFr: 'Dirham marocain', deviseEn: 'Moroccan dirham', deviseDecimales: true },
  { iso: 'MZ', nameFr: 'Mozambique', nameEn: 'Mozambique', dial: '258', devise: 'MZN', deviseFr: 'Metical', deviseEn: 'Metical', deviseDecimales: true },
  { iso: 'NA', nameFr: 'Namibie', nameEn: 'Namibia', dial: '264', devise: 'NAD', deviseFr: 'Dollar namibien', deviseEn: 'Namibian dollar', deviseDecimales: true },
  { iso: 'NE', nameFr: 'Niger', nameEn: 'Niger', dial: '227', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'NG', nameFr: 'Nigéria', nameEn: 'Nigeria', dial: '234', devise: 'NGN', deviseFr: 'Naira', deviseEn: 'Naira', deviseDecimales: true },
  { iso: 'RW', nameFr: 'Rwanda', nameEn: 'Rwanda', dial: '250', devise: 'RWF', deviseFr: 'Franc rwandais', deviseEn: 'Rwandan franc', deviseDecimales: false },
  { iso: 'ST', nameFr: 'Sao Tomé-et-Principe', nameEn: 'Sao Tome and Principe', dial: '239', devise: 'STN', deviseFr: 'Dobra', deviseEn: 'Dobra', deviseDecimales: true },
  { iso: 'SN', nameFr: 'Sénégal', nameEn: 'Senegal', dial: '221', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'SC', nameFr: 'Seychelles', nameEn: 'Seychelles', dial: '248', devise: 'SCR', deviseFr: 'Roupie seychelloise', deviseEn: 'Seychellois rupee', deviseDecimales: true },
  { iso: 'SL', nameFr: 'Sierra Leone', nameEn: 'Sierra Leone', dial: '232', devise: 'SLE', deviseFr: 'Leone', deviseEn: 'Leone', deviseDecimales: true },
  { iso: 'SO', nameFr: 'Somalie', nameEn: 'Somalia', dial: '252', devise: 'SOS', deviseFr: 'Shilling somalien', deviseEn: 'Somali shilling', deviseDecimales: true },
  { iso: 'ZA', nameFr: 'Afrique du Sud', nameEn: 'South Africa', dial: '27', devise: 'ZAR', deviseFr: 'Rand', deviseEn: 'Rand', deviseDecimales: true },
  { iso: 'SS', nameFr: 'Soudan du Sud', nameEn: 'South Sudan', dial: '211', devise: 'SSP', deviseFr: 'Livre sud-soudanaise', deviseEn: 'South Sudanese pound', deviseDecimales: true },
  { iso: 'SD', nameFr: 'Soudan', nameEn: 'Sudan', dial: '249', devise: 'SDG', deviseFr: 'Livre soudanaise', deviseEn: 'Sudanese pound', deviseDecimales: true },
  { iso: 'TZ', nameFr: 'Tanzanie', nameEn: 'Tanzania', dial: '255', devise: 'TZS', deviseFr: 'Shilling tanzanien', deviseEn: 'Tanzanian shilling', deviseDecimales: true },
  { iso: 'TG', nameFr: 'Togo', nameEn: 'Togo', dial: '228', devise: 'XOF', deviseFr: 'Franc CFA (BCEAO)', deviseEn: 'CFA franc (BCEAO)', deviseDecimales: false },
  { iso: 'TN', nameFr: 'Tunisie', nameEn: 'Tunisia', dial: '216', devise: 'TND', deviseFr: 'Dinar tunisien', deviseEn: 'Tunisian dinar', deviseDecimales: true },
  { iso: 'UG', nameFr: 'Ouganda', nameEn: 'Uganda', dial: '256', devise: 'UGX', deviseFr: 'Shilling ougandais', deviseEn: 'Ugandan shilling', deviseDecimales: false },
  { iso: 'ZM', nameFr: 'Zambie', nameEn: 'Zambia', dial: '260', devise: 'ZMW', deviseFr: 'Kwacha zambien', deviseEn: 'Zambian kwacha', deviseDecimales: true },
  { iso: 'ZW', nameFr: 'Zimbabwe', nameEn: 'Zimbabwe', dial: '263', devise: 'ZWG', deviseFr: 'Zimbabwe Gold', deviseEn: 'Zimbabwe Gold', deviseDecimales: true },
]
