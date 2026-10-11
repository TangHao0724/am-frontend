import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Stage } from "~/component/LocationPicker";

type QRCodeDialogProps = {
    open: boolean;
    qrcodeUid:string;
    stage_id: number;
    token: string;
    gameId:number;
    stages:Stage[];
    onClose: () => void;
};

const API_BASE_URL = "http://54.54.68.45:8080";

export default function QRCodeDialog({
    open,
    stage_id,
    qrcodeUid,
    token,
    gameId,
    stages,
    onClose,
}: QRCodeDialogProps) {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const navigate = useNavigate();
    useEffect(() => {
        if (!open || !stage_id || !token) {
            return;
        }

        const controller = new AbortController();
        let objectUrl = "";

        async function fetchQRCode() {
            setLoading(true);
            setError("");
            setImageUrl("");
            
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/qrcode/${encodeURIComponent(gameId)}/${encodeURIComponent(stage_id)}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `取得 QR Code 失敗：HTTP ${response.status}`
                    );
                }

                const blob = await response.blob();

                if (blob.size === 0) {
                    throw new Error("伺服器回傳的圖片是空的");
                }

                objectUrl = URL.createObjectURL(blob);
                setImageUrl(objectUrl);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "取得 QR Code 時發生錯誤"
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchQRCode();

        return () => {
            controller.abort();

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [open, stage_id, token, retry]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="qrcode-dialog-title"
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2
                        id="qrcode-dialog-title"
                        className="text-xl font-bold text-slate-800"
                    >
                        關卡 QR Code
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="關閉"
                        className="rounded-md px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
                    >
                        ×
                    </button>
                </div>

                <div className="flex min-h-64 flex-col items-center justify-center">
                    {loading && (
                        <p className="text-slate-500">
                            正在載入 QR Code...
                        </p>
                    )}

                    {error && (
                        <div className="text-center">
                            <p className="text-red-600">{error}</p>

                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setImageUrl("");
                                    setRetry((prev) => prev + 1);
                                }}
                                className="mt-3 rounded-md border px-4 py-2 text-sm hover:bg-slate-100 transition"
                            >
                                重新載入 QR Code
                            </button>
                        </div>
                    )}

                    {imageUrl && !loading && !error && (
                        <img
                            src={imageUrl}
                            alt="第一個關卡的 QR Code"
                            className="h-auto w-full max-w-64 object-contain"
                        />
                    )}
                </div>

                <p className="mt-4 break-all text-center text-xs text-slate-500">
                    QR Code UID：{qrcodeUid}
                </p>
                <button
                    type="button"
                    onClick={()=>{navigate(`/game/${gameId}/${stage_id}`,{
                        state: {
                        stages,
                        },
                    });}}
                    className="mt-5 w-full rounded-md bg-[#966888] px-4 py-2.5 font-medium text-white hover:opacity-90"
                >   
                    QRCODE瀏覽
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full rounded-md bg-[#966888] px-4 py-2.5 font-medium text-white hover:opacity-90"
                >
                    完成
                </button>
            </div>
        </div>
    );
}
