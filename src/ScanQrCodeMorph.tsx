import qrCodeUrl from "../qr-code.svg?url"

export function ScanQrCodeMorph() {
  return (
    <div className="cluster h-29 w-70">
      <div className="gooey filter-(--filter-lift)">
        <div className="blob size-full rounded-3xl" />
      </div>
      <div className="relative flex size-full items-center justify-between gap-4 py-3.5 pr-3.5 pl-5 font-sans text-control">
        <p className="m-0 text-base leading-[1.12] font-semibold">
          Scan to
          <br />
          download
        </p>
        <img
          className="pointer-events-none block size-22 shrink-0 rounded-[1.25rem] object-contain"
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
