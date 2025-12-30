import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react'; // ✅ Added Dialog
import { IconUsers, IconCheck, IconPlus, IconBriefcase, IconShieldLock } from '@tabler/icons-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TeamSwitcher = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [currentTeamId, setCurrentTeamId] = useState<number | null>(null);
    const [planLimit, setPlanLimit] = useState({ used: 0, max: 1 }); // ✅ Track limits

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/team/all');
            setTeams(res.data.teams);
            setCurrentTeamId(res.data.current_team_id);
            // ✅ Assuming backend returns these now
            setPlanLimit({
                used: res.data.owned_count,
                max: res.data.max_workspaces
            });
        } catch (e) {
            console.error("Failed to load teams");
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleSwitch = async (teamId: number) => {
        if (teamId === currentTeamId) return;
        try {
            await api.post('/team/switch', { team_id: teamId });
            toast.success("Workspace switched!");
            window.location.reload(); 
        } catch (e) {
            toast.error("Failed to switch team");
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await api.post('/team/store', { name: newTeamName });
            toast.success(res.data.message);
            setIsCreateModalOpen(false);
            setNewTeamName('');
            handleSwitch(res.data.team_id); // ✅ Switch to the brand new team immediately
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to create workspace");
        } finally {
            setIsCreating(false);
        }
    };

    const activeTeamName = teams.find(t => t.id === currentTeamId)?.name || 'My Workspace';

    return (
        <>
            <div className="relative inline-block text-left">
                <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:bg-[#1b2e4b] dark:border-[#253b5c]">
                        <IconUsers size={16} />
                        <span className="truncate max-w-[150px]">{activeTeamName}</span>
                    </Menu.Button>

                    <Transition as={Fragment} /* ... same transitions as before ... */>
                        <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-[#1b2e4b] dark:divide-gray-700 z-50">
                            {/* Plan Usage Info */}
                            <div className="px-4 py-3 bg-gray-50 dark:bg-black/20">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Workspace Usage</p>
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{planLimit.used} of {planLimit.max} Used</span>
                                    <span>{Math.round((planLimit.used / planLimit.max) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                                    <div className="bg-primary h-1 rounded-full" style={{ width: `${(planLimit.used / planLimit.max) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="px-1 py-1">
                                {teams.map((team) => (
                                    <Menu.Item key={team.id}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => handleSwitch(team.id)}
                                                className={`${active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-200'} group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm`}
                                            >
                                                <span className="truncate">{team.name}</span>
                                                {team.id === currentTeamId && <IconCheck size={16} className="text-primary" />}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>

                                <div className="px-1 py-1">
                                    {/* ✅ SMART CHECK: Only show button if usage is below max */}
                                    {planLimit.used < planLimit.max ? (
                                        <Menu.Item>
                                            <button 
                                                onClick={() => setIsCreateModalOpen(true)}
                                                className="text-gray-500 group flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 hover:dark:bg-gray-800"
                                            >
                                                <IconPlus size={14} /> Create New Team
                                            </button>
                                        </Menu.Item>
                                    ) : (
                                        <div className="px-2 py-2 text-xs text-gray-400 italic bg-gray-50 dark:bg-black/10 rounded-md mx-1">
                                            <div className="flex items-center gap-1">
                                                <IconShieldLock size={12} /> Limit reached ({planLimit.max}/{planLimit.max})
                                            </div>
                                            <p className="mt-1">Upgrade your plan to add more workspaces.</p>
                                        </div>
                                    )}
                                </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>

            {/* --- CREATE WORKSPACE MODAL --- */}
            <Transition appear show={isCreateModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[100]" onClose={() => setIsCreateModalOpen(false)}>
                    <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="panel w-full max-w-md rounded-lg bg-white dark:bg-[#1b2e4b] p-6 shadow-xl">
                            <Dialog.Title className="text-lg font-bold mb-4 flex items-center gap-2">
                                <IconBriefcase className="text-primary" /> Create New Workspace
                            </Dialog.Title>
                            
                            <form onSubmit={handleCreateTeam}>
                                <div className="mb-5">
                                    <label className="text-sm font-medium mb-1 block">Workspace Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. Project Alpha" 
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        required 
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        This will create a new independent workspace with its own settings and members.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                    <button type="button" className="btn btn-outline-danger" onClick={() => setIsCreateModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isCreating}>
                                        {isCreating ? 'Creating...' : 'Create Workspace'}
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default TeamSwitcher;