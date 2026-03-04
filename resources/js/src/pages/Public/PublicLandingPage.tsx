import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useReducer,
    lazy,
    Suspense,
} from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { toggleTheme, setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { THEME_COLORS } from '../../constants/themeColors';
import { Button } from '../../components/ui/button';
import {
    IconSun,
    IconMoon,
    IconArrowRight,
    IconX,
    IconMail,
    IconPhone,
    IconMapPin,
    IconBrandFacebook,
    IconBrandTwitter,
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandYoutube,
    IconChevronDown,
    IconStar,
    IconMenu2,
} from '@tabler/icons-react';
import * as TablerIcons from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import { ScrollArea } from '../../components/ui/scroll-area';

// ------------------ Types ------------------
interface LandingPageConfig {
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    googleMapLink: string;
    fontFamily: string;
    themeColors: { primary: string; secondary: string; accent: string };
    sectionOrder: { id: string; name: string; enabled: boolean }[];
    logoUrl: string;
    faviconUrl: string;
    header: {
        style: string;
        enabled: boolean;
        bgColor: string;
        textColor: string;
        buttonStyle: string;
        menuItems?: { name: string; link: string; enabled: boolean }[];
    };
    hero: {
        layout: string;
        enabled: boolean;
        style: string;
        height: string;
        title: string;
        subtitle: string;
        badge: string;
        primaryBtnText: string;
        primaryBtnLink: string;
        primaryBtnEnabled: boolean;
        secondaryBtnText: string;
        secondaryBtnLink: string;
        secondaryBtnEnabled: boolean;
        imageUrl: string;
        imagePos: string;
        bgColor: string;
        textColor: string;
        bgOverlay: boolean;
        overlayColor: string;
    };
    footer: {
        enabled: boolean;
        content: string;
        description: string;
        socialLinks: { icon: string; url: string; name?: string }[];
        footerLinks: { text: string; url: string }[];
    };
    features: {
        enabled: boolean;
        layout: string;
        style: string;
        columns: string;
        title: string;
        description: string;
        displayIcon: boolean;
        bgColor: string;
        imageUrl: string;
        boxes: { title: string; description: string; icon: string }[];
    };
    screenshots: {
        enabled: boolean;
        title: string;
        subtitle: string;
        gallery: { url: string; title: string; description: string; altText: string }[];
    };
    whyUs: {
        enabled: boolean;
        title: string;
        subtitle: string;
        reasons: { icon: string; title: string; description: string }[];
        ctaTitle: string;
        ctaSubtitle: string;
    };
    about: {
        enabled: boolean;
        layout: string;
        style: string;
        imagePos: string;
        title: string;
        description: string;
        storyTitle: string;
        storyContent: string;
        imageUrl: string;
        bgColor: string;
        parallax: boolean;
    };
    reviews: {
        enabled: boolean;
        title: string;
        subtitle: string;
        testimonials: {
            name: string;
            role: string;
            company: string;
            rating: number;
            content: string;
        }[];
    };
    faq: {
        enabled: boolean;
        title: string;
        subtitle: string;
        ctaText: string;
        btnText: string;
        btnUrl: string;
        items: { question: string; answer: string }[];
    };
    contact: {
        enabled: boolean;
        title: string;
        subtitle: string;
        formTitle: string;
        infoTitle: string;
        infoDescription: string;
    };
    termsOfService: string;
    privacyPolicy: string;
}

const defaultConfig: LandingPageConfig = {
    companyName: 'Report Maker',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    googleMapLink: '',
    fontFamily: 'Nunito, sans-serif',
    themeColors: { primary: 'blue', secondary: 'purple', accent: 'cyan' },
    sectionOrder: [
        { id: 'hero', name: 'Hero', enabled: true },
        { id: 'features', name: 'Features', enabled: true },
        { id: 'about', name: 'About', enabled: false },
        { id: 'whyUs', name: 'Why Us', enabled: false },
        { id: 'screenshots', name: 'Gallery/Platform Overview', enabled: false },
        { id: 'reviews', name: 'Reviews', enabled: false },
        { id: 'faq', name: 'FAQ', enabled: false },
        { id: 'contact', name: 'Contact', enabled: false },
    ],
    logoUrl: '',
    faviconUrl: '',
    header: {
        style: 'transparent',
        enabled: true,
        bgColor: '#ffffff',
        textColor: '#000000',
        buttonStyle: 'solid',
        menuItems: [
            { name: 'Features', link: '#features', enabled: true },
            { name: 'Pricing', link: '#pricing', enabled: true },
            { name: 'About', link: '#about', enabled: true },
            { name: 'Contact', link: '#contact', enabled: true },
        ],
    },
    hero: {
        layout: 'contentCenter',
        enabled: true,
        style: 'default',
        height: '100vh',
        title: 'Welcome',
        subtitle: '',
        badge: '',
        primaryBtnText: 'Get Started',
        primaryBtnLink: '/auth/boxed-signup',
        primaryBtnEnabled: true,
        secondaryBtnText: 'Learn More',
        secondaryBtnLink: '#features',
        secondaryBtnEnabled: true,
        imageUrl: '',
        imagePos: 'right',
        bgColor: '#ffffff',
        textColor: '#000000',
        bgOverlay: false,
        overlayColor: 'rgba(0,0,0,0.5)',
    },
    footer: {
        enabled: true,
        content: '',
        description: '',
        socialLinks: [],
        footerLinks: [],
    },
    features: {
        enabled: true,
        layout: 'grid',
        style: 'default',
        columns: '3',
        title: 'Features',
        description: '',
        displayIcon: true,
        bgColor: '#f8fafc',
        imageUrl: '',
        boxes: [],
    },
    screenshots: {
        enabled: false,
        title: '',
        subtitle: '',
        gallery: [],
    },
    whyUs: {
        enabled: false,
        title: '',
        subtitle: '',
        reasons: [],
        ctaTitle: '',
        ctaSubtitle: '',
    },
    about: {
        enabled: false,
        layout: 'contentLeft',
        style: 'default',
        imagePos: 'right',
        title: '',
        description: '',
        storyTitle: '',
        storyContent: '',
        imageUrl: '',
        bgColor: '#ffffff',
        parallax: false,
    },
    reviews: {
        enabled: false,
        title: '',
        subtitle: '',
        testimonials: [],
    },
    faq: {
        enabled: false,
        title: '',
        subtitle: '',
        ctaText: '',
        btnText: '',
        btnUrl: '',
        items: [],
    },
    contact: {
        enabled: false,
        title: '',
        subtitle: '',
        formTitle: '',
        infoTitle: '',
        infoDescription: '',
    },
    termsOfService: '',
    privacyPolicy: '',
};

// ------------------ Utility Functions ------------------
const renderIcon = (iconName: string, className?: string) => {
    if (!iconName)
        return <TablerIcons.IconCircle className={className || 'w-6 h-6'} />;
    let name = iconName.startsWith('Icon')
        ? iconName
        : `Icon${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`;
    name = name.replace(/-./g, (x) => x[1].toUpperCase());
    const IconComponent = (TablerIcons as any)[name];
    if (IconComponent)
        return <IconComponent className={className || 'w-6 h-6'} />;
    return <TablerIcons.IconCircle className={className || 'w-6 h-6'} />;
};

const updateFavicon = (url: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = url;
};

const getSocialIcon = (platform?: string) => {
    if (!platform) return <IconArrowRight className="w-5 h-5" />;
    const p = platform.toLowerCase();
    if (p.includes('facebook')) return <IconBrandFacebook className="w-5 h-5" />;
    if (p.includes('twitter')) return <IconBrandTwitter className="w-5 h-5" />;
    if (p.includes('instagram')) return <IconBrandInstagram className="w-5 h-5" />;
    if (p.includes('linkedin')) return <IconBrandLinkedin className="w-5 h-5" />;
    if (p.includes('youtube')) return <IconBrandYoutube className="w-5 h-5" />;
    return <IconArrowRight className="w-5 h-5" />;
};

const getAdaptiveBg = (color: string, isDark: boolean, defaultDark: string = '#000000') => {
    if (!isDark) return color;
    // If it's absolute white or light gray, return dark background
    const c = color.toLowerCase();
    if (c === '#ffffff' || c === 'white' || c === '#f8fafc' || c === '#f1f5f9' || c === '#f3f4f6') {
        return defaultDark;
    }
    return color;
};

// Deep merge helper
const mergeConfig = (data: any): LandingPageConfig => {
    return {
        ...defaultConfig,
        ...data,
        themeColors: { ...defaultConfig.themeColors, ...(data.themeColors || {}) },
        header: {
            ...defaultConfig.header,
            ...(data.header || {}),
            menuItems: data.header?.menuItems || defaultConfig.header.menuItems,
        },
        hero: { ...defaultConfig.hero, ...(data.hero || {}) },
        footer: {
            ...defaultConfig.footer,
            ...(data.footer || {}),
            socialLinks: data.footer?.socialLinks || [],
            footerLinks: data.footer?.footerLinks || [],
        },
        features: {
            ...defaultConfig.features,
            ...(data.features || {}),
            boxes: data.features?.boxes || defaultConfig.features.boxes,
        },
        screenshots: {
            ...defaultConfig.screenshots,
            ...(data.screenshots || {}),
            gallery: data.screenshots?.gallery || [],
        },
        whyUs: {
            ...defaultConfig.whyUs,
            ...(data.whyUs || {}),
            reasons: data.whyUs?.reasons || [],
        },
        about: { ...defaultConfig.about, ...(data.about || {}) },
        reviews: {
            ...defaultConfig.reviews,
            ...(data.reviews || {}),
            testimonials: data.reviews?.testimonials || [],
        },
        faq: {
            ...defaultConfig.faq,
            ...(data.faq || {}),
            items: data.faq?.items || [],
        },
        contact: { ...defaultConfig.contact, ...(data.contact || {}) },
        sectionOrder: Array.isArray(data.sectionOrder)
            ? data.sectionOrder
            : defaultConfig.sectionOrder,
    };
};

// ------------------ Custom Hooks ------------------
const useLandingPageConfig = () => {
    const [config, setConfig] = useState<LandingPageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get('/landing-page/config');
                setConfig(mergeConfig(res.data));
            } catch (err) {
                console.error('Failed to fetch landing page config', err);
                setError(err as Error);
                setConfig(defaultConfig); // fallback
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    return { config, loading, error };
};

const useTheme = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const isDark = themeConfig.theme === 'dark';
    const dispatch = useDispatch();
    const toggle = useCallback(
        () => dispatch(toggleTheme(isDark ? 'light' : 'dark')),
        [dispatch, isDark]
    );
    return { isDark, toggle };
};

const useForm = <T extends Record<string, any>>(
    initialValues: T,
    validate?: (values: T) => Partial<T>
) => {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<T>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setValues((prev) => ({ ...prev, [name]: value }));
            if (validate) {
                const validationErrors = validate({ ...values, [name]: value });
                setErrors(validationErrors);
            }
        },
        [validate, values]
    );

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setTouched((prev) => ({ ...prev, [e.target.name]: true }));
        },
        []
    );

    return { values, errors, touched, handleChange, handleBlur, setValues };
};

const useFocusTrap = (modalRef: React.RefObject<HTMLElement>, isOpen: boolean) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // handled by parent
            }
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusableElements || focusableElements.length === 0) return;
                const first = focusableElements[0] as HTMLElement;
                const last = focusableElements[focusableElements.length - 1] as HTMLElement;
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, modalRef]);
};

// ------------------ UI State Management ------------------
interface UIState {
    isMobileMenuOpen: boolean;
    openFaqIndex: number | null;
    legalModal: { title: string; html: string } | null;
}

const initialUIState: UIState = {
    isMobileMenuOpen: false,
    openFaqIndex: null,
    legalModal: null,
};

type UIAction =
    | { type: 'SET_MOBILE_MENU'; payload: boolean }
    | { type: 'SET_FAQ_INDEX'; payload: number | null }
    | { type: 'OPEN_MODAL'; payload: { title: string; html: string } }
    | { type: 'CLOSE_MODAL' };

const uiReducer = (state: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'SET_MOBILE_MENU':
            return { ...state, isMobileMenuOpen: action.payload };
        case 'SET_FAQ_INDEX':
            return { ...state, openFaqIndex: action.payload };
        case 'OPEN_MODAL':
            return { ...state, legalModal: action.payload, isMobileMenuOpen: false };
        case 'CLOSE_MODAL':
            return { ...state, legalModal: null };
        default:
            return state;
    }
};

// ------------------ Loading / Error Components ------------------
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-10 h-10"></div>
    </div>
);

const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="min-h-screen flex items-center justify-center flex-col p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
        <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90"
        >
            Retry
        </button>
    </div>
);

const SectionSkeleton = () => (
    <div className="py-20 animate-pulse">
        <div className="container mx-auto px-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
            </div>
        </div>
    </div>
);

// ------------------ Section Components (Memoized) ------------------
interface HeaderProps {
    config: LandingPageConfig;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

const Header = React.memo<HeaderProps>(
    ({ config, isMobileMenuOpen, setIsMobileMenuOpen }) => {
        const { isDark, toggle } = useTheme();

        const handleMobileLinkClick = useCallback(() => {
            setIsMobileMenuOpen(false);
        }, [setIsMobileMenuOpen]);

        return (
            <header
                className={`z-50 w-full fixed top-0 transition-all duration-300 ${config.header.style === 'transparent'
                    ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800'
                    : 'bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800'
                    }`}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            {config.logoUrl && (
                                <img
                                    src={config.logoUrl}
                                    alt="Logo"
                                    className="h-8 w-auto object-contain"
                                />
                            )}
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {config.companyName || 'Report Maker'}
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            {config.header.menuItems
                                ?.filter((item) => item.enabled)
                                .map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            {(!config.header.menuItems || config.header.menuItems.length === 0) &&
                                config.sectionOrder
                                    .filter((s) => s.enabled && s.id !== 'hero')
                                    .map((s) => (
                                        <a
                                            key={s.id}
                                            href={`#${s.id}`}
                                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition font-medium"
                                        >
                                            {s.name}
                                        </a>
                                    ))}
                        </nav>

                        <div className="hidden md:flex items-center space-x-4">
                            <button
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
                                onClick={toggle}
                                aria-label="Toggle theme"
                            >
                                {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
                            </button>
                            <NavLink
                                to="/auth/boxed-signin"
                                className="font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition"
                            >
                                Sign In
                            </NavLink>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                className="p-2 text-gray-600 dark:text-gray-300"
                                onClick={toggle}
                                aria-label="Toggle theme"
                            >
                                {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
                            </button>
                            <button
                                className="p-2 text-gray-600 dark:text-gray-300"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-expanded={isMobileMenuOpen}
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <IconX className="w-6 h-6" />
                                ) : (
                                    <IconMenu2 className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 shadow-lg absolute w-full max-h-screen overflow-y-auto">
                        <div className="flex flex-col space-y-4">
                            {config.header.menuItems
                                ?.filter((item) => item.enabled)
                                .map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        className="text-gray-800 dark:text-gray-200 font-medium py-2"
                                        onClick={handleMobileLinkClick}
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            {(!config.header.menuItems || config.header.menuItems.length === 0) &&
                                config.sectionOrder
                                    .filter((s) => s.enabled && s.id !== 'hero')
                                    .map((s) => (
                                        <a
                                            key={s.id}
                                            href={`#${s.id}`}
                                            className="text-gray-800 dark:text-gray-200 font-medium py-2"
                                            onClick={handleMobileLinkClick}
                                        >
                                            {s.name}
                                        </a>
                                    ))}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col gap-3">
                                <NavLink
                                    to="/auth/boxed-signin"
                                    className="inline-flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full"
                                    onClick={handleMobileLinkClick}
                                >
                                    Sign In
                                </NavLink>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        );
    }
);

Header.displayName = 'Header';

// Hero Section
interface HeroProps {
    hero: LandingPageConfig['hero'];
    config: LandingPageConfig;
}

const Hero = React.memo<HeroProps>(({ hero, config }) => {
    const { isDark } = useTheme();
    const heroContent = (
        <div
            className={`z-10 ${hero.layout === 'contentCenter' ? 'text-center mx-auto' : ''
                } max-w-3xl`}
        >
            {hero.badge && (
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-6 border border-primary/20">
                    {hero.badge}
                </span>
            )}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
                {hero.title?.split(' ').map((word, i, arr) =>
                    i === arr.length - 1 ? (
                        <span
                            key={i}
                            className="text-transparent bg-clip-text"
                            style={{
                                backgroundImage: `linear-gradient(to right, hsl(var(--public-primary)), hsl(var(--public-secondary)))`,
                            }}
                        >
                            {' '}
                            {word}
                        </span>
                    ) : (
                        word + ' '
                    )
                )}
            </h1>
            <p className="mt-4 text-xl md:text-2xl mb-10 text-gray-600 dark:text-gray-300">
                {hero.subtitle}
            </p>
            <div
                className={`flex flex-col sm:flex-row gap-4 ${hero.layout === 'contentCenter' ? 'justify-center' : ''
                    }`}
            >
                {hero.primaryBtnEnabled && (
                    <NavLink
                        to={hero.primaryBtnLink || '/auth/boxed-signup'}
                        className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group"
                        style={{ backgroundColor: `hsl(var(--public-primary))` }}
                    >
                        {hero.primaryBtnText || 'Get Started'}{' '}
                        <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </NavLink>
                )}
                {hero.secondaryBtnEnabled && (
                    <a
                        href={hero.secondaryBtnLink || '#features'}
                        className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        {hero.secondaryBtnText || 'Learn More'}
                    </a>
                )}
            </div>
        </div>
    );

    return (
        <section
            id="hero"
            className="relative flex items-center overflow-hidden pt-20"
            style={{
                minHeight: hero.height,
                backgroundColor: getAdaptiveBg(hero.bgColor, isDark, '#030712')
            }}
        >
            {hero.bgOverlay && (
                <div
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: hero.overlayColor }}
                ></div>
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
                {hero.layout === 'contentLeft' || hero.layout === 'contentRight' ? (
                    <div
                        className={`flex flex-col lg:flex-row items-center gap-12 ${hero.layout === 'contentRight' ? 'lg:flex-row-reverse' : ''
                            }`}
                    >
                        <div className="w-full lg:w-1/2">{heroContent}</div>
                        {hero.imageUrl && (
                            <div className="w-full lg:w-1/2 flex justify-center">
                                <img
                                    src={hero.imageUrl}
                                    alt="Hero"
                                    className="max-w-full h-auto rounded-xl shadow-2xl animate-fadeInUp"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {heroContent}
                        {hero.imageUrl && (
                            <div className="mt-16 max-w-5xl mx-auto w-full">
                                <img
                                    src={hero.imageUrl}
                                    alt="Hero"
                                    className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/10"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
});

Hero.displayName = 'Hero';

// Features Section
interface FeaturesProps {
    features: LandingPageConfig['features'];
}

const Features = React.memo<FeaturesProps>(({ features }) => {
    const { isDark } = useTheme();
    let gridCols = 'md:grid-cols-2 lg:grid-cols-3';
    if (features.columns === '2') gridCols = 'md:grid-cols-2';
    if (features.columns === '4') gridCols = 'md:grid-cols-2 lg:grid-cols-4';

    // Modern background with subtle noise texture (optional)
    const bgStyle = {
        backgroundColor: getAdaptiveBg(features.bgColor, isDark, '#030712'),
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
    };

    return (
        <section
            id="features"
            className="py-20 lg:py-32 relative border-none border-gray-200/50 dark:border-gray-800/50"
            style={bgStyle}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 pb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {features.title || 'Features'}
                    </h2>
                    {features.description && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {features.description}
                        </p>
                    )}
                </div>

                {/* Layout Switch */}
                {features.layout === 'grid' ? (
                    <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
                        {features.boxes?.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative p-8 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                                style={{
                                    backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                                    ...(isDark && { backgroundImage: 'linear-gradient(to bottom right, rgba(17,24,39,0.9), rgba(17,24,39,0.7))' })
                                }}
                            >
                                {/* Decorative border inset */}
                                <div className="absolute inset-0 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 pointer-events-none" />

                                {features.displayIcon && (
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800"
                                        style={{
                                            color: `hsl(var(--public-primary))`,
                                        }}
                                    >
                                        {renderIcon(feature.icon, 'w-8 h-8')}
                                    </div>
                                )}

                                <h4 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                                    {feature.title}
                                </h4>

                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Optional subtle gradient border on hover */}
                                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border-2 border-transparent bg-gradient-to-r from-primary-500/20 to-purple-500/20 -m-[2px]" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Image with border and shadow */}
                        <div className="w-full lg:w-1/2">
                            {features.imageUrl && (
                                <div className="relative p-2 bg-white/50 dark:bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-xl">
                                    <img
                                        src={features.imageUrl}
                                        alt="Features"
                                        className="rounded-2xl w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Features list */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-8">
                            {features.boxes?.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group flex gap-6 p-6 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
                                >
                                    {features.displayIcon && (
                                        <div
                                            className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800"
                                            style={{ color: `hsl(var(--public-primary))` }}
                                        >
                                            {renderIcon(feature.icon, 'w-7 h-7')}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                                            {feature.title}
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
});

Features.displayName = 'Features';

// About Section
interface AboutProps {
    about: LandingPageConfig['about'];
}

const About = React.memo<AboutProps>(({ about }) => {
    const { isDark } = useTheme();

    // Background handling for parallax or solid color
    const sectionBg = about.parallax && about.imageUrl
        ? { backgroundImage: `url(${about.imageUrl})` }
        : { backgroundColor: getAdaptiveBg(about.bgColor, isDark, '#030712') };

    // Subtle noise texture overlay for non-parallax sections
    const noiseStyle = !about.parallax ? {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
    } : {};

    return (
        <section
            id="about"
            className={`py-20 lg:py-32 relative border-y border-gray-200/50 dark:border-gray-800/50 ${about.parallax ? 'bg-fixed bg-cover bg-center' : ''
                }`}
            style={{ ...sectionBg, ...noiseStyle }}
        >
            {/* Parallax overlay */}
            {about.parallax && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className={`text-4xl md:text-5xl font-bold pb-4 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 ${about.parallax ? '!text-white !bg-none' : ''
                            }`}
                    >
                        {about.title || 'About Us'}
                    </h2>
                    {about.description && (
                        <p
                            className={`text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto ${about.parallax ? '!text-gray-200' : ''
                                }`}
                        >
                            {about.description}
                        </p>
                    )}
                </div>

                {/* Story + Image Layout */}
                {(about.storyTitle || about.storyContent) && (
                    <div
                        className={`flex flex-col lg:flex-row items-center gap-12 ${about.imagePos === 'left' ? 'lg:flex-row-reverse' : ''
                            }`}
                    >
                        {/* Text Content */}
                        <div
                            className={`w-full ${!about.parallax && about.imageUrl
                                    ? 'lg:w-1/2'
                                    : 'lg:w-2/3 mx-auto'
                                }`}
                        >
                            <div
                                className={`p-8 md:p-10 rounded-3xl backdrop-blur-sm border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl ${about.parallax
                                        ? 'bg-black/40 text-white border-white/20'
                                        : 'bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-white'
                                    }`}
                                style={
                                    !about.parallax
                                        ? {
                                            backgroundImage:
                                                'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                                            ...(isDark && {
                                                backgroundImage:
                                                    'linear-gradient(to bottom right, rgba(17,24,39,0.9), rgba(17,24,39,0.7))',
                                            }),
                                        }
                                        : {}
                                }
                            >
                                {about.storyTitle && (
                                    <h3 className="text-2xl md:text-3xl font-bold mb-6">
                                        {about.storyTitle}
                                    </h3>
                                )}
                                {about.storyContent && (
                                    <div
                                        className={`prose prose-lg max-w-none ${about.parallax
                                                ? 'prose-invert text-gray-200'
                                                : 'dark:prose-invert'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: about.storyContent }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Image (only if not parallax) */}
                        {!about.parallax && about.imageUrl && (
                            <div className="w-full lg:w-1/2">
                                <div className="relative p-2 bg-white/50 dark:bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-xl transition-transform duration-300 hover:scale-[1.02]">
                                    <img
                                        src={about.imageUrl}
                                        alt="About Us"
                                        className="rounded-2xl w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
});

About.displayName = 'About';

// WhyUs Section
interface WhyUsProps {
    whyUs: LandingPageConfig['whyUs'];
    primaryBtnLink: string;
    primaryBtnText: string;
}

const WhyUs = React.memo<WhyUsProps>(({ whyUs, primaryBtnLink, primaryBtnText }) => {
    const { isDark } = useTheme();

    // Subtle noise texture background
    const noiseStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
    };

    return (
        <section
            id="whyUs"
            className="py-20 lg:py-32 relative border-y border-gray-200/50 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-900"
            style={noiseStyle}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 pb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {whyUs.title || 'Why Choose Us?'}
                    </h2>
                    {whyUs.subtitle && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {whyUs.subtitle}
                        </p>
                    )}
                </div>

                {/* Reasons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {whyUs.reasons?.map((reason, index) => (
                        <div
                            key={index}
                            className="group relative p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                            style={{
                                backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                                ...(isDark && { backgroundImage: 'linear-gradient(to bottom right, rgba(17,24,39,0.9), rgba(17,24,39,0.7))' })
                            }}
                        >
                            {/* Inner decorative border */}
                            <div className="absolute inset-0 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 pointer-events-none" />

                            <div className="flex gap-4">
                                {/* Icon with container */}
                                <div
                                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800"
                                    style={{ color: `hsl(var(--public-primary))` }}
                                >
                                    {renderIcon(reason.icon, 'w-6 h-6')}
                                </div>

                                <div>
                                    <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                                        {reason.title}
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        {reason.description}
                                    </p>
                                </div>
                            </div>

                            {/* Hover gradient border overlay */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border-2 border-transparent bg-gradient-to-r from-primary-500/20 to-purple-500/20 -m-[2px]" />
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                {(whyUs.ctaTitle || whyUs.ctaSubtitle) && (
                    <div className="relative max-w-4xl mx-auto">
                        <div
                            className="group p-8 md:p-12 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-primary-200/50 dark:border-primary-800/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] text-center"
                            style={{
                                backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                                ...(isDark && { backgroundImage: 'linear-gradient(to bottom right, rgba(17,24,39,0.9), rgba(17,24,39,0.7))' })
                            }}
                        >
                            {/* Inner decorative border */}
                            <div className="absolute inset-0 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 pointer-events-none" />

                            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                                {whyUs.ctaTitle}
                            </h3>
                            {whyUs.ctaSubtitle && (
                                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                                    {whyUs.ctaSubtitle}
                                </p>
                            )}
                            <NavLink
                                to={primaryBtnLink || '/auth/boxed-signup'}
                                className="inline-block px-10 py-4 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20"
                                style={{
                                    backgroundColor: `hsl(var(--public-primary))`,
                                }}
                            >
                                {primaryBtnText || 'Get Started Now'}
                            </NavLink>

                            {/* Hover gradient border */}
                            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border-2 border-transparent bg-gradient-to-r from-primary-500/20 to-purple-500/20 -m-[2px]" />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
});

WhyUs.displayName = 'WhyUs';

// Screenshots Section
interface ScreenshotsProps {
    screenshots: LandingPageConfig['screenshots'];
}

const Screenshots = React.memo<ScreenshotsProps>(({ screenshots }) => {
    const { isDark } = useTheme();

    if (!screenshots.gallery?.length) return null;

    // Subtle noise texture background
    const noiseStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
    };

    return (
        <section
            id="screenshots"
            className="py-20 lg:py-32 relative border-y border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-black"
            style={noiseStyle}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 pb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {screenshots.title || 'Platform Overview'}
                    </h2>
                    {screenshots.subtitle && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            {screenshots.subtitle}
                        </p>
                    )}
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {screenshots.gallery.map((img, index) => (
                        <div
                            key={index}
                            className="group relative p-2 bg-white/50 dark:bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                        >
                            {/* Inner decorative border */}
                            <div className="absolute inset-0 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 pointer-events-none" />

                            {/* Image Container */}
                            <div className="relative overflow-hidden rounded-2xl border-2 border-transparent group-hover:border-primary-200/50 dark:group-hover:border-primary-800/50 transition-colors duration-300">
                                <img
                                    src={img.url}
                                    alt={img.altText || img.title}
                                    className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>

                            {/* Overlay - Modern glass effect */}
                            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-3xl" />
                                <div className="absolute inset-0 backdrop-blur-[2px] rounded-3xl" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h4 className="text-xl font-bold mb-2">{img.title}</h4>
                                    {img.description && (
                                        <p className="text-gray-200 text-sm leading-relaxed">
                                            {img.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Hover gradient border overlay */}
                            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border-2 border-transparent bg-gradient-to-r from-primary-500/20 to-purple-500/20 -m-[2px]" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

Screenshots.displayName = 'Screenshots';

// Reviews Section
interface ReviewsProps {
    reviews: LandingPageConfig['reviews'];
}

const Reviews = React.memo<ReviewsProps>(({ reviews }) => {
    if (!reviews.testimonials?.length) return null;
    return (
        <section
            id="reviews"
            className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800"
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {reviews.title || 'What Our Customers Say'}
                    </h2>
                    {reviews.subtitle && (
                        <p className="text-lg opacity-70">{reviews.subtitle}</p>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.testimonials.map((testi, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm"
                        >
                            <div className="flex text-yellow-400 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <IconStar
                                        key={i}
                                        className={`w-5 h-5 ${i < testi.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-lg italic opacity-80 mb-6">"{testi.content}"</p>
                            <div>
                                <h5 className="font-bold">{testi.name}</h5>
                                <p className="text-sm opacity-60">
                                    {testi.role} {testi.company ? `, ${testi.company}` : ''}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

Reviews.displayName = 'Reviews';

// FAQ Section
interface FAQProps {
    faq: LandingPageConfig['faq'];
    openIndex: number | null;
    setOpenIndex: (index: number | null) => void;
}

const FAQ = React.memo<FAQProps>(({ faq, openIndex, setOpenIndex }) => {
    if (!faq.items?.length) return null;
    return (
        <section id="faq" className="py-20 lg:py-32 bg-white dark:bg-black">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {faq.title || 'Frequently Asked Questions'}
                    </h2>
                    {faq.subtitle && <p className="text-lg opacity-70">{faq.subtitle}</p>}
                </div>
                <div className="space-y-4">
                    {faq.items.map((item, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-200"
                        >
                            <button
                                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                aria-expanded={openIndex === index}
                                aria-controls={`faq-answer-${index}`}
                            >
                                <span className="font-semibold text-lg text-left">{item.question}</span>
                                <IconChevronDown
                                    className={`w-5 h-5 shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div
                                    id={`faq-answer-${index}`}
                                    className="px-6 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800"
                                >
                                    <div
                                        className="prose dark:prose-invert max-w-none opacity-80"
                                        dangerouslySetInnerHTML={{ __html: item.answer }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {(faq.ctaText || faq.btnText) && (
                    <div className="mt-12 text-center">
                        <p className="mb-4 opacity-80">{faq.ctaText}</p>
                        <a
                            href={faq.btnUrl || '#contact'}
                            className="btn btn-outline-primary rounded-full px-8 py-2"
                        >
                            {faq.btnText || 'Contact Support'}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
});

FAQ.displayName = 'FAQ';

// Contact Section
interface ContactProps {
    contact: LandingPageConfig['contact'];
    companyInfo: {
        address: string;
        email: string;
        phone: string;
        mapLink: string;
    };
}

const Contact = React.memo<ContactProps>(({ contact, companyInfo }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateContact = useCallback((values: any) => {
        const errors: any = {};
        if (!values.name) errors.name = 'Name is required';
        if (!values.email) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Email is invalid';
        if (!values.message) errors.message = 'Message is required';
        return errors;
    }, []);

    const { values, errors, touched, handleChange, handleBlur, setValues } = useForm(
        { name: '', email: '', subject: '', message: '' },
        validateContact
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Object.keys(errors).length > 0) return;
        setIsSubmitting(true);
        try {
            await api.post('/landing-page/contact', values);
            toast.success('Message sent successfully!');
            setValues({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            toast.error('Failed to send message.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section
            id="contact"
            className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {contact.title || 'Get In Touch'}
                    </h2>
                    {contact.subtitle && (
                        <p className="text-lg opacity-70">{contact.subtitle}</p>
                    )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-md shadow-inner border border-gray-100 dark:border-gray-700">
                        <h3 className="text-2xl font-bold mb-6">
                            {contact.formTitle || 'Send us a message'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1">
                                    Name *
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className={`form-input w-full ${touched.name && errors.name ? 'border-red-500' : ''
                                        }`}
                                    value={values.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="Sok Sabay"
                                    required
                                />
                                {touched.name && errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">
                                    Email *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className={`form-input w-full ${touched.email && errors.email ? 'border-red-500' : ''
                                        }`}
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="soksabay@gmail.com"
                                    required
                                />
                                {touched.email && errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                                    Subject
                                </label>
                                <input
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    className="form-input w-full"
                                    value={values.subject}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="How can we help?"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium mb-1">
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    className={`form-textarea w-full ${touched.message && errors.message ? 'border-red-500' : ''
                                        }`}
                                    value={values.message}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="Your message here..."
                                    required
                                ></textarea>
                                {touched.message && errors.message && (
                                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: `hsl(var(--public-primary))` }}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </Button>
                        </form>
                    </div>
                    <div className="flex flex-col justify-center space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">
                                {contact.infoTitle || 'Contact Information'}
                            </h3>
                            <p className="opacity-70 mb-8">{contact.infoDescription}</p>
                            <div className="space-y-6">
                                {companyInfo.address && (
                                    <div className="flex items-start gap-4 text-lg">
                                        <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary">
                                            <IconMapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-semibold mb-1">Address</div>
                                            <div className="opacity-70">{companyInfo.address}</div>
                                        </div>
                                    </div>
                                )}
                                {companyInfo.email && (
                                    <div className="flex items-start gap-4 text-lg">
                                        <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary">
                                            <IconMail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-semibold mb-1">Email</div>
                                            <div className="opacity-70">{companyInfo.email}</div>
                                        </div>
                                    </div>
                                )}
                                {companyInfo.phone && (
                                    <div className="flex items-start gap-4 text-lg">
                                        <div className="mt-1 p-2 rounded-full bg-primary/10 text-primary">
                                            <IconPhone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-semibold mb-1">Phone</div>
                                            <div className="opacity-70">{companyInfo.phone}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {companyInfo.mapLink && (
                            <div className="rounded-xl overflow-hidden shadow-sm h-64">
                                <iframe
                                    src={companyInfo.mapLink}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Google Maps"
                                ></iframe>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
});

Contact.displayName = 'Contact';

// Footer Section
interface FooterProps {
    config: LandingPageConfig;
    onLegalClick: (title: string, html: string) => void;
}

const Footer = React.memo<FooterProps>(({ config, onLegalClick }) => {
    if (!config.footer?.enabled) return null;

    return (
        <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            {config.logoUrl && (
                                <img
                                    src={config.logoUrl}
                                    alt="Logo"
                                    className="h-8 w-auto grayscale opacity-70 object-contain"
                                />
                            )}
                            <span className="text-xl font-bold opacity-80">
                                {config.companyName || 'Report Maker'}
                            </span>
                        </div>
                        <p className="opacity-60 max-w-sm mb-6">
                            {config.footer.description || config.hero?.subtitle}
                        </p>
                        <div className="flex gap-4">
                            {config.footer.socialLinks?.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-primary hover:text-white transition-colors"
                                >
                                    {getSocialIcon(link.icon || (link as any).platform)}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
                        <ul className="space-y-3">
                            {config.sectionOrder
                                .filter((s) => s.enabled && s.id !== 'hero')
                                .map((s) => (
                                    <li key={s.id}>
                                        <a
                                            href={`#${s.id}`}
                                            className="opacity-60 hover:opacity-100 hover:text-primary transition-opacity"
                                        >
                                            {s.name}
                                        </a>
                                    </li>
                                ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-lg">Important Links</h4>
                        <ul className="space-y-3">
                            {config.footer.footerLinks?.map((link, i) => (
                                <li key={i}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="opacity-60 hover:opacity-100 hover:text-primary transition-opacity"
                                    >
                                        {link.text}
                                    </a>
                                </li>
                            ))}
                            {config.termsOfService && (
                                <li>
                                    <button
                                        onClick={() => onLegalClick('Terms of Service', config.termsOfService)}
                                        className="opacity-60 hover:opacity-100 hover:text-primary transition-opacity text-left"
                                    >
                                        Terms of Service
                                    </button>
                                </li>
                            )}
                            {config.privacyPolicy && (
                                <li>
                                    <button
                                        onClick={() => onLegalClick('Privacy Policy', config.privacyPolicy)}
                                        className="opacity-60 hover:opacity-100 hover:text-primary transition-opacity text-left"
                                    >
                                        Privacy Policy
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center opacity-50 text-sm">
                    {config.footer.content ||
                        `© ${new Date().getFullYear()} ${config.companyName || 'Report Maker'}. All rights reserved.`}
                </div>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';

// Legal Modal Component
interface LegalModalProps {
    content: { title: string; html: string };
    onClose: () => void;
    fontFamily?: string;
}

const LegalModal = React.memo<LegalModalProps>(({ content, onClose, fontFamily }) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, true);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            ></div>
            <div
                ref={modalRef}
                className="relative bg-white dark:bg-gray-900 w-full max-w-4xl h-full max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden grid grid-rows-[auto,1fr,auto] animate-scaleIn"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-2xl font-bold">{content.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        aria-label="Close modal"
                    >
                        <IconX />
                    </button>
                </div>

                <ScrollArea
                    className="h-full w-full"
                    style={{ fontFamily: fontFamily || 'inherit' }}
                >
                    <div className="p-6 md:p-8">
                        <div
                            className="prose dark:prose-invert max-w-none ql-editor px-0"
                            dangerouslySetInnerHTML={{ __html: content.html }}
                        ></div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="rounded-full px-6"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
});

LegalModal.displayName = 'LegalModal';

// ------------------ Main Component ------------------
const PublicLandingPage = () => {
    const dispatch = useDispatch();
    const { config, loading, error } = useLandingPageConfig();
    const { isDark } = useTheme();

    const [uiState, dispatchUI] = useReducer(uiReducer, initialUIState);

    // Set page title and favicon when config loads
    useEffect(() => {
        if (config?.companyName) {
            dispatch(setPageTitle(config.companyName));
        }
        if (config?.faviconUrl) {
            updateFavicon(config.faviconUrl);
        }
    }, [config, dispatch]);

    // Compute theme styles
    const themeStyles = useMemo(() => {
        let primaryHsl: string;
        let secondaryHsl: string;
        let accentHsl: string;

        const themeColors = config?.themeColors;

        if (themeColors?.primary === 'custom' && themeColors.customPrimary) {
            const { h, s, l } = themeColors.customPrimary;
            primaryHsl = `${h} ${s}% ${l}%`;
            if (isDark) {
                // Adaptive secondary/accent for dark mode: darker and more desaturated
                secondaryHsl = `${h} 25% 15%`;
                accentHsl = `${h} 30% 18%`;
            } else {
                // Adaptive secondary/accent for light mode: very light and soft
                secondaryHsl = `${h} 40% 96%`;
                accentHsl = `${h} 50% 92%`;
            }
        } else {
            const selectedColor =
                THEME_COLORS.find((c) => c.value === themeColors?.primary) ||
                THEME_COLORS[0];
            primaryHsl = isDark ? selectedColor.darkPrimary : selectedColor.primary;
            secondaryHsl = isDark ? selectedColor.darkSecondary : selectedColor.secondary;
            accentHsl = isDark ? selectedColor.darkAccent : selectedColor.accent;
        }

        return {
            '--public-primary': primaryHsl,
            '--public-secondary': secondaryHsl,
            '--public-accent': accentHsl,
            fontFamily: config?.fontFamily || 'Nunito, sans-serif',
        } as React.CSSProperties;
    }, [config, isDark]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorFallback error={error} />;
    }

    if (!config) return null;

    const enabledSections = config.sectionOrder.filter((s) => s.enabled);

    const renderSection = (section: (typeof enabledSections)[0]) => {
        switch (section.id) {
            case 'hero':
                return <Hero key="hero" hero={config.hero} config={config} />;
            case 'features':
                return <Features key="features" features={config.features} />;
            case 'about':
                return <About key="about" about={config.about} />;
            case 'whyUs':
                return (
                    <WhyUs
                        key="whyUs"
                        whyUs={config.whyUs}
                        primaryBtnLink={config.hero.primaryBtnLink}
                        primaryBtnText={config.hero.primaryBtnText}
                    />
                );
            case 'screenshots':
                return <Screenshots key="screenshots" screenshots={config.screenshots} />;
            case 'reviews':
                return <Reviews key="reviews" reviews={config.reviews} />;
            case 'faq':
                return (
                    <FAQ
                        key="faq"
                        faq={config.faq}
                        openIndex={uiState.openFaqIndex}
                        setOpenIndex={(idx) => dispatchUI({ type: 'SET_FAQ_INDEX', payload: idx })}
                    />
                );
            case 'contact':
                return (
                    <Contact
                        key="contact"
                        contact={config.contact}
                        companyInfo={{
                            address: config.contactAddress,
                            email: config.contactEmail,
                            phone: config.contactPhone,
                            mapLink: config.googleMapLink,
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div
            style={themeStyles}
            className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
        >
            <Header
                config={config}
                isMobileMenuOpen={uiState.isMobileMenuOpen}
                setIsMobileMenuOpen={(open) => dispatchUI({ type: 'SET_MOBILE_MENU', payload: open })}
            />

            <main>
                {enabledSections.map((section) => (
                    <Suspense key={section.id} fallback={<SectionSkeleton />}>
                        {renderSection(section)}
                    </Suspense>
                ))}
            </main>

            <Footer
                config={config}
                onLegalClick={(title, html) =>
                    dispatchUI({ type: 'OPEN_MODAL', payload: { title, html } })
                }
            />

            {uiState.legalModal && (
                <LegalModal
                    content={uiState.legalModal}
                    onClose={() => dispatchUI({ type: 'CLOSE_MODAL' })}
                    fontFamily={config.fontFamily}
                />
            )}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out 0.3s both;
        }
      `}</style>
        </div>
    );
};

export default PublicLandingPage;