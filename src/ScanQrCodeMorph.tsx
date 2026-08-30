import qrCodeUrl from "../qr-code.svg?url"

export function ScanQrCodeMorph() {
  return (
    <div className="cluster scan-scene">
      <div className="gooey gooey-flat">
        <div className="blob" />
      </div>
      <div className="scan-card">
        <p className="scan-copy">
          Scan to
          <br />
          download
        </p>
        <img
          className="scan-qr"
          src={qrCodeUrl}
          alt=""
          width={88}
          height={88}
          draggable={false}
        />
      </div>
    </div>
  )
}
