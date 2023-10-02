import React from "react";
import dynamic from 'next/dynamic'

const Scanner = dynamic(() => import("../components/Qr"), { ssr: false });

export default function Home() {
    return (
        <div>
            <Scanner />
        </div>
    )
}
