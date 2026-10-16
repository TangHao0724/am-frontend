
import { useState } from "react";
import InputAlert from "~/UIElements/input/inputAlert";
import LoginInput from "~/UIElements/input/loginInput";

const API_BASE_URL = import.meta.env.VITE_API_URL;

type Props = {
  isDone: (isDone: boolean) => void;
};

export default function UpdateUser({ isDone }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function validateForm(): boolean {
    // 1. 暱稱驗證

    // 2. Email 格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError("請輸入電子信箱");
      return false;
    }

    if (!emailRegex.test(email.trim())) {
      setError("電子信箱格式不正確");
      return false;
    }

    // 3. 密碼驗證：至少 8 個字元，包含英文字母與數字，不允許空白
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

    const jwtToken = localStorage.getItem("token");
    console.log("jwtToken",jwtToken);
    if (!jwtToken) {
      setError("登入狀態失效，請正式申請帳號。");
      isDone(false);
      return;
    }

    try {
      const basedata: { email: string; password: string; name?: string } = {
        email: email.trim(),
        password,
      };
      const trimmedName = name.trim();
      if (name !== "") {
        basedata["name"] = trimmedName;
      }
      const response = await fetch(`${API_BASE_URL}/api/user/updateUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":`Bearer ${jwtToken}`,
        },
        body: JSON.stringify(basedata),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        isDone(false);

        switch (data?.error) {
          case "invalid_request":
            setError("帳戶資料格式不正確，請檢查輸入內容");
            break;

          case "pw_pattern_error":
            setError("密碼格式錯誤，請確認密碼符合規定");
            break;

          case "unauthorized":
          case "invalid_user_id":
            setError("登入狀態已失效，請重新登入");
            break;

          case "account_already_upgraded":
            setError("此帳戶已經是正式帳戶，請直接登入");
            break;

          case "email_already_exists":
            setError("此電子信箱已被其他帳戶使用");
            break;

          default:
            setError(
              typeof data?.message === "string"
                ? data.message
                : `註冊失敗，HTTP ${response.status}`
            );
            break;
        }

        return;
      }

      // 確認後端有回傳有效的 token
      if (typeof data?.token !== "string" || !data.token) {
        isDone(false);
        setError("伺服器沒有回傳有效的 token");
        return;
      }

      localStorage.setItem("token", data.token);
      isDone(true);
    } catch (err) {
      console.error("註冊失敗：", err);
      isDone(false);
      setError("無法連線至伺服器，請稍後再試");
    }

  }

  return (
    <>
      <LoginInput
        title="暱稱"
        type="text"
        name="name"
        placeholder="(可選)如果無須更換暱稱，不需填寫。"
        value={name}
        onChange={setName}
      />

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
