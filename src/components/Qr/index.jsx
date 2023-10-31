import React, { useEffect, useState } from 'react'
import QrReader from 'react-qr-scanner'
import styles from './index.module.scss'
import Image from 'next/image'
import galleryIcon from '../../assets/img/gallery.svg'
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

	const handleScan = e => {
		if (e?.text && !Object.keys(data || {}).length) {
			setData(e)
		}
	}

	const refresh = () => {
		setData({})
	}

	const handleError = err => {
		console.error(err)
	}

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
				setDevices({
					cameraId: devices[0].deviceId,
					devices,
					loading: false,
				})
			})
	}, [])

	const changeCamera = cameraId => {
		setDevices({
			...devices,
			cameraId,
		})
	}

	console.log(data)

	const getUserData = element => {
		setUserData({
			...userData,
			userName: element,
		})
	}

	return (
		<div className={styles.container_btn}>
			<div className={styles['btn_footer']}>
				<div>
					{/* <input
						className={styles['input_gallery']}
						type='file'
						accept='image/*'
					/> */}
					<button type='button' className={styles['btn_gallery']}>
						<Image
							src={galleryIcon}
							height={36}
							width={36}
							priority={false}
							alt='Gallery'
						/>
					</button>
				</div>
				<button className={styles['btn_refresh']} onClick={refresh}>
					Refresh
				</button>
				<button className={styles['btn_flashlight']}>
					<Image
						src={lightningIcon}
						height={36}
						width={36}
						priority={false}
						alt='Flashlight'
					/>
				</button>
			</div>

			<div className={styles['btn_header']}>
				<div className={styles['devices']}>
					{devices?.devices?.map(dev => (
						<button
							onClick={() => changeCamera(dev.deviceId)}
							className={styles['btn_device']}
						>
							{dev.label}
						</button>
					))}
				</div>
				<button className={styles['btn_cross']}>
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
