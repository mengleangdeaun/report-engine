import path from 'path';
import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Finance = lazy(() => import('../pages/Finance'));
const Crypto = lazy(() => import('../pages/Crypto'));
const Todolist = lazy(() => import('../pages/Apps/Todolist'));

const ReportGenerator = lazy(() => import('../pages/Apps/Report/ReportGenerator'));
const FacebookReportGenerator = lazy(() => import('../pages/Apps/Report/FacebookReportGenerator'));
const TikTokReportGenerator = lazy(() => import('../pages/Apps/Report/TiktokReportGenerator'));
const FacebookAdsReportGenerator = lazy(() => import('../pages/Apps/Report/FacebookAdsReportGenerator'));
const PageManager = lazy(() => import('../pages/Apps/PageManager'));
const QRCodeGenerator = lazy(() => import('../pages/Apps/QRCodeGenerator'));
const QRCodeList = lazy(() => import('../pages/Apps/QRCodeList'));
const MediaLibrary = lazy(() => import('../pages/Apps/MediaLibrary/MediaLibrary'));

const PublicReportView = lazy(() => import('../pages/Public/PublicReportView'));
const PublicReportDashboard = lazy(() => import('../pages/Public/PublicLayout'));
const PublicPageDashboard = lazy(() => import('../pages/Public/components/PublicPageDashboard'));


const TeamManagement = lazy(() => import('../pages/Team/TeamManagement'));

const MustVerify = lazy(() => import('../pages/Authentication/VerifyEmail'));

const ActivityLog = lazy(() => import('../pages/Apps/ActivityLog'));

const TelegramSettings = lazy(() => import('../pages/Settings/TelegramSettings'));
const WorkspaceRoles = lazy(() => import('../pages/Settings/WorkspaceRoles'));


const Mailbox = lazy(() => import('../pages/Apps/Mailbox'));
const Notes = lazy(() => import('../pages/Apps/Notes'));
const Contacts = lazy(() => import('../pages/Apps/Contacts'));
const Chat = lazy(() => import('../pages/Apps/Chat'));
const Scrumboard = lazy(() => import('../pages/Apps/Scrumboard'));
const Calendar = lazy(() => import('../pages/Apps/Calendar'));
const List = lazy(() => import('../pages/Apps/Invoice/List'));
const Preview = lazy(() => import('../pages/Apps/Invoice/Preview'));
const Add = lazy(() => import('../pages/Apps/Invoice/Add'));
const Edit = lazy(() => import('../pages/Apps/Invoice/Edit'));
const Widgets = lazy(() => import('../pages/Widgets'));
const FontIcons = lazy(() => import('../pages/FontIcons'));
const DragAndDrop = lazy(() => import('../pages/DragAndDrop'));
const Tables = lazy(() => import('../pages/Tables'));

const Profile = lazy(() => import('../pages/Users/ProfileSetting'));
const KnowledgeBase = lazy(() => import('../pages/Pages/KnowledgeBase'));
const ContactUsBoxed = lazy(() => import('../pages/Pages/ContactUsBoxed'));
const ContactUsCover = lazy(() => import('../pages/Pages/ContactUsCover'));
const Faq = lazy(() => import('../pages/Pages/Faq'));
const ComingSoonBoxed = lazy(() => import('../pages/Pages/ComingSoonBoxed'));
const ComingSoonCover = lazy(() => import('../pages/Pages/ComingSoonCover'));
const ERROR404 = lazy(() => import('../pages/Pages/Error404'));
const ERROR500 = lazy(() => import('../pages/Pages/Error500'));
const ERROR503 = lazy(() => import('../pages/Pages/Error503'));
const Maintenence = lazy(() => import('../pages/Pages/Maintenence'));

const AuthCallback = lazy(() => import('../pages/Authentication/AuthCallback'));
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const RegisterBoxed = lazy(() => import('../pages/Authentication/RegisterBoxed'));
const UnlockBoxed = lazy(() => import('../pages/Authentication/UnlockBox'));
const RecoverIdBoxed = lazy(() => import('../pages/Authentication/RecoverIdBox'));
const LoginCover = lazy(() => import('../pages/Authentication/LoginCover'));
const RegisterCover = lazy(() => import('../pages/Authentication/RegisterCover'));
const RecoverIdCover = lazy(() => import('../pages/Authentication/RecoverIdCover'));
const UnlockCover = lazy(() => import('../pages/Authentication/UnlockCover'));
const ResetPasswordBoxed = lazy(() => import('../pages/Authentication/ResetPasswordBoxed'));
const Banned = lazy(() => import('../pages/Authentication/Banned'));


const UserManagement = lazy(() => import('../pages/Admin/UserManagement'));
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const SubscriptionManager = lazy(() => import('../pages/Admin/SubscriptionManager'));
const PlanManager = lazy(() => import('../pages/Admin/PlanSettings'));
const PermissionManagement = lazy(() => import('../pages/Admin/PermissionManagement'));
const ColorManager = lazy(() => import('../pages/Admin/ColorManager'));
const TopUpRequests = lazy(() => import('../pages/Admin/TopUpRequests'));
const SystemConfig = lazy(() => import('../pages/Admin/SystemConfig'));


const Dashboard = lazy(() => import('../pages/Dashboard'));
const UserDashboard = lazy(() => import('../pages/UserDashboard'));
const ReportHistory = lazy(() => import('../pages/Apps/Report/ReportHistory'));

const About = lazy(() => import('../pages/About'));
const Error = lazy(() => import('../components/Error'));
const Charts = lazy(() => import('../pages/Charts'));
const ProtectedRoute = lazy(() => import('../components/ProtectedRoute'));

// Helper Component to Decide Dashboard
// Helper Component to Decide Dashboard
const DashboardSplitter = () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // Check for super_admin role
    const isSuperAdmin = user?.roles?.some((r: any) =>
        (typeof r === 'string' && r === 'super_admin') ||
        (typeof r === 'object' && r.name === 'super_admin')
    );

    return isSuperAdmin ? <AdminDashboard /> : <Dashboard />;
};

const routes = [
    // dashboard
    // {
    //     path: '/',
    //     element: <Index />,
    // },
    // {
    //     path: '/index',
    //     element: <Index />,
    // },
    {
        path: '/dashboard',
        element: <Dashboard />,
    },
    // analytics page
    {
        path: '/analytics',
        element: <Analytics />,
    },
    // finance page
    {
        path: '/finance',
        element: <Finance />,
    },
    // 1. The Main Dashboard (Splits traffic)
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <DashboardSplitter />
            </ProtectedRoute>
        ),
    },
    {
        path: '/dashboard',
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/share/r/:uuid',
        element: <PublicReportView />,
        layout: 'blank'
    },

    {
        path: '/share/page/:token',
        element: <PublicPageDashboard />,
        layout: 'blank'
    },

    {
        path: '/team/settings',
        element: <TeamManagement />,
    },

    {
        path: '/apps/settings/telegram',
        element: <TelegramSettings />,
    },

    {
        path: '/apps/settings/roles',
        element: <WorkspaceRoles />,
    },

    {
        path: '/team/activity-logs',
        element: <ActivityLog />,
    },

    {
        path: '/admin/dashboard',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <AdminDashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/users',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <UserManagement />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/subscriptions',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <SubscriptionManager />
            </ProtectedRoute>
        ),
    },
    {
        path: '/auth/verify-email',
        element: <MustVerify />, // 👈 This is PUBLIC (or separate wrapper), NOT inside ProtectedRoute
        layout: 'blank'
    },
    {
        path: '/admin/plans',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <PlanManager />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/permissions',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <PermissionManagement />
            </ProtectedRoute>
        ),
    },


    {
        path: '/admin/colors',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <ColorManager />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/top-up-requests',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <TopUpRequests />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/system-config',
        element: (
            <ProtectedRoute roleRequired="super_admin">
                <SystemConfig />
            </ProtectedRoute>
        ),
    },

    // crypto page
    {
        path: '/crypto',
        element: <Crypto />,
    },
    {
        path: '/apps/report/history',
        element: <ReportHistory />,
    },
    {
        path: '/apps/todolist',
        element: <Todolist />,
    },
    {
        path: '/apps/reportgenerator',
        element: <ReportGenerator />,
    },
    {
        path: '/apps/report/facebook-report-generator',
        element: (
            // ✅ Change to match your new slugs
            <ProtectedRoute>
                <FacebookReportGenerator />
            </ProtectedRoute>
        ),
    },
    {
        path: '/apps/report/tiktok-report-generator',
        element: (
            // ✅ Change to match your new slugs
            <ProtectedRoute>
                <TikTokReportGenerator />
            </ProtectedRoute>
        ),
    },
    {
        path: '/apps/report/facebook-ads-report-generator',
        element: (
            <ProtectedRoute>
                <FacebookAdsReportGenerator />
            </ProtectedRoute>
        ),
    },
    {
        path: '/apps/media-library',
        element: (
            <ProtectedRoute>
                <MediaLibrary />
            </ProtectedRoute>
        ),
    },
    {
        path: '/apps/pagemanager',
        element: <PageManager />,
    },
    {
        path: '/apps/qr-code/create',
        element: <QRCodeGenerator />,
    },
    {
        path: '/apps/qr-code/edit/:id',
        element: <QRCodeGenerator />,
    },
    {
        path: '/apps/qr-code/list',
        element: <QRCodeList />,
    },
    {
        path: '/apps/notes',
        element: <Notes />,
    },
    {
        path: '/apps/contacts',
        element: <Contacts />,
    },
    {
        path: '/apps/mailbox',
        element: <Mailbox />,
    },
    {
        path: '/apps/invoice/list',
        element: <List />,
    },
    // Apps page
    {
        path: '/apps/chat',
        element: <Chat />,
    },
    {
        path: '/apps/scrumboard',
        element: <Scrumboard />,
    },
    {
        path: '/apps/calendar',
        element: <Calendar />,
    },
    // preview page
    {
        path: '/apps/invoice/preview',
        element: <Preview />,
    },
    {
        path: '/apps/invoice/add',
        element: <Add />,
    },
    {
        path: '/apps/invoice/edit',
        element: <Edit />,
    },

    // charts page
    {
        path: '/charts',
        element: <Charts />,
    },
    // widgets page
    {
        path: '/widgets',
        element: <Widgets />,
    },
    //  font-icons page
    {
        path: '/font-icons',
        element: <FontIcons />,
    },
    //  Drag And Drop page
    {
        path: '/dragndrop',
        element: <DragAndDrop />,
    },
    //  Tables page
    {
        path: '/tables',
        element: <Tables />,
    },

    // Users page
    {
        path: '/users/profile',
        element: <Profile />,
    },
    // pages
    {
        path: '/pages/knowledge-base',
        element: <KnowledgeBase />,
    },
    {
        path: '/pages/contact-us-boxed',
        element: <ContactUsBoxed />,
        layout: 'blank',
    },
    {
        path: '/pages/contact-us-cover',
        element: <ContactUsCover />,
        layout: 'blank',
    },
    {
        path: '/pages/faq',
        element: <Faq />,
    },
    {
        path: '/pages/coming-soon-boxed',
        element: <ComingSoonBoxed />,
        layout: 'blank',
    },
    {
        path: '/pages/coming-soon-cover',
        element: <ComingSoonCover />,
        layout: 'blank',
    },
    {
        path: '/pages/error404',
        element: <ERROR404 />,
        layout: 'blank',
    },
    {
        path: '/pages/error500',
        element: <ERROR500 />,
        layout: 'blank',
    },
    {
        path: '/pages/error503',
        element: <ERROR503 />,
        layout: 'blank',
    },
    {
        path: '/pages/maintenence',
        element: <Maintenence />,
        layout: 'blank',
    },
    //Authentication

    {
        path: '/auth/callback',
        element: <AuthCallback />,
        layout: 'blank', // Important: Use 'blank' layout so no Sidebar appears
    },
    {
        path: '/auth/boxed-signin',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/boxed-signup',
        element: <RegisterBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/boxed-lockscreen',
        element: <UnlockBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/boxed-password-reset',
        element: <RecoverIdBoxed />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-login',
        element: <LoginCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-register',
        element: <RegisterCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-lockscreen',
        element: <UnlockCover />,
        layout: 'blank',
    },
    {
        path: '/auth/cover-password-reset',
        element: <RecoverIdCover />,
        layout: 'blank',
    },
    {
        path: '/auth/reset-password/:token',
        element: <ResetPasswordBoxed />,
        layout: 'blank',
    },
    {
        path: '/banned',
        element: <Banned />,
        layout: 'blank',
    },
    {
        path: '/about',
        element: <About />,
        layout: 'blank',
    },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
