import { Link } from "react-router";

const routes = [
{ label: "首頁", path: "/" },
{ label: "Welcome", path: "/welecome" },
{ label: "Welcome（指定遊戲）", path: "/welecome/1" },
{ label: "User", path: "/user/1" },
{ label: "建立遊戲", path: "/create" },
{ label: "遊戲列表", path: "/games" },
{ label: "Game（關卡測試）", path: "/game/1/1" },
];

export default function Home() {
    return (
    <main className="min-h-screen bg-slate-50 p-6">
    <h1 className="mb-6 text-2xl font-bold text-slate-800">
    AquaMarina 開發索引
    </h1>
            <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map((route) => (
                    <Link
                        key={route.path}
                        to={route.path}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        <span className="font-medium">{route.label}</span>
                        <p className="mt-1 break-all text-sm text-slate-400">
                            {route.path}
                        </p>
                    </Link>
                ))}
            </nav>
        </main>
    );

}