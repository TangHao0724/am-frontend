import { useState } from "react"
import InputAlert from "~/UIElements/input/inputAlert";
import LoginInput from "~/UIElements/input/loginInput";

const API_BASE_URL = import.meta.env.VITE_API_URL;
type Props = {
  isDone: (isDone: boolean) => void;
};

export default function AnonymousRegister({isDone}:Props){
    const [name,setName] = useState("");
    const [error, setError] = useState("");

    async function sub_user() {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("請輸入暱稱");
            return;
        }

        if (trimmedName.length > 50) {
            setError("暱稱不可超過 50 個字元");
            return;
        }

        try {
            setError("");

            const response = await fetch(`${API_BASE_URL}/user/anonymous`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: trimmedName,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                isDone(false);

                switch (data?.error) {
                    case "invalid_request":
                        setError(data.message || "請輸入有效的暱稱");
                        break;

                    case "create_user_failed":
                        setError("建立匿名帳戶失敗，請稍後再試");
                        break;

                    case "token_generation_failed":
                        setError(
                            "匿名帳戶已建立，但登入憑證產生失敗，請稍後再試"
                        );
                        break;

                    default:
                        setError(
                            typeof data?.message === "string"
                                ? data.message
                                : `匿名註冊失敗，HTTP ${response.status}`
                        );
                        break;
                }

                return;
            }

            if (
                data?.status !== true ||
                typeof data?.token !== "string" ||
                !data.token
            ) {
                isDone(false);
                setError("伺服器沒有回傳有效的匿名登入結果或 token");
                return;
            }

            localStorage.setItem("token", data.token);
            isDone(true);
        } catch (err) {
            console.error("匿名註冊失敗：", err);
            isDone(false);
            setError("無法連線至伺服器，請稍後再試");
        }
    }
        
    return(
        <>
            <LoginInput title="暱稱" type="text" name="name" desc="使用匿名登入快速進入遊戲" value={name} onChange={setName}/>
             {error && (
                <InputAlert error={error}/>
            )}
            <div>
                <button className="bg-main-2 rounded-md border px-3 py-1" onClick={sub_user}>送出</button>
            </div>
        </>
        
    )
}
