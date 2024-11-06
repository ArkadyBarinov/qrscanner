import React from 'react'
import dynamic from 'next/dynamic'

const Scanner = dynamic(() => import('../components/Qr'), { ssr: false })

export default function Home() {
	return (
		<div>
			<div style={{ height: "100vh" }}>
			<iframe
				src="https://framer.sas-media.ru/1main.html"
				// src={"http://localhost:3001/1main.html"}
				// src={"https://lumalabs.ai/embed/3028ec67-08cf-4795-9048-758e71d7328c?mode=sparkles&background=%23ffffff&color=%23000000&showTitle=true&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=undefined&showMenu=false"}
				width="100%"
				height="100%"
				title="luma embed"
				style={{ border: "none" }}
			></iframe>
			</div>
		</div>
	)
}
