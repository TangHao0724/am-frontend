import type { Route } from "./+types/create";
import LocationPicker from "~/component/LocationPicker";
import type {Stage} from "~/component/LocationPicker";
import type { LatLngExpression } from 'leaflet';
import { useState } from "react";
import QRCodeDialog from "./component/dialog";

type Location = {
  lat: number;
  lng: number;
};

interface GameForm {
    start_stage_index: number;
    name: string;
    description: string;
    stages: Stage[];
}
export function meta({}:Route.MetaArgs) {

  return [
    { title: "遊戲建立" },
    { name: "遊戲建立", content: "這裡放置所有公開參加的遊戲，可以參加！" },
  ];
}

export default function Create() {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [stages, setStages] = useState<Stage[]>([]);

    const [showQRCode, setShowQRCode] = useState(false);
    const [firstQRcode, setFirstQRcode] = useState("");
    const [firststageId, setFirststageId] = useState(0);
    

    const [gameId, setGameId] = useState(0);

    function handleAddStage(stage: Stage) {
        setStages((prev) => [...prev, stage]);
    }

    const initialPosition: LatLngExpression = [
        25.033,
        121.5654,
    ];
    const [location, setLocation] = useState<Location | null>(null);
    async function subGame(){
        if (!name.trim()) {
            alert("請輸入遊戲名稱");
            return;
        }

        if (stages.length === 0) {
            alert("請至少新增一個關卡");
            return;
        }

        const payload: GameForm = {
            start_stage_index: 0,
            name: name.trim(),
            description: desc.trim(),
            stages: stages.map((stage, index) => ({
                ...stage,
                is_end: index === stages.length - 1,
            })),
        };

        console.log(JSON.stringify(payload, null, 2));
        const token = localStorage.getItem('token');
        // 替換成你實際的後端 API 路徑
        const response = await fetch("http://54.54.68.45:8080/api/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`建立遊戲失敗：${response.status}`);
        }

        const result = await response.json();
        const firstStage = payload.stages[0];

            if (firstStage) {
                setFirstQRcode(firstStage.qrcode_uid);
                setShowQRCode(true);
                setGameId(result["game_id"]);
                setFirststageId(result["start_stage_id"]);
            }
        console.log("建立成功", result);
    }
  return (
    <>
      <div className="flex flex-row w-full">
        <div className="w-3/12 flex flex-col items-center m-2 gap-5">
          <div>
            <span className="text-2xl text-main-2 font-semibold">遊戲建立</span>
          </div>

            <div className="w-11/12 rounded-md flex flex-col gap-3">
            <div className="flex flex-row gap-1.5 items-center">
                <label className="text-nowrap">遊戲名稱：</label>
                <input
                type="text"
                onChange={(event) => setName(event.target.value)}
                className="border border-main-3 text-md p-2 rounded-md w-full"
                />
            </div>

            <div className="flex flex-row gap-1.5 items-center">
                <label className="text-nowrap">描述：</label>
                <textarea
                onChange={(event) => setDesc(event.target.value)}
                className="border border-main-3 text-md p-2 rounded-md w-full"
                />
            </div>
            </div>

            <hr className="w-48 h-1 mx-auto my-1 bg-main-2 border-0 rounded-sm md:my-5" />

            <div className="w-full flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-main-2">
                關卡列表（{stages.length}）
            </h2>

            {stages.map((stage, index) => (
                <div
                key={stage.qrcode_uid}
                className="bg-main-1 border border-main-3/30 rounded-lg p-4 shadow-sm"
                >
                <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold">
                    {index + 1}. {stage.name}
                    </span>

                    <button
                    type="button"
                    className="text-red-600 text-sm"
                    onClick={() =>
                        setStages((prev) =>
                        prev.filter(
                            (item) => item.qrcode_uid !== stage.qrcode_uid
                        )
                        )
                    }
                    >
                    移除
                    </button>
                </div>

                <p className="text-sm text-gray-600 mt-2">經度：{stage.lon}</p>
                <p className="text-sm text-gray-600">緯度：{stage.lat}</p>
                </div>
            ))}
            </div>

            <div className="w-11/12">
            <button
                className="bg-main-1 rounded-md border px-3 py-1 w-full h-20"
                onClick={subGame}
            >
                送出
            </button>
            </div>
        </div>

        <div className="w-9/12">
            <LocationPicker
            initialPosition={initialPosition}
            onLocationChange={(x) => {
                setLocation(x);
                console.log(x);
            }}
            stages={stages}
            onAddStage={handleAddStage}
            />
        </div>
        </div>
        <QRCodeDialog
            open={showQRCode}
            gameId={gameId}
            stage_id={firststageId}
            qrcodeUid={firstQRcode}
            stages={stages}
            token={"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0LCJuYW1lIjoiaWNvIiwiZXhwIjoxNzkxNzk0NzM0LCJpYXQiOjE3OTE3MDgzMzR9.8hU5Vd6uLJwPG-50M9ZJp_kNCLvdkvXLUdKnR4ZCqN8"}
            onClose={() => setShowQRCode(false)}
        />
    </>
  );
}
