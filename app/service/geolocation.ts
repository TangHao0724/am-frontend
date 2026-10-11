
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
                    point.coords.longitude
                ]);
            },
            (error) => {
                reject(error);
            }
        );
    });
}