import React, { useEffect, useState } from 'react'
// import QrReader from 'react-qr-scanner'
import { QrReader } from 'react-qr-reader'
import Image from 'next/image'
import styles from './index.module.scss'
import { ScrollContainer } from 'react-indiana-drag-scroll'
import 'react-indiana-drag-scroll/dist/style.css'
import lightningIcon from '../../assets/img/lightning.svg'
import crossIcon from '../../assets/img/cross.svg'

const Qr = () => {
	const [data, setData] = useState({})
	const [userData, setUserData] = useState({
		userName: '',
		phone: '',
	})
	const [devices, setDevices] = useState({
		facingMode: 'environment',
	})

	const [currentCameraId, setCurrentCameraId] = useState()
	const [delayScan, setDelayScan] = useState(500)

	const handleScan = e => {
		if (e?.text && !Object.keys(data || {}).length) {
			setData(e)
			setDelayScan(false)
		}
	}

	const refresh = () => {
		setData({})
		changeCamera(currentCameraId)
		console.log(currentCameraId)
	}

	const handleError = err => {
		console.error(err)
	}

	// после того как отсканировал, то при нажатии на refreh и переключении камеры больше не сканируется
	useEffect(() => {
		const a = 'enumerateDevices'
		navigator['mediaDevices']
			[a]()
			.then(devices => {
				const videoSelect = []
				devices.forEach(device => {
					if (device.kind === 'videoinput') {
						videoSelect.push(device)
					}
				})
				return videoSelect
			})
			.then(devices => {
				setCurrentCameraId(devices[0].deviceId)
				console.log(devices[0].deviceId)
				setDevices({
					cameraId: devices[0].deviceId,
					devices,
					loading: false,
				})
			})
	}, [])

	const changeCamera = cameraId => {
		setData({})
		setCurrentCameraId(cameraId)
		setDevices({
			...devices,
			cameraId,
		})
		console.log(cameraId)
	}

	console.log(data)

	const getUserData = element => {
		setUserData({
			...userData,
			userName: element,
		})
	}

	return (
		<div className={styles['btn_container']}>
			<div className={styles['btn_footer']}>
				<button className={styles['btn_refresh']} onClick={refresh}>
					Refresh
				</button>
				<button className={styles['btn_transparent']}>
					<Image
						src={lightningIcon}
						height={36}
						width={36}
						priority={true}
						alt='Flashlight'
					/>
				</button>
			</div>
			<div className={styles['btn_header']}>
				<ScrollContainer className={styles['devices']}>
					{devices?.devices?.map(dev => (
						<button
							onClick={() => changeCamera(dev.deviceId)}
							className={styles['btn_device']}
							key={dev.deviceId}
						>
							{dev.label}
						</button>
					))}
				</ScrollContainer>
				<button className={styles['btn_transparent']}>
					<Image
						src={crossIcon}
						height={36}
						width={36}
						priority={false}
						alt='Cross'
					/>
				</button>
			</div>
			{!Object.keys(data || {}).length ? (
				// 	<QrReader
				// 		className={styles['scanner']}
				// 		onScan={handleScan}
				// 		delay={500}
				// 		onError={handleError}
				// 		constraints={
				// 			devices.cameraId && {
				// 				audio: false,
				// 				video: { deviceId: devices.cameraId },
				// 			}
				// 		}
				// 	/>
				// ) : null}
				<QrReader
					className={styles['scanner']}
					style='position: fixed; top: 0; bottom: 0;left: 0;	right: 0;	width: 100%;	height: 100vh; object-fit: cover;	z-index: -1'
					scanDelay={delayScan}
					onResult={handleScan}
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
				<div className={styles.content}>
					{/http/.test(data.text) ? <iframe src={data.text} /> : data.text}
				</div>
			) : null}
		</div>
	)
}

export default Qr
