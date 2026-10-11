import { type RouteConfig, index,route} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("welecome","routes/welecome/welecome.tsx"),
    route("user","routes/user/user.tsx"),
    route("create","routes/create/create.tsx"),
    route("games","routes/games/games.tsx"),
    route("game/:gameId/:startStageId","routes/game/game.tsx")
] satisfies RouteConfig;
