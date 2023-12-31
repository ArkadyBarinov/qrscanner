import React, { useEffect, useState } from 'react'
import QrReader from 'react-qr-scanner'
import Image from 'next/image'
import styles from './index.module.scss'
import { ScrollContainer } from 'react-indiana-drag-scroll'
import 'react-indiana-drag-scroll/dist/style.css'
import lightningIcon from '../../assets/img/lightning.svg'
import crossIcon from '../../assets/img/cross.svg'

const Qr = () => {
	const [dontShow, setDontShow] = useState(true)
	const [data, setData] = useState({})
	const [userData, setUserData] = useState({
		userName: '',
		phone: '',
	})
	const [devices, setDevices] = useState({})

	const [currentCameraId, setCurrentCameraId] = useState()

	const [qrReaderVisible, setQrReaderVisible] = useState(true)

	const [flashOn, setFlashOn] = useState(false)

	const handleScan = e => {
		if (e?.text && !Object.keys(data || {}).length) {
			setData(e)
		}
	}

	const refresh = () => {
		changeCamera(currentCameraId)
		console.log(currentCameraId)
	}

	const handleError = err => {
		console.error(err)
	}

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true }).then(() => {
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
					setCurrentCameraId(devices[1].deviceId)
					setDevices({
						cameraId: devices[1].deviceId,
						devices,
						loading: false,
					})
				})
			const vh = window.innerHeight * 0.01
			document.documentElement.style.setProperty('--vh', `${vh}px`)
			setDontShow(false)
		})
	}, [])

	const changeCamera = cameraId => {
		setData({})
		setCurrentCameraId(cameraId)
		setQrReaderVisible(false)
		setTimeout(() => {
			setQrReaderVisible(true)
			setDevices({
				...devices,
				cameraId,
			})
		}, 100)
	}

	const getUserData = element => {
		setUserData({
			...userData,
			userName: element,
		})
	}

	const toggleTorch = () => {
		navigator.mediaDevices
			.getUserMedia({ video: { deviceId: { exact: currentCameraId } } })
			.then(devices => {
				const track = devices.getVideoTracks()[0]
				console.log(track)
				console.log(track.getCapabilities())
				if (track.getCapabilities().torch) {
					if (flashOn) {
						track.applyConstraints({ advanced: [{ torch: false }] })
						setFlashOn(false)
					} else {
						track.applyConstraints({ advanced: [{ torch: true }] })
						setFlashOn(true)
					}
				}
			})
	}

	if (dontShow) return null

	return (
		<div className={styles['btn_container']}>
			<div className={styles['btn_footer']}>
				<button className={styles['btn_refresh']} onClick={refresh}>
					Refresh
				</button>
				<button className={styles['btn_transparent']} onClick={toggleTorch}>
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
			{!Object.keys(data || {}).length && qrReaderVisible ? (
				<QrReader
					className={styles['scanner']}
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
				<div className={styles.content}>
					{/http/.test(data.text) ? <iframe src={data.text} /> : data.text}
				</div>
			) : null}
		</div>
	)
}

export default Qr
