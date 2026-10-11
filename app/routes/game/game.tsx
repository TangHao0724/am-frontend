import { useEffect, useState } from "react";
import { useParams } from "react-router";

type QRCodeItem = {
    stageId: number;
    imageUrl: string;
};

export default function GameQRCodes() {
    const { gameId, startStageId } = useParams();

    const [qrcodes, setQrcodes] = useState<QRCodeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!gameId || !startStageId) {
            setError("缺少遊戲 ID 或起始階段 ID");
            setLoading(false);
            return;
        }

        const firstId = Number(startStageId);

        if (!Number.isInteger(firstId) || firstId <= 0) {
            setError("起始階段 ID 不正確");
            setLoading(false);
            return;
        }

        let cancelled = false;
        const createdUrls: string[] = [];

        async function fetchQRCodes() {
            setLoading(true);
            setError("");
            setQrcodes([]);

            try {
                const results: QRCodeItem[] = [];
                const token = localStorage.getItem('token');
                // 從後端回傳的 start_stage_id 開始
                for (let stageId = firstId; ; stageId++) {
                    const response = await fetch(
                        `http://54.54.68.45:8080/api/qrcode/${encodeURIComponent(gameId!)}/${encodeURIComponent(stageId!)}`,{
                          headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                          },
                        }
                    );

                    // 遇到第一個 HTTP 錯誤就停止
                    if (!response.ok) {
                        break;
                    }

                    const contentType =
                        response.headers.get("content-type") ?? "";

                    if (!contentType.startsWith("image/")) {
                        throw new Error(
                            `階段 ${stageId} 回傳的不是圖片`
                        );
                    }

                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);

                    createdUrls.push(imageUrl);

                    results.push({
                        stageId,
                        imageUrl,
                    });

                    if (cancelled) {
                        return;
                    }
                }

                if (cancelled) {
                    return;
                }

                setQrcodes(results);

                if (results.length === 0) {
                    setError("沒有取得任何 QR Code");
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "載入 QR Code 時發生錯誤"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchQRCodes();

        return () => {
            cancelled = true;
            createdUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [gameId, startStageId]);

    if (loading) {
        return <p>正在載入 QR Code...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <main>
            <h1>遊戲 QR Code</h1>
            <p>遊戲 ID：{gameId}</p>
            <p>起始階段 ID：{startStageId}</p>
            <p>共取得 {qrcodes.length} 個 QR Code</p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {qrcodes.map((qrcode) => (
                    <div
                        key={qrcode.stageId}
                        className="rounded-lg border p-4"
                    >
                        <h2>階段 {qrcode.stageId}</h2>

                        <img
                            src={qrcode.imageUrl}
                            alt={`階段 ${qrcode.stageId} 的 QR Code`}
                            className="mx-auto h-64 w-64 object-contain"
                        />

                        <a
                            href={qrcode.imageUrl}
                            download={`stage-${qrcode.stageId}-qrcode.png`}
                        >
                            下載 QR Code
                        </a>
                    </div>
                ))}
            </div>
        </main>
    );
}
