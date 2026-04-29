import { useAtom } from 'jotai';
import { languageAtom } from '@/store';
import styles from './index.module.css';
import { useTranslation } from 'react-i18next';

interface RestrictedCountry {
  names: {
    ru: string;
    en: string;
    zh: string;
  };
  languageGroup: string[]; // языки, при которых страна подсвечивается
}

const restrictedCountries: RestrictedCountry[] = [
  { names: { ru: 'Алжир', en: 'Algeria', zh: '阿尔及利亚' }, languageGroup: ['en'] },
  { names: { ru: 'Бангладеш', en: 'Bangladesh', zh: '孟加拉国' }, languageGroup: ['en'] },
  { names: { ru: 'Боливия', en: 'Bolivia', zh: '玻利维亚' }, languageGroup: ['en'] },
  { names: { ru: 'Китай', en: 'China', zh: '中国' }, languageGroup: ['zh'] },
  { names: { ru: 'Египет', en: 'Egypt', zh: '埃及' }, languageGroup: ['en'] },
  { names: { ru: 'Индонезия', en: 'Indonesia', zh: '印度尼西亚' }, languageGroup: ['en'] },
  { names: { ru: 'Ирак', en: 'Iraq', zh: '伊拉克' }, languageGroup: ['en'] },
  { names: { ru: 'Марокко', en: 'Morocco', zh: '摩洛哥' }, languageGroup: ['en'] },
  { names: { ru: 'Непал', en: 'Nepal', zh: '尼泊尔' }, languageGroup: ['en'] },
  { names: { ru: 'Катар', en: 'Qatar', zh: '卡塔尔' }, languageGroup: ['en'] },
  { names: { ru: 'Саудовская Аравия', en: 'Saudi Arabia', zh: '沙特阿拉伯' }, languageGroup: ['en'] },
  { names: { ru: 'Тунис', en: 'Tunisia', zh: '突尼斯' }, languageGroup: ['en'] },
  { names: { ru: 'Турция', en: 'Turkey', zh: '土耳其' }, languageGroup: ['en'] },
  { names: { ru: 'Вьетнам', en: 'Vietnam', zh: '越南' }, languageGroup: ['en'] },
  { names: { ru: 'Нигерия', en: 'Nigeria', zh: '尼日利亚' }, languageGroup: ['en'] },
  { names: { ru: 'Колумбия', en: 'Colombia', zh: '哥伦比亚' }, languageGroup: ['en'] },
  { names: { ru: 'Доминиканская Республика', en: 'Dominican Republic', zh: '多米尼加共和国' }, languageGroup: ['en'] },
  { names: { ru: 'Гана', en: 'Ghana', zh: '加纳' }, languageGroup: ['en'] },
  { names: { ru: 'Лесото', en: 'Lesotho', zh: '莱索托' }, languageGroup: ['en'] },
  { names: { ru: 'Ливан', en: 'Lebanon', zh: '黎巴嫩' }, languageGroup: ['en'] },
  { names: { ru: 'Северная Македония', en: 'North Macedonia', zh: '北马其顿' }, languageGroup: ['en'] },
  { names: { ru: 'Самоа', en: 'Samoa', zh: '萨摩亚' }, languageGroup: ['en'] },
  { names: { ru: 'Шри-Ланка', en: 'Sri Lanka', zh: '斯里兰卡' }, languageGroup: ['en'] },
  { names: { ru: 'Россия', en: 'Russia', zh: '俄罗斯' }, languageGroup: ['ru'] }
];

export default function CryptoRestrictions() {
  const { t } = useTranslation()
  const [lang] = useAtom(languageAtom);

  const getCountryName = (country: RestrictedCountry) => {
    return country.names[lang as keyof typeof country.names] || country.names.en;
  };

  const shouldHighlight = (country: RestrictedCountry) => {
    return country.languageGroup.includes(lang);
  };

  return (
    <div className={styles.container}>
      <blockquote className={styles.quoteBlock}>
        <div className={styles.quoteIcon}>“</div>
        <div className={styles.quoteContent}>
          <p className={styles.quoteText}>{t("cryptoRestrictions")}</p>

          <div className={styles.countriesList}>
            {restrictedCountries.map((country) => (
              <div
                key={country.names.en}
                className={`${styles.countryItem} ${shouldHighlight(country) ? styles.highlighted : ''}`}
              >
                <span className={styles.countryName}>
                  {getCountryName(country)}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.quoteFooter}>{t("infoCurrent", { year: 2026 })}</p>
        </div>
      </blockquote>
    </div>
  );
}