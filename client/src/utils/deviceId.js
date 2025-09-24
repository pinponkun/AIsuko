// デバイス固有IDを生成・取得するユーティリティ

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');

  if (!deviceId) {
    // デバイスIDが存在しない場合は新規作成
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }

  return deviceId;
};

const generateDeviceId = () => {
  // ランダムな文字列を生成（UUIDっぽい形式）
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
};
