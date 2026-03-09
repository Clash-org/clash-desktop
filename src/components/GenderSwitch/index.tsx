// components/ui/GenderSwitch.tsx
import { Mars, Venus } from "lucide-react";
import React from "react";
import styles from "./index.module.css";
import { Gender } from "@/typings";

interface GenderSwitchProps {
  gender: Gender;
  setGender: React.Dispatch<React.SetStateAction<Gender>> | ((g: Gender) => void);
  className?: string;
}

export function GenderSwitch({ gender, setGender, className = "" }: GenderSwitchProps) {
  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);
  };

  const handleKeyPress = (e: React.KeyboardEvent, newGender: Gender) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setGender(newGender);
    }
  };

  return (
    <div className={`${styles.genderRow} ${className}`}>
      <button
        className={`${styles.genderBtn} ${gender === Gender.MALE ? styles.genderActive : ""}`}
        onClick={() => handleGenderChange(Gender.MALE)}
        onKeyPress={(e) => handleKeyPress(e, Gender.MALE)}
        aria-label="Мужской пол"
        aria-pressed={gender === Gender.MALE}
        type="button"
      >
        <Mars size={28} color={gender === Gender.MALE ? "var(--fg)" : "currentColor"} />
      </button>

      <button
        className={`${styles.genderBtn} ${gender === Gender.FEMALE ? styles.genderActive : ""}`}
        onClick={() => handleGenderChange(Gender.FEMALE)}
        onKeyPress={(e) => handleKeyPress(e, Gender.FEMALE)}
        aria-label="Женский пол"
        aria-pressed={gender === Gender.FEMALE}
        type="button"
      >
        <Venus size={28} color={gender === Gender.FEMALE ? "var(--fg)" : "currentColor"} />
      </button>
    </div>
  );
}