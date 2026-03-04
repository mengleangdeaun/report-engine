import { useEffect, useState } from 'react';
import { IconLock, IconMail, IconArrowLeft } from '@tabler/icons-react';

const WorkspaceInactive = () => {
    const [teamName, setTeamName] = useState('Your workspace');
    const [ownerEmail, setOwnerEmail] = useState('');

    useEffect(() => {
        const name = sessionStorage.getItem('inactive_team_name');
        const email = sessionStorage.getItem('inactive_owner_email');
        if (name) setTeamName(name);
        if (email) setOwnerEmail(email);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                        <IconLock size={32} className="text-amber-600 dark:text-amber-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Workspace Deactivated
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        <span className="font-semibold text-gray-900 dark:text-white">{teamName}</span> has been deactivated by the workspace owner.
                    </p>

                    {/* Owner Contact */}
                    {ownerEmail && (
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                                Please contact the workspace owner to reactivate:
                            </p>
                            <a
                                href={`mailto:${ownerEmail}`}
                                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                                <IconMail size={16} />
                                {ownerEmail}
                            </a>
                        </div>
                    )}

                    {/* Back to Login */}
                    <a
                        href="/auth/boxed-signin"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                        <IconArrowLeft size={18} />
                        Back to Login
                    </a>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
                    If you believe this is a mistake, please reach out to your workspace administrator.
                </p>
            </div>
        </div>
    );
};

export default WorkspaceInactive;
