import React, { useEffect, useState } from "react";
import QrReader from "react-qr-scanner";
import styles from "./index.module.scss";

const Qr = () => {
    const [data, setData] = useState({});

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

    console.log(styles);

    return (
        <div>
            <button className={styles["btn"]} onClick={refresh}>Refresh</button>
            {!Object.keys(data || {}).length ? (
                <QrReader
                    className={styles["scanner"]}
                    onScan={handleScan}
                    onError={handleError}
                />
            ) : null}

            {data.text ? (
                <iframe width="560" height="315" src={data.text} />
            ) : null}
        </div>
    )
};

export default Qr;
