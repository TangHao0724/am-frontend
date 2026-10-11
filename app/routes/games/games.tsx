import type { Route } from "./+types/games";
import { useParams } from "react-router";

export function meta({}:Route.MetaArgs) {
  return [
    { title: "遊戲列表" },
    { name: "遊戲列表", content: "這裡放置所有公開參加的遊戲，可以參加！" },
  ];
}


export default function Home() {
  const { gameId, stageId } = useParams();
  return <>
    這裡是遊戲列表拉幹
  </>;
}
