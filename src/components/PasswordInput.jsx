import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./PasswordInput.module.css";

export default function PasswordInput({ value, onChange, placeholder = "", name = "" }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className={styles.inputWrapper}>
      <div className={styles.inputSenhaWrapper}>
        <input
          type={visivel ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={styles.inputSenha}
        />
        <button
          type="button"
          onClick={() => setVisivel(!visivel)}
          className={styles.eyeButton}
          tabIndex={-1}
        >
          {visivel ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}
