import { useEffect, useState } from "react";
import type { Route } from "./+types/welecome";
import { getUserGeolocation } from "~/service/geolocation";
import { useNavigate, useParams } from "react-router";
import AnonymousRegister from "./component/anonymousRegister";
import Register from "./component/register";
import Login from "./component/login";
import UpdateUser from "./component/updateUser";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Welcome() {
    const  { gameId }  = useParams();
    const [geolocation, setGeolocation] = useState<number[] | undefined>();
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
    
  function handleRegisterDone(isDone: boolean) {
     if (!isDone) return;

    if (gameId) {
      navigate(`/game/${gameId}`);
      return;
    }

    console.log("OK");
  }
  return (
    <>
      <div className="flex flex-col justify-center items-center gap-2">
        <h1>這裡是歡迎頁面，恭喜你加入測試。</h1>
          <h1>
              {gameId
                  ? `你是透過亂掃路邊 QRCODE 過來的吧！ 歡迎！`
                  : "歡迎！"}
          </h1>
          <span>
          {geolocation
            ? `你的位置在 ${geolocation[0]}, ${geolocation[1]}`
            : "正在取得位置..."}
        </span>
        <AnonymousRegister isDone={handleRegisterDone} />
        <Register isDone={handleRegisterDone} />
        <Login isDone={handleRegisterDone} />
        <UpdateUser isDone={handleRegisterDone}/>
      </div>
    </>
  );
}