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

