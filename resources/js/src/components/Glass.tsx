import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconLoader2, IconAlertTriangle, IconX } from '@tabler/icons-react';

interface DeleteModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const DeleteModal = ({
  isOpen,
  setIsOpen,
  onConfirm,
  title = 'Are you sure?',
  message = "You won't be able to revert this!",
  isLoading = false,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
}: DeleteModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[999]"
        onClose={() => !isLoading && setIsOpen(false)}
      >
        {/* Enhanced Backdrop with stronger blur and subtle animation */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-500"
          enterFrom="opacity-0 backdrop-blur-none"
          enterTo="opacity-100 backdrop-blur-md"
          leave="ease-in duration-300"
          leaveFrom="opacity-100 backdrop-blur-md"
          leaveTo="opacity-0 backdrop-blur-none"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-lg dark:bg-black/60 " />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-500"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white/30 backdrop-blur-3xl p-6 text-left align-middle shadow-2xl transition-all border border-white/30 dark:bg-gray-900/40 dark:border-gray-800/40 dark:backdrop-blur-3xl">
                {/* Liquid glass enhancements */}
                {/* Background gradient with shimmer */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-white/10 dark:from-gray-800/20 dark:via-transparent dark:to-gray-900/10 overflow-hidden">
                  <div className="absolute -inset-[20%] bg-gradient-to-r from-transparent via-white/5 to-transparent  dark:via-gray-500/5" />
                </div>
                {/* Refraction lines */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-gray-400/10" />
                  <div className="absolute bottom-0 right-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-gray-400/10" />
                </div>

                {/* Close button with glass effect */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 dark:bg-gray-800/10 dark:hover:bg-gray-800/20 border border-white/20 dark:border-gray-700/20"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>

                <div className="flex flex-col items-center relative z-10">
                  {/* Enhanced Icon with pulsing glow and stronger blur */}
                  <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100/60 backdrop-blur-md border border-red-200/40 shadow-lg dark:bg-red-900/40 dark:border-red-800/40 dark:shadow-red-900/20">
                    <IconAlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
                    <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-md animate-pulse dark:bg-red-800/20" />
                    <div className="absolute -inset-1 rounded-2xl bg-red-500/10 blur-lg animate-[pulse_2s_infinite] dark:bg-red-800/10" />
                  </div>

                  {/* Title with subtle glass text effect */}
                  <div className="mt-2 text-center">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100 bg-gradient-to-b from-current to-transparent bg-clip-text">
                      {title}
                    </Dialog.Title>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 dark:bg-gray-800/10 dark:border-gray-700/10">{message}</p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Buttons with liquid glass effects */}
                <div className="mt-6 flex justify-end gap-3 relative z-10">
                  <button
                    type="button"
                    className="group inline-flex justify-center rounded-xl border border-gray-200/40 bg-white/20 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-all disabled:opacity-50 dark:border-gray-700/40 dark:bg-gray-800/20 dark:text-gray-200 dark:hover:bg-gray-800/30 dark:focus-visible:ring-gray-400"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                  >
                    <span className="relative">{cancelButtonText}</span>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 dark:via-gray-500/10" />
                  </button>
                  <button
                    type="button"
                    className="group inline-flex items-center justify-center rounded-xl border border-red-300/40 bg-red-600/70 backdrop-blur-md px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-all disabled:opacity-50 dark:border-red-800/40 dark:bg-red-900/70 dark:hover:bg-red-800/70"
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <IconLoader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <span className="relative">{confirmButtonText}</span>
                    )}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 dark:via-gray-300/20" />
                    <div className="absolute inset-0 rounded-xl bg-red-500/10 blur-sm group-hover:bg-red-500/20 transition-colors dark:bg-red-800/10 dark:group-hover:bg-red-800/20" />
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteModal;


                                        {isDanger && (
                                            <div className="mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-rose-50/40 to-rose-50/20 border border-rose-200/30 backdrop-blur-sm dark:from-rose-900/20 dark:to-rose-900/10 dark:border-rose-800/30">
                                                <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                                                    ⚠️ This action cannot be undone
                                                </p>
                                            </div>
                                        )}



                                     --------------------------------   

                              {isPublic && (
                                                                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 transition-all">
                                                                              <div className="group relative overflow-hidden p-4 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50 dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-emerald-600/5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm hover:shadow-md transition-all duration-300">
                                                                                  {/* Subtle animated background gradient */}
                                                                                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                                                  
                                                                                  <div className="relative space-y-4">
                                                                                      {/* Header Section */}
                                                                                      <div className="flex items-center justify-between">
                                                                                          <div className="flex items-center gap-2">
                                                                                              <div className="relative">
                                                                                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                                                                                              </div>
                                                                                              <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                                                                                                  Link is Live
                                                                                              </span>
                                                                                          </div>
                              <div className="flex gap-2">
                                  {/* Telegram Share */}
                                  <a
                                      href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="
                                          inline-flex items-center gap-1.5
                                          px-3 py-1.5 rounded-lg text-[10px] font-bold
                                          bg-sky-600 text-white
                                          hover:bg-sky-700
                                          dark:bg-sky-500/20 dark:text-sky-400
                                          dark:hover:bg-sky-500/30
                                          border border-transparent dark:border-sky-500/30
                                          shadow-sm transition-all active:scale-95 
                              
                                      "
                                  >
                                      <IconBrandTelegram size={14} />
                                      <span>{tButton('share')}</span>
                                  </a>
                              
                                  {/* Preview */}
                                  <button
                                      onClick={() => window.open(shareUrl, '_blank')}
                                      className="
                                          inline-flex items-center gap-1.5
                                          px-3 py-1.5 rounded-lg text-[10px] font-bold
                                          bg-gray-100 text-gray-700
                                          hover:bg-gray-200
                                          dark:bg-white/5 dark:text-gray-300
                                          dark:hover:bg-white/10
                                          border border-gray-200 dark:border-white/10
                                          shadow-sm transition-all active:scale-95
                                      "
                                  >
                                      <IconExternalLink size={13} />
                                      <span>{tButton('preview')}</span>
                                  </button>
                              </div>
                              
                                                                                      </div>
                              
                                                                                      {/* URL Input Section */}
                                                                                      <div className="flex gap-2">
                                                                                          <div className="flex-1 relative group/input">
                                                                                              <input 
                                                                                                  readOnly 
                                                                                                  value={shareUrl} 
                                                                                                  className="w-full bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/50"
                                                                                                  onClick={(e) => e.currentTarget.select()}
                                                                                              />
                                                                                          </div>
                                                                                          <button 
                                                                                              onClick={handleShareAction}
                                                                                              disabled={isCopied}
                                                                                              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 shadow-sm active:scale-95  ${
                                                                                                  isCopied 
                                                                                                      ? 'bg-emerald-500 text-white scale-105' 
                                                                                                      : 'bg-primary/90 text-white hover:bg-primary '
                                                                                              }`}
                                                                                          >
                                                                                              {isCopied ? (
                                                                                                  <>
                                                                                                      <IconCheck size={16} className="animate-in zoom-in duration-200" />
                                                                                                      <span>{tButton('copied')}</span>
                                                                                                  </>
                                                                                              ) : (
                                                                                                  <>
                                                                                                      <IconCopy size={16} />
                                                                                                      <span>{tButton('copy')}</span>
                                                                                                  </>
                                                                                              )}
                                                                                          </button>
                                                                                      </div>
                              
                                                                                      {/* Footer Section */}
                                                                                      <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-500/20 flex justify-between items-center">
                                                                                          <div className="flex items-center gap-2">
                                                                                              <IconShieldLock size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                                                              <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium ">
                                                                                                  Rotate link if shared accidentally
                                                                                              </span>
                                                                                          </div>
                                                                                          <button 
                                                                                              onClick={() => openConfirm('regenerate')}
                                                                                              className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-200 hover:scale-105 active:scale-95 group/regen"
                                                                                          >
                                                                                              <IconRefresh size={13} className="group-hover/regen:rotate-180 transition-transform duration-500" />
                                                                                              <span>{tButton('regenerate')}</span>
                                                                                          </button>
                                                                                      </div>
                                                                                  </div>
                                                                              </div>
                                                                          </div>
                                                                      )}




                                                                         {hasToken && (
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:border-primary/30">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                                                            isPublic 
                                                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' 
                                                            : 'bg-gray-400'
                                                        }`} />
                                                        <span className="text-sm font-bold text-gray-800 dark:text-white transition-colors duration-300">
                                                            {isPublic ? 'Public Access Live' : 'Access Restricted'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider leading-none">
                                                        {isPublic ? 'Client can view link' : 'Link is currently deactivated'}
                                                    </p>
                                                </div>

                                                <label className="relative inline-flex items-center cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={isPublic} 
                                                        onChange={handleToggleShare} 
                                                        disabled={loading}
                                                    />
                                                    <div className={`
                                                        w-12 h-6 rounded-full border-2 border-transparent 
                                                        bg-gray-200 dark:bg-gray-700 
                                                        peer-checked:bg-primary 
                                                        transition-all duration-300 ease-in-out
                                                        after:content-[''] after:absolute after:top-[4px] after:left-[4px] 
                                                        after:bg-white after:rounded-full after:h-4 after:w-4 
                                                        after:shadow-md after:transition-all after:duration-300 
                                                        peer-checked:after:translate-x-6 
                                                        group-hover:after:scale-110
                                                    `}></div>
                                                </label>
                                            </div>
                                        )}


                                        {isPublic && (
    <div className="space-y-4">
        <button 
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-300 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <IconQrcode size={18} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">
                                {showQR ? tSpan('hide') : tSpan('show')} {tSpan('instant_qr_code')}
                            </span>
                            <span className="text-[9px] text-gray-500 font-medium">
                                {showQR ? 'Collapse this section' : 'Scan to preview on mobile'}
                            </span>
                        </div>
                    </div>
                    {/* Smooth icon rotation */}
                    <motion.div 
                        animate={{ rotate: showQR ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-primary"
                    >
                        <IconChevronDown size={18} />
                    </motion.div>
                </button>

        {/* Expandable QR Section */}
        <AnimatePresence>
            {showQR && (
                
                <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.95 }}
                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                    className="overflow-hidden"
                >
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-4">
                        <IconQrcode size={18} className="text-primary" />
                        <span className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                            Instant Preview QR
                        </span>
                    </div>

                    <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 group hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <QRCodeSVG 
                            value={shareUrl} 
                            size={256} 
                            level="H" 
                            includeMargin={true}
                            className="w-[140px] h-[140px]" 
                        />
                    </div>
                    
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium px-4 leading-relaxed">
                        Clients can scan this to view their history live on their mobile devices.
                    </p>

                    <div className="flex w-full gap-3 mt-5">
                        {/* Primary Telegram Share */}
                        <button
                            onClick={handleShareToTelegram}
                            className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold border text-sky-700 bg-sky-100 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20 hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-all duration-200 active:scale-95"
                        >
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-200/60 dark:bg-sky-500/20">
                                <IconBrandTelegram size={16} />
                            </span>
                            {tButton('share')}
                        </button>

                        {/* Secondary Download */}
                        <button
                            onClick={handleDownloadQR}
                            className="flex-1 flex items-center justify-center px-2 py-2 rounded-xl text-xs font-semibold border text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-white/5 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
                        >
                            {tButton('download')}
                        </button>
                    </div>
                </div>
                </motion.div>

            )}
        </AnimatePresence>

    </div>
)}

{/* ACTIVITY TIMELINE SECTION */}
{isPublic && (
<div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg text-indigo-500 bg-indigo-50 border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                        <IconHistory size={18} className='text-' />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-white">
                            {tSpan('access_history')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                            {viewCount} {tSpan('total_views')}
                        </span>
                    </div>
                </div>

                {/* Reset Button moved here for a cleaner look */}
                {history && history.length > 0 && (
                <button 
                    onClick={() => openConfirm('reset')}
                    className="text-[10px] font-bold text-gray-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                    {tButton('reset_log')}
                </button>
                )}
            </div>
       

   
    {history && history.length > 0 ? (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent dark:before:from-gray-700 dark:before:via-gray-800">
        {history.map((log: any, index: number) => (
            <div key={log.id || index} className="relative flex items-center gap-4 group">
                {/* Pulsating dot for the very latest scan, static for others */}
                <div className={`absolute left-4 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10 
                    ${index === 0 ? 'bg-primary animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} 
                />

                <div className="ml-10 flex-1 bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary/30 transition-all duration-300">
                    <div className="flex flex-col gap-1.5">
                        {/* Header: localized time using your existing utility */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary">
                                {formatNotificationTime(log.accessed_at, t, i18n )}
                            </span>
                            <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase">
                                {log.device === 'Mobile' ? <IconDeviceMobile size={10} /> : <IconDeviceDesktop size={10} />}
                                {log.device}
                            </div>
                        </div>

                        {/* Location Context */}
                        <div className="flex items-center gap-2">
                            <IconMapPin size={12} className={log.location?.includes('GPS') ? "text-emerald-500" : "text-rose-500"} />
                            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate">
                                {log.location || 'Unknown Location'}
                            </span>
                        </div>

                        {/* Precise Map Link - FIXED URL STRUCTURE */}
                        {log.lat && log.lng && (
                            <a 
                                href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-1 w-fit mt-0.5"
                            >
                                <IconExternalLink size={10} /> 
                                {t('link.view_exact_location')}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        ))}
        </div>
    ) : (
        /* Empty State */
        <div className="py-10 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                No recorded yet
            </p>
        </div>
    )}
</div>
)}