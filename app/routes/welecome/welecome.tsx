import { useEffect, useState } from "react";
import type { Route } from "./+types/welecome";
import { getUserGeolocation } from "~/service/geolocation";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}
const API_BASE_URL = "https://api.auqamarine.date";
export default function Welcome() {
    const [geolocation, setGeolocation] = useState<number[] | undefined>();
    const [name, setName] = useState<string>("");
    const navigate = useNavigate();
    useEffect(() => {   
        getUserGeolocation()
            .then((location) => {
                setGeolocation(location);
            })
            .catch((error) => {
                console.error("取得位置失敗", error);
            });
    }, []);
    async function sub_user(){
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
        }),
      });

      const data = await response.json();
      localStorage.setItem('token', data["token"]);
      navigate("/create");
      console.log(data);
    }

  return (
    <>
      <div className="flex flex-col justify-center items-center gap-2">
        <h1>這裡是歡迎頁面</h1>
        <span>
          {geolocation
            ? `你的位置在 ${geolocation[0]}, ${geolocation[1]}`
            : "正在取得位置..."}
        </span>
        <div className="flex flex-row gap-1.5 items-center">
            <label htmlFor="">暱稱：</label>
            <input type="text" onChange={(event) => setName(event.target.value)} className="border border-main-3 text-md p-2 rounded-md"/>
        </div>
        <div>
            <button className="bg-main-2 rounded-md border px-3 py-1" onClick={sub_user}>送出</button>
        </div>
      </div>
    </>
  );
}