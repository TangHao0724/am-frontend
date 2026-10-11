import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Html5Qrcode } from "html5-qrcode";

const API_BASE_URL = "https://api.auqamarine.date/";

export function getUserGeolocation(): Promise<number[]> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("瀏覽器不支援定位功能"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (point) => {
                resolve([
                    point.coords.latitude,
                    point.coords.longitude,
                ]);
            },
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

// QR Code 可以直接放 stage_id，或放包含 stage_id 的網址
function parseStageId(value: string): string {
    const text = value.trim();

    // QR Code 內容直接是數字 ID
    if (/^\d+$/.test(text)) {
        return text;
    }

    // QR Code 內容是網址
    try {
        const url = new URL(text);

        const queryStageId = url.searchParams.get("stage_id");
        if (queryStageId && /^\d+$/.test(queryStageId)) {
            return queryStageId;
        }

        // 支援 /stages/:game_id/:stage_id
        const match = url.pathname.match(/\/stages\/\d+\/(\d+)\/?$/);

        if (match) {
            return match[1];
        }
    } catch {
        // 不是合法網址
    }

    throw new Error(
        "無法從 QR Code 取得 stage_id。請確認 QR Code 內容是階段 ID 或包含 stage_id 的網址。"
    );
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
        // 防止同一個 QR Code 被連續辨識而重複送出請求
        if (processingRef.current) return;

        processingRef.current = true;
        setLoading(true);
        setMessage("掃描成功，正在取得定位...");

        await stopScanner();

        try {
            if (!gameId) {
                throw new Error("網址缺少 gameId");
            }

            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("找不到登入 Token，請先登入");
            }

            const stageId = parseStageId(decodedText);
            const [lat, lon] = await getUserGeolocation();

            setMessage("定位成功，正在提交資料...");

            const params = new URLSearchParams({
                lat: String(lat),
                lon: String(lon),
            });

            const response = await fetch(
                `${API_BASE_URL}/stages/${encodeURIComponent(gameId)}/${encodeURIComponent(stageId)}?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const contentType =
                response.headers.get("content-type") ?? "";

            const result = contentType.includes("application/json")
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw new Error(
                    typeof result === "string"
                        ? result || `請求失敗：${response.status}`
                        : result.message ||
                          result.error ||
                          `請求失敗：${response.status}`
                );
            }

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
        if (scanning || loading) return;

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
                    // 尚未辨識到 QR Code 時，不必顯示錯誤
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

            <p className="mb-4">遊戲 ID：{gameId ?? "未提供"}</p>

            <div
                id="qr-reader"
                className="mb-4 w-full overflow-hidden rounded-lg"
            />

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={startScanner}
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
