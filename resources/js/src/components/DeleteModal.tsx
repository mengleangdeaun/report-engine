import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconLoader2, IconX } from '@tabler/icons-react';

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
  title = 'Confirm Deletion',
  message = "This action cannot be undone. Are you sure you want to proceed?",
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
        {/* Enhanced Liquid Glass Backdrop */}
        <Transition.Child
                 as={Fragment}
                    enter="ease-out duration-500"
                    enterFrom="opacity-0 backdrop-blur-0"
                    enterTo="opacity-100 backdrop-blur-xl"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100 backdrop-blur-xl"
                    leaveTo="opacity-0 backdrop-blur-0"
        >
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900/40 via-gray-800/30 to-black/20 backdrop-blur-xl dark:from-gray-950/60 dark:via-gray-900/40 dark:to-black/50" />
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
              <Dialog.Panel className="relative w-full max-w-md transition-all">
                {/* Liquid Glass Background */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/70 via-white/40 to-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-black/10 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/20 dark:border-white/20" />
                
                {/* Subtle Gradient Border */}
                <div className="absolute inset-0 rounded-3xl p-px bg-gradient-to-br from-transparent via-gray-200/30 to-transparent dark:via-gray-700/30 pointer-events-none" />

                <div className="relative rounded-3xl bg-gradient-to-b from-white/20 to-white/10 p-8 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] dark:from-gray-800/30 dark:to-gray-900/30 dark:border-white/10 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                {/* Close Button */}
                <button
                  type="button"
                  className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30 hover:text-gray-900 dark:bg-gray-800/30 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:text-gray-100 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>

                <div className="relative">
                  {/* Warning Icon Container */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {/* Outer Glow */}
                      <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                      
                      {/* Icon Container */}
                      <div className="relative p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50/80 backdrop-blur-xl border border-red-200/50 shadow-lg dark:from-red-900/20 dark:to-rose-900/10 dark:border-red-800/30">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          {/* Animated Ring */}
                          <div className="absolute inset-0 border-2 border-red-300/50 rounded-full animate-spin-slow [animation-duration:3s] dark:border-red-600/30" />
                          
                          {/* Warning Icon */}
                          <svg 
                            className="w-10 h-10 text-red-600 dark:text-red-400 drop-shadow-sm" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                           
<path d="M3 6.38597C3 5.90152 3.34538 5.50879 3.77143 5.50879L6.43567 5.50832C6.96502 5.49306 7.43202 5.11033 7.61214 4.54412C7.61688 4.52923 7.62232 4.51087 7.64185 4.44424L7.75665 4.05256C7.8269 3.81241 7.8881 3.60318 7.97375 3.41617C8.31209 2.67736 8.93808 2.16432 9.66147 2.03297C9.84457 1.99972 10.0385 1.99986 10.2611 2.00002H13.7391C13.9617 1.99986 14.1556 1.99972 14.3387 2.03297C15.0621 2.16432 15.6881 2.67736 16.0264 3.41617C16.1121 3.60318 16.1733 3.81241 16.2435 4.05256L16.3583 4.44424C16.3778 4.51087 16.3833 4.52923 16.388 4.54412C16.5682 5.11033 17.1278 5.49353 17.6571 5.50879H20.2286C20.6546 5.50879 21 5.90152 21 6.38597C21 6.87043 20.6546 7.26316 20.2286 7.26316H3.77143C3.34538 7.26316 3 6.87043 3 6.38597Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9.42543 11.4815C9.83759 11.4381 10.2051 11.7547 10.2463 12.1885L10.7463 17.4517C10.7875 17.8855 10.4868 18.2724 10.0747 18.3158C9.66253 18.3592 9.29499 18.0426 9.25378 17.6088L8.75378 12.3456C8.71256 11.9118 9.01327 11.5249 9.42543 11.4815Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.5747 11.4815C14.9868 11.5249 15.2875 11.9118 15.2463 12.3456L14.7463 17.6088C14.7051 18.0426 14.3376 18.3592 13.9254 18.3158C13.5133 18.2724 13.2126 17.8855 13.2538 17.4517L13.7538 12.1885C13.795 11.7547 14.1625 11.4381 14.5747 11.4815Z" fill="currentColor"/>
<path opacity="0.5" d="M11.5956 22.0006H12.4044C15.1871 22.0006 16.5785 22.0006 17.4831 21.1147C18.3878 20.2288 18.4803 18.7755 18.6654 15.8691L18.9321 11.6812C19.0326 10.1042 19.0828 9.31573 18.6289 8.81607C18.1751 8.31641 17.4087 8.31641 15.876 8.31641H8.12405C6.59127 8.31641 5.82488 8.31641 5.37105 8.81607C4.91722 9.31573 4.96744 10.1042 5.06788 11.6812L5.33459 15.8691C5.5197 18.7755 5.61225 20.2288 6.51689 21.1147C7.42153 22.0006 8.81289 22.0006 11.5956 22.0006Z" fill="currentColor"/>


                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center space-y-4">
                    <Dialog.Title 
                      as="h3" 
                      className="text-xl font-semibold leading-7 text-gray-900 dark:text-white tracking-tight"
                    >
                      {title}
                    </Dialog.Title>
                    
                    <div className="px-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-300/50 bg-white/30 backdrop-blur-sm text-gray-700 hover:bg-white/50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600/50 dark:bg-gray-800/30 dark:text-gray-300 dark:hover:bg-gray-700/40 dark:hover:text-gray-100 dark:focus-visible:ring-gray-400/50"
                      onClick={() => setIsOpen(false)}
                      disabled={isLoading}
                    >
                      <span className="font-medium">{cancelButtonText}</span>
                    </button>
                    
                    <button
                      type="button"
                      className="flex-1 relative py-3 px-4 rounded-xl border border-red-400/50 bg-gradient-to-r from-red-600/90 to-rose-600/90 backdrop-blur-sm text-white hover:from-red-700 hover:to-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-1 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group dark:from-red-700/90 dark:to-rose-700/90 dark:border-red-500/30 dark:hover:from-red-800 dark:hover:to-rose-800"
                      onClick={onConfirm}
                      disabled={isLoading}
                    >
                      {/* Button Hover Effect */}
                      
                      <span className="relative flex items-center justify-center gap-2 font-medium">
                        {isLoading ? (
                          <>
                            <IconLoader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          confirmButtonText
                        )}
                      </span>
                    </button>
                  </div>
                </div>
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