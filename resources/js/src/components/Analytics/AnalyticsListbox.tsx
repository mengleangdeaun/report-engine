import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';

export interface ListboxOption {
    value: string | number;
    label: string;
}

interface AnalyticsListboxProps {
    value: string | number;
    onChange: (value: any) => void;
    options: ListboxOption[];
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
    label?: string;
}

const AnalyticsListbox = ({
    value,
    onChange,
    options,
    icon: Icon,
    className = "",
    label
}: AnalyticsListboxProps) => {
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">
                    {label}
                </label>
            )
            }
            <Listbox value={value} onChange={onChange}>
                <div className="relative">
                    <Listbox.Button className="relative w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-4 pr-10 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all group hover:border-gray-300 dark:hover:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            {Icon && <Icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />}
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {selectedOption?.label}
                            </span>
                        </div>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <IconChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-2xl max-h-64 overflow-auto focus:outline-none p-1.5 backdrop-blur-xl">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    value={option.value}
                                    className={({ active }) =>
                                        `cursor-pointer select-none relative px-4 py-3 rounded-md text-sm transition-all mb-1 last:mb-0 ${active ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 dark:text-gray-300'
                                        }`
                                    }
                                >
                                    {({ selected }) => (
                                        <div className="flex items-center justify-between">
                                            <span className={`block truncate ${selected ? 'font-black' : 'font-medium'}`}>{option.label}</span>
                                            {selected && (
                                                <IconCheck className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
};

export default AnalyticsListbox;
