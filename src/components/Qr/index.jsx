import React, { useEffect, useState } from "react";
import QrReader from "react-qr-scanner";
import styles from "./index.module.scss";

const Qr = () => {
  const [data, setData] = useState({});
  const [devices, setDevices] = useState({
    facingMode: "environment",
  });

  const handleScan = (e) => {
    if (e?.text && !Object.keys(data || {}).length) {
      setData(e);
    }
  };

  const refresh = () => {
    setData({});
  };

  const handleError = (err) => {
    console.error(err);
  };

  useEffect(() => {
    const a = "enumerateDevices";
    navigator["mediaDevices"]
      [a]()
      .then((devices) => {
        const videoSelect = [];
        devices.forEach((device) => {
          if (device.kind === "videoinput") {
            videoSelect.push(device);
          }
        });
        return videoSelect;
      })
      .then((devices) => {
        setDevices({
          cameraId: devices[0].deviceId,
          devices,
          loading: false,
        });
      });
  }, []);

  const changeCamera = (cameraId) => {
    setDevices({
      ...devices,
      cameraId,
    });
  };

  return (
    <div className={styles.container_btn}>
      <button className={styles["btn_refresh"]} onClick={refresh}>
        Refresh
      </button>
      <div className={styles["devices"]}>
        {devices?.devices?.map((dev) => (
          <button
            onClick={() => changeCamera(dev.deviceId)}
            className={styles["btn_device"]}
          >
            {dev.label}
          </button>
        ))}
      </div>
      {!Object.keys(data || {}).length ? (
        <QrReader
          className={styles["scanner"]}
          onScan={handleScan}
          delay={500}
          onError={handleError}
          constraints={
            devices.cameraId && {
              audio: false,
              video: { deviceId: devices.cameraId },
            }
          }
        />
      ) : null}

      {data.text ? (
        <div className={styles.content} width="560" height="315">
          {data.text}
        </div>
      ) : null}
      {/*<iframe width="560" height="315" src={data.text} /> */}
    </div>
  );
};

export default Qr;
