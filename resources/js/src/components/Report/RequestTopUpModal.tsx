import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';

interface RequestTopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RequestTopUpModal = ({ isOpen, onClose }: RequestTopUpModalProps) => {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<number | ''>(50); // Default amount

    const handleRequest = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            await api.post('/top-up-requests', { amount });
            toast.success('Request sent! An admin will review it shortly.');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-75" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                                >
                                    Insufficient Balance
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Your workspace has run out of tokens. You can request a top-up from the administrator.
                                    </p>
                                </div>

                                <div className="mt-4">
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Requested Amount
                                    </label>
                                    <input
                                        type="number"
                                        id="amount"
                                        className="form-input mt-1 block w-full"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        min="1"
                                    />
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleRequest}
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending...' : 'Request Top-Up'}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default RequestTopUpModal;
