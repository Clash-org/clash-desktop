// components/CreateTournament/index.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  CirclePlus,
  Eye,
  Trash2,
  CheckCircle,
  Ban
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
import { CURRENCY_CODES, ParticipantStatus, ParticipantStatusType, TournamentFormData, TournamentStatus, TournamentType } from '@/typings';
import { createTournament, deleteTournament, updateParticipantStatus, updateTournament, updateTournamentStatus } from '@/utils/api';
import ImageUploader from '../ImageUploader';
import toast from 'react-hot-toast';
import { useAtomValue } from 'jotai';
import { languageAtom, userAtom } from '@/store';
import { getNewImageName, translateStatus } from '@/utils/helpers';
import { useCities } from '@/hooks/useCities';
import { useOrganizerTournaments } from '@/hooks/useTournaments';
import { useNominations } from '@/hooks/useNominations';
import { useWeapons } from '@/hooks/useWeapons';
import Tabs from '../Tabs';
import { useParticipants } from '@/hooks/useParticipants';
import { useApi } from '@/hooks/useApi';
import { useParticipantsInfo } from '@/hooks/useParticipantsInfo';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useUsers } from '@/hooks/useUsers';
import ErrorPage from '../ErrorPage';
import { ShareButton } from '../ShareButton';
import LinksList from '../LinksList';

export default function CreateTournament() {
  const { t } = useTranslation();
  const lang = useAtomValue(languageAtom)
  const user = useAtomValue(userAtom)
  const { tournaments } = useOrganizerTournaments(user?.id, lang)
  const { nominations } = useNominations(lang)
  const { weapons } = useWeapons(nominations)
  const { cities } = useCities(lang)
  const { users } = useUsers(lang)
  const [currentStep, setCurrentStep] = useState(1);
  const [currentTournament, setCurrentTournament] = useState<TournamentType>();
  const { info: participantsInfo } = useParticipantsInfo(currentTournament?.id, lang)
  const { participants } = useParticipants(currentTournament?.id, currentTournament?.nominationsIds || [])
  const [socialLink, setSocialLink] = useState('');
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const tabs = ["tournaments", "participants"] as const
  const tabsTitles = tabs.map(tab=>t(tab))
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("tournaments")
  const [cover, setCover] = useState<FormData>(new FormData())
  const { api } = useApi()

  // @ts-ignore
  const defaultTournametData: TournamentFormData = {
    title: '',
    description: '',
    date: new Date(),
    cityId: 0,
    image: "",
    prices: {},
    weaponsIds: [],
    nominationsIds: [],
    participantsCount: {},
    socialMedias: [],
    isAdditions: {},
    moderatorsIds: [],
    isInternal: false,
    currency: "RUB",
    status: "pending"
  }

  const [formData, setFormData] = useState<TournamentFormData>(defaultTournametData);

  useEffect(()=>{
    if (currentTournament) {
      // @ts-ignore
      handleInputChange("cityId", currentTournament.cityId)
      handleInputChange("date", new Date(currentTournament.date))
      handleInputChange("description", currentTournament.description)
      handleInputChange("isAdditions", currentTournament.isAdditions)
      handleInputChange("nominationsIds", currentTournament.nominationsIds)
      handleInputChange("participantsCount", currentTournament.participantsCount)
      handleInputChange("prices", currentTournament.prices)
      handleInputChange("socialMedias", currentTournament.socialMedias)
      handleInputChange("title", currentTournament.title)
      handleInputChange("image", currentTournament.image)
      handleInputChange("status", currentTournament.status)
      handleInputChange("isInternal", currentTournament.isInternal)
      handleInputChange("moderatorsIds", currentTournament.moderators.map(m=>m.id))
      handleInputChange("weaponsIds", nominations.filter(nom=>currentTournament.nominationsIds.includes(nom.id)).map(nom=>nom.weapon.id))
    }
  }, [currentTournament])

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

  const handleAdditions = (field: string, val: boolean) => {
    handleInputChange('isAdditions', { ...formData.isAdditions, [field]: val })
  }

  const handleAddSocialLink = () => {
    if (socialLink && !formData.socialMedias.includes(socialLink)) {
      setFormData(prev => ({
        ...prev,
        socialMedias: [...prev.socialMedias, socialLink],
      }));
      setSocialLink('');
    }
  };

  const handleRemoveSocialLink = (links: string[]) => {
    setFormData(prev => ({
      ...prev,
      socialMedias: links,
    }));
  };

  const handleUpdateParticipantStatus = async (tournamentId: number, nominationId: string, userId: string, status: ParticipantStatusType)=>{
    const res = await updateParticipantStatus(tournamentId, Number(nominationId), userId, status)
    if (res)
      toast.success(t("dataUpdated"))
  }

  const handleSubmit = async () => {
    if (currentTournament) {
      const newName = await getNewImageName(formData.image, cover)
      const res = await updateTournament({ ...formData, image: newName }, currentTournament.id)
      if (res) {
        toast.success(t("dataUpdated"))
        setCurrentTournament(res)
      }
    } else {
      const newName = await getNewImageName(formData.image, cover)
      const data = await createTournament({ ...formData, image: newName })
      if (data) {
        toast.success(t("created"))
        setFormData(defaultTournametData)
        setCover(new FormData())
        setCurrentStep(1)
      }
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

  if (!user) return <ErrorPage />

  return (
    <div className={["container", styles.container].join(" ")} style={{ gap: 0 }}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className="title">{t('createTournament')}</h1>
      </div>

      {!!tournaments.length &&
      <>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} titles={tabsTitles} />
      <Section title={t("tournaments")}>
        <Select
        placeholder={t("yourTournamets")}
        setValue={(val)=>setCurrentTournament(JSON.parse(val))}
        value={JSON.stringify(currentTournament)}
        options={tournaments.map(t=>({ label: t.title, value: JSON.stringify(t) }))}
        />
        {!!currentTournament &&
        <Button
        title={t("createNewTournament")}
        onClick={()=>{setCurrentTournament(undefined); setFormData(defaultTournametData)}}
        />
        }
        {currentTournament &&
        <>
        <ShareButton type="tournament" id={currentTournament.id} />
        <Select
        placeholder={t("status")}
        options={Object.values(TournamentStatus).map(s=>({ label: translateStatus(s, lang), value: s }))}
        value={formData.status}
        setValue={(val)=>handleInputChange("status", val)}
        />
        <Button
        title={t("updateStatus")}
        onClick={async ()=>{
          const res = await updateTournamentStatus(formData.status, currentTournament.id)
          if (res) {
            setCurrentTournament(res)
            toast.success(t("dataUpdated"))
          }
        }}
        />
        <Button
        stroke
        title={t("delete")}
        onClick={()=>setShowDelete(true)}
        />
        </>
        }
      </Section>

      </>
      }
      {activeTab === "tournaments" &&
      <>
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
                  placeholder={t('city')}
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
              <label className={styles.label}>{t('moderator')}</label>
              <Select
                options={users.filter(u=>u.id !== user.id).map(u=>({ label: u.username, value: u.id }))}
                value={formData.moderatorsIds}
                setValue={(val)=>handleInputChange("moderatorsIds", val)}
                multiple
              />
            </div>

            <div className={styles.formGroup}>
              <Switch
                title={t('internal')}
                value={formData.isInternal}
                setValue={(val) => handleInputChange("isInternal", val)}
              />
              <Switch
                title={t('childlikeTournament')}
                value={formData.isAdditions["isChildlike"]}
                setValue={(val) => handleAdditions("isChildlike", val)}
              />
              <Switch
              title={t("city")}
              value={formData.isAdditions["isCity"]}
              setValue={(val)=> handleAdditions('isCity', val)}
              />
              <Switch
              title={t("fullName")}
              value={formData.isAdditions["isFullName"]}
              setValue={(val)=> handleAdditions('isFullName', val)}
              />
              <Switch
              title={t("phone")}
              value={formData.isAdditions["isPhone"]}
              setValue={(val)=> handleAdditions('isPhone', val)}
              />
              <Switch
              title={t("otherContacts")}
              value={formData.isAdditions["isOtherContacts"]}
              setValue={(val)=> handleAdditions('isOtherContacts', val)}
              />
              <Switch
              title={t("weaponsRental")}
              value={formData.isAdditions["isWeaponsRental"]}
              setValue={(val)=> handleAdditions('isWeaponsRental', val)}
              />
              <Switch
              title={t("ruleAndPolicy")}
              value={formData.isAdditions["isRuleAndPolicy"]}
              setValue={(val)=> handleAdditions('isRuleAndPolicy', val)}
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
                multiple
              />
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
                    setValue={(val: number[])=>{handleInputChange("nominationsIds", val); }}
                    />
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>{t('expectedParticipants')} *</label>
                {formData.nominationsIds.map((nomId, idx)=>(
                  <div key={idx} className={styles.row}>
                    <span>
                      {nominations.find(nom=>nom.id === nomId)!.title}
                    </span>
                    <InputNumber
                    value={formData.participantsCount[nomId]||0}
                    setValue={(count)=>{
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
            <div className={styles.formGroup}>
                <label className={styles.label}>{t('price')} *</label>
                <Select
                options={CURRENCY_CODES.map(code=>({ label: code, value: code }))}
                value={formData.currency}
                setValue={val=>handleInputChange("currency", val)}
                fit
                />
                {formData.nominationsIds.map((nomId, idx)=>(
                  <div key={idx} className={styles.row}>
                    <span>
                      {nominations.find(nom=>nom.id === nomId)!.title}
                    </span>
                    <InputNumber
                    max={100000}
                    value={formData.prices[nomId]||0}
                    setValue={(count)=>{
                      setFormData(state=>{
                        const buf = JSON.parse(JSON.stringify(state))
                        buf.prices[nomId] = count
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

            <ImageUploader value={formData.image ? api.covers + formData.image : null} setFileName={(name)=>handleInputChange("image", name)} setValue={setCover} />
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

              <LinksList links={formData.socialMedias} setLinks={(links)=>handleRemoveSocialLink(links)} />
            </div>
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
              <span>{currentTournament ? t("updateData") : t('createTournament')}</span>
            </Button>
          )}
        </div>
      </Section>
      <ModalWindow isOpen={showMarkdown} onClose={()=>setShowMarkdown(false)}>
          <Section title={t('description')}>
            <Markdown remarkPlugins={[remarkGfm]}>{formData.description}</Markdown>
          </Section>
      </ModalWindow>
      <ModalWindow isOpen={showDelete} onClose={()=>setShowDelete(false)}>
          <Section title={t("realyDelete")}>
            <Button onClick={()=>{ deleteTournament(currentTournament!.id); setCurrentTournament(undefined) }}>
              <Trash2 color="var(--fg)" />
            </Button>
          </Section>
      </ModalWindow>
      </>
      }
      {activeTab === "participants" &&
      <>
      {participants && currentTournament && Object.keys(participants).filter(nomId=>participants[nomId].length).map(nomId=> (
        <Section title={currentTournament?.nominations.find(nom=>nom.id === Number(nomId))?.title} key={nomId}>
          {participants[nomId].map(p=>
          <span className={styles.participants} key={p.id}>
            {p.username}
            <div className={styles.participantsControllers}>
              <CheckCircle
              size={24}
              color={p.status === ParticipantStatus.CONFIRMED ? "var(--accent)" : "var(--fg)"}
              onClick={async () => await handleUpdateParticipantStatus(currentTournament.id, nomId, p.id, ParticipantStatus.CONFIRMED)}
              />
              <Ban
              size={24}
              color={p.status === ParticipantStatus.CANCELLED ? "var(--accent)" : "var(--fg)"}
              onClick={async () => await handleUpdateParticipantStatus(currentTournament.id, nomId, p.id, ParticipantStatus.CANCELLED)}
              />
            </div>
          </span>)}
        </Section>
      ))}
      {participantsInfo.map(info=>
        <Section key={info.id} title={info.user.username}>
          {!!info.info["trainerName"] && <span><span className={styles.participantField}>{t("trainerName")}:</span> {info.info["trainerName"]}</span>}
          {!!info.info["age"] && <span><span className={styles.participantField}>{t("age")}:</span> {info.info["age"]}</span>}
          {!!info.info["cityId"] && <span><span className={styles.participantField}>{t("city")}:</span> {cities.find(city=>city.id === info.info["cityId"])?.title}</span>}
          {!!info.info["fullName"] && <span><span className={styles.participantField}>{t("fullName")}:</span> {info.info["fullName"]}</span>}
          {!!info.info["phone"] && <span><span className={styles.participantField}>{t("phone")}:</span> {info.info["phone"]}</span>}
          {!!info.info["otherContacts"] && <span><span className={styles.participantField}>{t("otherContacts")}:</span> <span className='link' onClick={async ()=> await openUrl(info.info["otherContacts"])}>{info.info["otherContacts"]}</span></span>}
          {!!info.info["weaponsRental"] && <span><span className={styles.participantField}>{t("weaponsRental")}:</span> {Object.keys(info.info["weaponsRental"]).filter(key=>info.info["weaponsRental"][key]).map(title=>title).join(", ")}</span>}
        </Section>
      )}
      </>
      }
    </div>
  );
}