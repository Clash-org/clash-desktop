// components/CreateTournament/index.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, X,
  ArrowLeft,
  ArrowRight,
  CirclePlus,
  Eye
} from 'lucide-react';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Button from '@/components/Button';
import Section from '@/components/Section';
import InputText from '@/components/InputText';
import InputNumber from '@/components/InputNumber';
import Select from '@/components/Select';
import DatePicker from "@/components/DatePiker"
import Switch from '@/components/Switch';
import styles from './index.module.css';
import Checkbox from '../Checkbox';
import ModalWindow from '../ModalWindow';
import { CityType, NominationType, TournamentFormData, WeaponType } from '@/typings';
import { citiesApi, tournamentsApi, uploadsApi, weaponsApi } from '@/utils/api';
import ImageUploader from '@/ImageUploader';
import toast from 'react-hot-toast';
import { useAtomValue } from 'jotai';
import { languageAtom } from '@/store';

export default function CreateTournament() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [cities, setCities] = useState<CityType[]>([]);
  const [weapons, setWeapons] = useState<WeaponType[]>([]);
  const [nominations, setNominations] = useState<NominationType[]>([]);
  const [socialLink, setSocialLink] = useState('');
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [cover, setCover] = useState<FormData>(new FormData())
  const lang = useAtomValue(languageAtom)

  const defaultTournametData: TournamentFormData = {
    title: '',
    description: '',
    date: new Date(),
    cityId: 0,
    image: "",
    weaponsIds: [],
    nominationsIds: [],
    participantsCount: {},
    socialMedias: [],
    isChildlike: false
  }

  const [formData, setFormData] = useState<TournamentFormData>(defaultTournametData);

  useEffect(() => {
    (async ()=>{
        const resCities = await citiesApi.getAll(lang)
        if (resCities)
            setCities(resCities)
        const resNominations = await weaponsApi.getNominationsAll(lang)
        if (resNominations) {
          let weapons: WeaponType[] = []
          resNominations.forEach(nom=>{
            weapons.push(nom.weapon)
          })
          weapons = Array.from(new Map(weapons.map(item => [item.id, item])).values())
          setNominations(resNominations)
          setWeapons(weapons)
        }
    })()
  }, []);

  useEffect(()=>{
    const allWeaponsIds = [...new Set(nominations.map(n=>n.weapon.id))]
    const deleteWeaponsIds = allWeaponsIds.filter(id=>!formData.weaponsIds.includes(id))
    const deleteNominationsIds = nominations.filter(n=>!deleteWeaponsIds.includes(n.weapon.id)).map(n=>n.id)
    const newNominationsIds = formData.nominationsIds.filter(nom=>deleteNominationsIds.includes(nom))
    handleInputChange("nominationsIds", newNominationsIds)
  }, [formData.weaponsIds])

  const handleInputChange = (field: keyof TournamentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSocialLink = () => {
    if (socialLink && !formData.socialMedias.includes(socialLink)) {
      setFormData(prev => ({
        ...prev,
        socialMedias: [...prev.socialMedias, socialLink],
      }));
      setSocialLink('');
    }
  };

  const handleRemoveSocialLink = (link: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedias: prev.socialMedias.filter(l => l !== link),
    }));
  };

  const handleSubmit = async () => {
    await uploadsApi.imageLoad(cover, "covers")
    const data = await tournamentsApi.create(formData)
    if (data) {
      toast.success(t("tournamentCreated"))
      setFormData(defaultTournametData)
      setCover(new FormData)
      setCurrentStep(1)
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.cityId && formData.date;
      case 2:
        return formData.weaponsIds.length > 0 && formData.nominationsIds.length > 0;
      default:
        return true;
    }
  };

  const cityOptions = cities.map(city => ({
    value: city.id,
    label: city.title,
  }));

  const weaponOptions = weapons.map(weapon => ({
    value: weapon.id,
    label: weapon.title,
  }));

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className="title">{t('createTournament')}</h1>
        <p className={styles.subtitle}>{t('fillTournamentInfo')}</p>
      </div>

      {/* Прогресс шагов */}
      <div className={styles.progress}>
        <div className={styles.steps}>
          <button
            className={`${styles.step} ${currentStep >= 1 ? styles.activeStep : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>{t('basicInfo')}</span>
          </button>
          <div className={styles.stepLine} style={currentStep >= 2 ? { background: "var(--accent)" } : {}} />
          <button
            className={`${styles.step} ${currentStep >= 2 ? styles.activeStep : ''}`}
            onClick={() => setCurrentStep(2)}
            disabled={!isStepValid(1)}
          >
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>{t('weaponsAndNominations')}</span>
          </button>
          <div className={styles.stepLine} style={currentStep === 3 ? { background: "var(--accent)" } : {}} />
          <button
            className={`${styles.step} ${currentStep >= 3 ? styles.activeStep : ''}`}
            onClick={() => setCurrentStep(3)}
            disabled={!isStepValid(2)}
          >
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>{t('additionalInfo')}</span>
          </button>
        </div>
      </div>

      {/* Форма */}
      <Section className={styles.formSection}>
        {/* Шаг 1: Основная информация */}
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>{t('basicInfo')}</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('tournamentTitle')} *</label>
              <InputText
                value={formData.title}
                setValue={(val) => handleInputChange('title', val)}
                placeholder={t('enterTournamentTitle')}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('description')} *</label>
              <InputText
                value={formData.description}
                setValue={(val) => handleInputChange('description', val)}
                placeholder={t('enterDescription') + " (Markdown)"}
                rows={4}
                multiline
              />
              <Button stroke onClick={()=>setShowMarkdown(true)}><Eye size={28} color="var(--fg)" /></Button>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('city')} *</label>
                <Select
                  options={cityOptions}
                  value={formData.cityId}
                  setValue={(val) => handleInputChange('cityId', val)}
                  placeholder={t('selectCity')}
                  fullWidth
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t('date')} *</label>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => handleInputChange('date', date)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <Switch
                title={t('childlikeTournament')}
                value={formData.isChildlike}
                setValue={(val) => handleInputChange('isChildlike', val)}
                fit
              />
            </div>
          </div>
        )}

        {/* Шаг 2: Оружие и номинации */}
        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>{t('weaponsAndNominations')}</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('weapons')} *</label>
              <Select
                options={weaponOptions}
                value={formData.weaponsIds}
                setValue={(val) => handleInputChange('weaponsIds', val)}
                placeholder={t('selectWeapon')}
                fullWidth
                multiple
              />
              <div className={styles.hint}>{t('selectMainWeapon')}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('nominations')} *</label>
              <div className={styles.nominationsGrid}>
                {nominations.filter(nom=>formData.weaponsIds.includes(nom.weapon.id)).map(nomination => (
                    <Checkbox
                    key={nomination.id}
                    title={nomination.title}
                    value={nomination.id}
                    values={formData.nominationsIds}
                    setValue={(val)=>{handleInputChange("nominationsIds", val); }}
                    />
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>{t('expectedParticipants')}</label>
                {formData.nominationsIds.map((nomId, id)=>(
                  <div className={styles.row}>
                    <span>
                      {nominations.find(nom=>nom.id === nomId)!.title}
                    </span>
                    <InputNumber
                    key={id}
                    value={formData.participantsCount[nomId]||0}
                    onChange={(count)=>{
                      setFormData(state=>{
                        const buf = JSON.parse(JSON.stringify(state))
                        buf.participantsCount[nomId] = count
                        return buf
                      })
                    }}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Шаг 3: Дополнительная информация */}
        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>{t('additionalInfo')}</h3>

            <ImageUploader setFileName={(name)=>handleInputChange("image", name)} setValue={setCover} />
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('socialLinks')}</label>
              <div className={styles.socialInput}>
                <InputText
                  value={socialLink}
                  setValue={setSocialLink}
                  placeholder="https://t.me/..."
                  className={styles.socialInputField}
                />
                <Button
                  title={t('add')}
                  onClick={handleAddSocialLink}
                  className={styles.addButton}
                  disabled={!socialLink}
                >
                  <Plus size={20} />
                </Button>
              </div>

              {formData.socialMedias.length > 0 && (
                <div className={styles.socialLinks}>
                  {formData.socialMedias.map((link, index) => (
                    <div key={index} className={styles.socialLink}>
                      <span>{link}</span>
                      <button
                        onClick={() => handleRemoveSocialLink(link)}
                        className={styles.removeButton}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('expectedParticipants')}</label>
                <InputNumber
                  value={formData.participantsCount[0]}
                  onChange={(val) => handleInputChange('participantsCount', [val, formData.participantsCount[1]])}
                  min={0}
                />
              </div>
            </div> */}
          </div>
        )}

        {/* Навигация по шагам */}
        <div className={styles.navigation}>
            <Button
              title={t('back')}
              onClick={() => setCurrentStep(prev => prev - 1)}
              className={styles.navButton}
              disabled={currentStep === 1}
              stroke
            >
              <ArrowLeft size={20} color="var(--fg)" />
            </Button>

          {currentStep < 3 ? (
            <Button
              title={t('next')}
              onClick={() => setCurrentStep(prev => prev + 1)}
              className={styles.navButton}
              style={{ alignSelf: "flex-end" }}
              disabled={!isStepValid(currentStep)}
            >
              <ArrowRight size={20} color="var(--fg)" />
            </Button>
          ) : (
            <Button
              title={t('create')}
              onClick={handleSubmit}
              className={styles.submitButton}
            >
              <CirclePlus size={20} />
              <span>{t('createTournament')}</span>
            </Button>
          )}
        </div>
      </Section>
      <ModalWindow isOpen={showMarkdown} onClose={()=>setShowMarkdown(false)}>
          <Section title={t('description')}>
            <Markdown remarkPlugins={[remarkGfm]}>{formData.description}</Markdown>
          </Section>
      </ModalWindow>
    </div>
  );
}