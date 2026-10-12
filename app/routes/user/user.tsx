import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Html5Qrcode } from "html5-qrcode";

type ScanRequestBody = {
    lat: number;
    lon: number;
};

const API_HOST = "api.auqamarine.date";

// 取得使用者目前的 GPS 座標，回傳 [緯度, 經度]
export function getUserGeolocation(): Promise<number[]> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("瀏覽器不支援定位功能"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve([
                    position.coords.latitude,
                    position.coords.longitude,
                ]);
            },
            (error) => {
                reject(
                    new Error(
                        error.code === error.PERMISSION_DENIED
                            ? "使用者拒絕定位權限"
                            : error.code === error.TIMEOUT
                              ? "取得定位逾時，請再試一次"
                              : "無法取得目前位置"
                    )
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

// 驗證 QR Code 是否為預期的 API 網址
function parseQRCodeUrl(value: string): string {
    let url: URL;

    try {
        url = new URL(value.trim());
    } catch {
        throw new Error("QR Code 內容不是有效的網址");
    }

    // 避免將 Bearer Token 傳送到不可信任的網址
    if (
        url.protocol !== "https:" ||
        url.hostname !== API_HOST ||
        url.port !== "" ||
        url.username !== "" ||
        url.password !== ""
    ) {
        throw new Error("QR Code 網址不符合預期的 API 網域");
    }

    // 預期格式：/qrcode/:game_id/:qrcode_uid
    const match = url.pathname.match(
        /^\/qrcode\/(\d+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i
    );

    if (!match) {
        throw new Error("QR Code 網址格式錯誤");
    }

    if (url.search || url.hash) {
        throw new Error("QR Code 網址不應包含額外參數");
    }

    return url.toString();
}

export default function ScanPage() {
    const { gameId } = useParams();

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const processingRef = useRef(false);

    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function stopScanner() {
        const scanner = scannerRef.current;

        if (scanner?.isScanning) {
            try {
                await scanner.stop();
            } catch (error) {
                console.error("停止掃描器失敗", error);
            }
        }

        scannerRef.current = null;
        setScanning(false);
    }

    async function handleScan(decodedText: string) {
        // 防止掃描器連續辨識同一張 QR Code
        if (processingRef.current) return;

        processingRef.current = true;
        setLoading(true);
        setMessage("掃描成功，正在取得定位...");

        await stopScanner();

        try {
            // 1. 取得並驗證 QR Code 中的完整 API 網址
            const targetUrl = parseQRCodeUrl(decodedText);

            // 如果頁面帶有 gameId，確認與 QR Code 的遊戲 ID 一致
            const qrGameId = new URL(decodedText).pathname.split("/")[2];

            if (gameId && qrGameId !== gameId) {
                throw new Error("此 QR Code 不屬於目前的遊戲");
            }

            // 2. 取得登入 Token
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("找不到登入 Token，請先登入");
            }

            // 3. 取得 GPS 座標
            const [lat, lon] = await getUserGeolocation();

            const body: ScanRequestBody = {
                lat,
                lon,
            };

            setMessage("定位成功，正在提交掃描資料...");

            // 4. 對 QR Code 中的網址發送 POST
            const response = await fetch(targetUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(body),
            });

            // 5. 解析後端回應
            const contentType =
                response.headers.get("content-type") ?? "";

            const result = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                const errorMessage =
                    typeof result === "string"
                        ? result || `請求失敗：${response.status}`
                        : result.message ||
                          result.error ||
                          `請求失敗：${response.status}`;

                throw new Error(errorMessage);
            }

            // 6. 顯示成功訊息
            setMessage(
                typeof result === "string"
                    ? `掃描完成：${result}`
                    : result.message || "掃描與定位資料已成功送出"
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "掃描處理時發生未知錯誤"
            );
        } finally {
            setLoading(false);
            processingRef.current = false;
        }
    }

    async function startScanner() {
        if (scanning || loading || scannerRef.current) return;

        try {
            setMessage("");

            const scanner = new Html5Qrcode("qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    void handleScan(decodedText);
                },
                () => {
                    // 尚未辨識到 QR Code，不需要顯示錯誤
                }
            );

            setScanning(true);
            setMessage("請將 QR Code 對準掃描框");
        } catch (error) {
            scannerRef.current = null;
            setScanning(false);

            setMessage(
                error instanceof Error
                    ? `無法啟動相機：${error.message}`
                    : "無法啟動相機，請確認相機權限"
            );
        }
    }

    useEffect(() => {
        return () => {
            const scanner = scannerRef.current;

            if (scanner?.isScanning) {
                void scanner.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <main className="mx-auto max-w-xl p-6">
            <h1 className="mb-4 text-2xl font-bold">
                掃描階段 QR Code
            </h1>

            <p className="mb-4">
                遊戲 ID：{gameId ?? "未提供"}
            </p>

            <div
                id="qr-reader"
                className="mb-4 w-full overflow-hidden rounded-lg"
            />

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => void startScanner()}
                    disabled={scanning || loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                    {loading
                        ? "處理中..."
                        : scanning
                          ? "掃描中..."
                          : "啟用 QR Code 掃描"}
                </button>

                {scanning && (
                    <button
                        type="button"
                        onClick={() => void stopScanner()}
                        className="rounded-lg border px-4 py-2"
                    >
                        停止掃描
                    </button>
                )}
            </div>

            {message && (
                <p className="mt-4 break-words" role="status">
                    {message}
                </p>
            )}
        </main>
    );
}
