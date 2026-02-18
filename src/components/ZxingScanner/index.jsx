'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import styles from './index.module.scss'

// Ограничиваем форматы: только QR + Data Matrix — меньше попыток на кадр, быстрее срабатывает Data Matrix
const SCAN_HINTS = new Map([
	[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX]]
])
const TIME_BETWEEN_SCANS_MS = 150

// Точки в координатах исходного кадра (videoWidth x videoHeight)
function mapPointsToDisplay(points, sourceW, sourceH, displayW, displayH) {
	if (!points?.length || !sourceW || !sourceH) return []
	const scale = Math.max(displayW / sourceW, displayH / sourceH)
	const contentW = sourceW * scale
	const contentH = sourceH * scale
	const offsetX = (displayW - contentW) / 2
	const offsetY = (displayH - contentH) / 2
	return points.map(p => ({
		x: p.x * scale + offsetX,
		y: p.y * scale + offsetY
	}))
}

// Ограничивающий прямоугольник по точкам { x, y }[] (мин. размер чтобы линия/точка была видна)
const MIN_RECT = 20

function pointsToRect(points, displayW, displayH) {
	if (!points?.length) return null
	const xs = points.map(p => p.x)
	const ys = points.map(p => p.y)
	let x = Math.min(...xs)
	let y = Math.min(...ys)
	let width = Math.max(...xs) - x
	let height = Math.max(...ys) - y
	if (width < MIN_RECT) {
		x -= (MIN_RECT - width) / 2
		width = MIN_RECT
	}
	if (height < MIN_RECT) {
		y -= (MIN_RECT - height) / 2
		height = MIN_RECT
	}
	// не выходить за границы
	x = Math.max(0, Math.min(x, displayW - width))
	y = Math.max(0, Math.min(y, displayH - height))
	return { x, y, width, height }
}

const ZxingScanner = () => {
	const videoRef = useRef(null)
	const codeReaderRef = useRef(null)
	const [scannedText, setScannedText] = useState(null)
	const [error, setError] = useState(null)
	const [devices, setDevices] = useState([])
	const [selectedDeviceId, setSelectedDeviceId] = useState(null)
	const [isScanning, setIsScanning] = useState(false)
	const [cameraRequested, setCameraRequested] = useState(false)
	// Область просканированного кода: точки в координатах кадра + размер кадра
	const [scanRegion, setScanRegion] = useState(null)
	const [, setWindowSize] = useState({ w: 0, h: 0 })
	const scanRegionTimeoutRef = useRef(null)

	const startScanning = async (deviceId = null) => {
		if (!videoRef.current) return

		const codeReader = new BrowserMultiFormatReader(SCAN_HINTS, TIME_BETWEEN_SCANS_MS)
		codeReaderRef.current = codeReader

		try {
			setError(null)
			setIsScanning(true)
			setCameraRequested(true)
			await codeReader.decodeFromVideoDevice(
				deviceId,
				videoRef.current,
				(result, err) => {
					if (result) {
						setScannedText(result.getText())
						const points = result.getResultPoints()
						const video = videoRef.current
						if (video?.videoWidth) {
							if (scanRegionTimeoutRef.current) clearTimeout(scanRegionTimeoutRef.current)
							const hasPoints = points && points.length > 0
							setScanRegion({
								points: hasPoints
									? points.map(p => ({ x: p.getX(), y: p.getY() }))
									: null,
								sourceWidth: video.videoWidth,
								sourceHeight: video.videoHeight
							})
							scanRegionTimeoutRef.current = setTimeout(() => {
								setScanRegion(null)
								scanRegionTimeoutRef.current = null
							}, 100)
						}
					}
					if (err && !(err.name === 'NotFoundException')) {
						setError(err.message)
					}
				}
			)
		} catch (err) {
			setError(err?.message || 'Не удалось запустить камеру')
			setIsScanning(false)
		}
	}

	const stopScanning = () => {
		if (codeReaderRef.current) {
			codeReaderRef.current.stopContinuousDecode()
			codeReaderRef.current.reset()
			codeReaderRef.current = null
		}
		setIsScanning(false)
	}

	const loadVideoDevices = async () => {
		try {
			const codeReader = new BrowserMultiFormatReader()
			const videoInputDevices = await codeReader.listVideoInputDevices()
			setDevices(videoInputDevices)
		} catch (err) {
			// список камер может быть пустым до выдачи разрешения
		}
	}

	// Запуск камеры сразу с deviceId=null (камера по умолчанию), не ждём список устройств
	useEffect(() => {
		let cancelled = false
		const run = async () => {
			// даём ref и DOM примонтироваться (важно для Next.js / hydration)
			await new Promise(r => setTimeout(r, 200))
			if (cancelled || !videoRef.current) return
			await startScanning(null)
		}
		run()
		loadVideoDevices()
		return () => {
			cancelled = true
			if (scanRegionTimeoutRef.current) {
				clearTimeout(scanRegionTimeoutRef.current)
				scanRegionTimeoutRef.current = null
			}
			stopScanning()
		}
	}, [])

	// Пересчёт overlay при ресайзе окна
	useEffect(() => {
		const onResize = () => setWindowSize(s => ({ ...s, w: window.innerWidth, h: window.innerHeight }))
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [])

	// Смена камеры по выбору пользователя
	useEffect(() => {
		if (selectedDeviceId === null) return // начальный запуск уже через первый эффект
		if (!videoRef.current || codeReaderRef.current) return

		let cancelled = false
		const run = async () => {
			await new Promise(r => setTimeout(r, 50))
			if (cancelled || !videoRef.current) return
			await startScanning(selectedDeviceId)
		}
		run()
		return () => {
			cancelled = true
			stopScanning()
		}
	}, [selectedDeviceId])

	const switchCamera = (deviceId) => {
		stopScanning()
		setScannedText(null)
		setSelectedDeviceId(deviceId)
	}

	const resetScan = () => {
		if (scanRegionTimeoutRef.current) {
			clearTimeout(scanRegionTimeoutRef.current)
			scanRegionTimeoutRef.current = null
		}
		setScannedText(null)
		setScanRegion(null)
		setError(null)
	}

	return (
		<div className={styles.container}>
			<div className={styles.videoWrap}>
				<video
					ref={videoRef}
					className={styles.video}
					muted
					playsInline
					autoPlay
				/>
				{scanRegion && (() => {
					const video = videoRef.current
					if (!video) return null
					const w = video.offsetWidth || video.clientWidth
					const h = video.offsetHeight || video.clientHeight
					if (!w || !h) return null
					let rect
					if (scanRegion.points?.length) {
						const pts = mapPointsToDisplay(
							scanRegion.points,
							scanRegion.sourceWidth,
							scanRegion.sourceHeight,
							w,
							h
						)
						rect = pointsToRect(pts, w, h)
					}
					if (!rect) {
						// запасной вариант: центр экрана (когда библиотека не вернула точки)
						const size = Math.min(w, h) * 0.4
						rect = {
							x: (w - size) / 2,
							y: (h - size) / 2,
							width: size,
							height: size
						}
					}
					return (
						<svg
							className={styles.scanOverlay}
							viewBox={`0 0 ${w} ${h}`}
							preserveAspectRatio="none"
						>
							<rect
								x={rect.x}
								y={rect.y}
								width={rect.width}
								height={rect.height}
								fill="none"
								stroke="rgba(37, 122, 232, 0.9)"
								strokeWidth="3"
							/>
						</svg>
					)
				})()}
			</div>

			{devices.length > 1 && (
				<div className={styles.devices}>
					{devices.map((dev) => (
						<button
							key={dev.deviceId}
							type="button"
							className={styles.deviceBtn + (selectedDeviceId === dev.deviceId ? ' ' + styles.deviceBtnActive : '')}
							onClick={() => switchCamera(dev.deviceId)}
						>
							{dev.label || `Камера ${dev.deviceId.slice(0, 8)}`}
						</button>
					))}
				</div>
			)}

			{error && (
				<div className={styles.error}>
					{error}
				</div>
			)}

			{scannedText && (
				<div className={styles.result}>
					<div className={styles.resultLabel}>Содержимое:</div>
					<div className={styles.resultText}>{scannedText}</div>
					<button type="button" className={styles.resetBtn} onClick={resetScan}>
						Сканировать снова
					</button>
				</div>
			)}

			{!error && cameraRequested && !isScanning && !scannedText && (
				<div className={styles.hint}>Запуск камеры…</div>
			)}
			{isScanning && !scannedText && (
				<div className={styles.hint}>Наведите камеру на QR-код или штрихкод</div>
			)}
		</div>
	)
}

export default ZxingScanner
