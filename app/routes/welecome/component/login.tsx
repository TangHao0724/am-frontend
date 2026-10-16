
import { useState } from "react";
import InputAlert from "~/UIElements/input/inputAlert";
import LoginInput from "~/UIElements/input/loginInput";

const API_BASE_URL = import.meta.env.VITE_API_URL;

type Props = {
  isDone: (isDone: boolean) => void;
};

export default function Login({ isDone }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function validateForm(): boolean {
    
    // 1. Email 格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError("請輸入電子信箱");
      return false;
    }

    if (!emailRegex.test(email.trim())) {
      setError("電子信箱格式不正確");
      return false;
    }

    // 2. 密碼驗證：至少 8 個字元，包含英文字母與數字，不允許空白
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/;

    if (!password) {
      setError("請輸入密碼");
      return false;
    }

    if (!passwordRegex.test(password)) {
      setError("密碼至少需要 8 個字元，且必須包含英文字母與數字，不可包含空白");
      return false;
    }

    setError("");
    return true;
  }

  async function sub_user() {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      // 解析後端回應，避免非 JSON 回應導致程式中斷
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        isDone(false);

        switch (data?.error) {
          case "invalid_request":
            setError("請輸入有效的電子信箱與密碼");
            break;

          case "invalid_credentials":
            setError("電子信箱或密碼錯誤");
            break;

          case "login_failed":
            setError("登入服務發生錯誤，請稍後再試");
            break;

          case "token_generation_failed":
            setError("登入憑證產生失敗，請稍後再試");
            break;

          default:
            setError(
              typeof data?.message === "string"
                ? data.message
                : `登入失敗，HTTP ${response.status}`
            );
            break;
        }

        return;
      }

      // 確認登入結果與 JWT
      if (
        data?.status !== true ||
        typeof data?.token !== "string" ||
        !data.token
      ) {
        isDone(false);
        setError("伺服器沒有回傳有效的登入結果或 token");
        return;
      }

      localStorage.setItem("token", data.token);
      isDone(true);
    } catch (err) {
      console.error("登入失敗：", err);
      isDone(false);
      setError("無法連線至伺服器，請稍後再試");
    }
  }

  return (
    <>
      <LoginInput
        title="電子信箱"
        type="email"
        name="email"
        value={email}
        onChange={setEmail}
      />

      <LoginInput
        title="密碼"
        type="password"
        name="password"
        value={password}
        onChange={setPassword}
      />

      {error && <InputAlert error={error} />}

      <div>
        <button
          type="button"
          className="bg-main-2 rounded-md border px-3 py-1"
          onClick={sub_user}
        >
          送出
        </button>
      </div>
    </>
  );
}
