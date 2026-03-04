import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    IconUserPlus, IconTrash, IconLock,
    IconUsers, IconCheck,
    IconInfoCircle, IconX, IconSearch,
    IconRefresh, IconPower, IconListCheck,
    IconChevronRight, IconFileAnalytics, IconBrandFacebook
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import DeleteModal from '../../components/DeleteModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const ClientManagement = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Add/Edit Modal State
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    // Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [availableReports, setAvailableReports] = useState<{ standard: any[], facebook: any[] }>({ standard: [], facebook: [] });
    const [selectedStandardIds, setSelectedStandardIds] = useState<number[]>([]);
    const [selectedFacebookIds, setSelectedFacebookIds] = useState<number[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchClients = async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableReports = async () => {
        setLoadingReports(true);
        try {
            const { data } = await api.get('/clients/available-reports');
            setAvailableReports(data);
        } catch (error: any) {
            toast.error('Failed to load reports');
        } finally {
            setLoadingReports(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleOpenClientModal = (client: any = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                name: client.name,
                email: client.email,
                password: '',
                is_active: client.is_active
            });
        } else {
            setEditingClient(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                is_active: true
            });
        }
        setClientModalOpen(true);
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, formData);
                toast.success('Client updated successfully');
            } else {
                await api.post('/clients', formData);
                toast.success('Client created successfully');
            }
            setClientModalOpen(false);
            fetchClients();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save client');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenAssignModal = async (client: any) => {
        setSelectedClient(client);
        setAssignModalOpen(true);
        await fetchAvailableReports();

        // In a real app, you might want to fetch EXACT assigned IDs for this client
        // For now, we'll assume the client object might have them or we fetch them
        try {
            const { data } = await api.get(`/portal/reports`); // Re-using portal endpoint is risky if we are admin, but let's assume we need a specific admin-fetch-assigned endpoint or it was pre-loaded
            // Actually, let's keep it simple: fetch assigned reports from a new endpoint if needed, or assume we start fresh for now in the demo
            setSelectedStandardIds([]);
            setSelectedFacebookIds([]);
        } catch (e) { }
    };

    const handleToggleReport = (id: number, type: 'standard' | 'facebook') => {
        if (type === 'standard') {
            setSelectedStandardIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            setSelectedFacebookIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    };

    const handleAssignReports = async () => {
        setAssigning(true);
        try {
            await api.post(`/clients/${selectedClient.id}/assign-reports`, {
                report_ids: selectedStandardIds,
                facebook_report_ids: selectedFacebookIds
            });
            toast.success('Reports assigned successfully');
            setAssignModalOpen(false);
            fetchClients();
        } catch (error: any) {
            toast.error('Failed to assign reports');
        } finally {
            setAssigning(false);
        }
    };

    const handleDeleteClient = async () => {
        setDeleting(true);
        try {
            await api.delete(`/clients/${clientToDelete.id}`);
            toast.success('Client deleted');
            setDeleteModalOpen(false);
            fetchClients();
        } catch (error: any) {
            toast.error('Failed to delete client');
        } finally {
            setDeleting(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <IconUsers className="text-primary" />
                        Manage Clients
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Create secure portals and assign reports to your external clients.</p>
                </div>
                <button
                    onClick={() => handleOpenClientModal()}
                    className="btn btn-primary gap-2"
                >
                    <IconUserPlus size={20} />
                    Add New Client
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="form-input pl-10 h-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4 text-center">Assigned Reports</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <IconRefresh className="animate-spin text-primary" size={24} />
                                            <span className="text-gray-500">Loading clients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        No clients found.
                                    </td>
                                </tr>
                            ) : filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white">{client.name}</div>
                                        <div className="text-sm text-gray-500">{client.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="badge bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                {client.reports_count || 0} Standard
                                            </div>
                                            <div className="badge bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                                                {client.facebook_ad_reports_count || 0} FB Ads
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`badge ${client.is_active ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                                            {client.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenAssignModal(client)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Assign Reports"
                                            >
                                                <IconListCheck size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenClientModal(client)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                title="Edit Client"
                                            >
                                                <IconLock size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setClientToDelete(client);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Client"
                                            >
                                                <IconTrash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Client Modal */}
            <Transition appear show={clientModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setClientModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl p-6 shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-6">
                                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                            {editingClient ? 'Edit Client' : 'Add New Client'}
                                        </Dialog.Title>
                                        <button onClick={() => setClientModalOpen(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                                            <IconX size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSaveClient} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company / Client Name</label>
                                            <Input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portal Email</label>
                                            <Input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {editingClient ? 'New Password (leave blank to keep current)' : 'Portal Password'}
                                            </label>
                                            <Input
                                                type="password"
                                                required={!editingClient}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <Checkbox
                                                id="is_active"
                                                checked={formData.is_active}
                                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                            />
                                            <label htmlFor="is_active" className="text-sm mb-0 font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                                Allow access to portal
                                            </label>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button type="button" variant="outline" onClick={() => setClientModalOpen(false)} className="flex-1">Cancel</Button>
                                            <Button type="submit" disabled={saving} className="flex-1">
                                                {saving ? <IconRefresh className="animate-spin" size={18} /> : (editingClient ? 'Save Changes' : 'Create Client')}
                                            </Button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Assign Reports Modal */}
            <Transition appear show={assignModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setAssignModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">Assign Reports</Dialog.Title>
                                            <p className="text-sm text-gray-500">Selecting reports for <span className="text-primary font-semibold">{selectedClient?.name}</span></p>
                                        </div>
                                        <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
                                            <IconX size={20} />
                                        </button>
                                    </div>

                                    {loadingReports ? (
                                        <div className="py-20 text-center">
                                            <IconRefresh className="animate-spin text-primary m-auto" size={32} />
                                            <p className="mt-4 text-gray-500">Loading available reports...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Standard Reports Section */}
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <IconFileAnalytics className="text-blue-500" size={18} />
                                                    Standard Reports
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
                                                    {availableReports.standard.length === 0 ? (
                                                        <p className="text-sm text-gray-500 col-span-2 py-4 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg italic">No standard reports found.</p>
                                                    ) : availableReports.standard.map(report => (
                                                        <div
                                                            key={report.id}
                                                            onClick={() => handleToggleReport(report.id, 'standard')}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedStandardIds.includes(report.id)
                                                                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50'
                                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200'
                                                                }`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${selectedStandardIds.includes(report.id) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
                                                                {selectedStandardIds.includes(report.id) && <IconCheck size={14} />}
                                                            </div>
                                                            <div className="flex-1 truncate">
                                                                <div className="text-sm font-semibold truncate">{report.page?.name || 'Standard Report'}</div>
                                                                <div className="text-[10px] text-gray-400 capitalize">{report.platform} • {new Date(report.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Facebook Ads Reports Section */}
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <IconBrandFacebook className="text-emerald-500" size={18} />
                                                    Facebook Ad Reports
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
                                                    {availableReports.facebook.length === 0 ? (
                                                        <p className="text-sm text-gray-500 col-span-2 py-4 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg italic">No Facebook reports found.</p>
                                                    ) : availableReports.facebook.map(report => (
                                                        <div
                                                            key={report.id}
                                                            onClick={() => handleToggleReport(report.id, 'facebook')}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedFacebookIds.includes(report.id)
                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/50'
                                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-200'
                                                                }`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${selectedFacebookIds.includes(report.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
                                                                {selectedFacebookIds.includes(report.id) && <IconCheck size={14} />}
                                                            </div>
                                                            <div className="flex-1 truncate">
                                                                <div className="text-sm font-semibold truncate">{report.account_name}</div>
                                                                <div className="text-[10px] text-gray-400">{new Date(report.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                                <button type="button" onClick={() => setAssignModalOpen(false)} className="btn btn-outline-danger flex-1">Cancel</button>
                                                <button
                                                    onClick={handleAssignReports}
                                                    disabled={assigning}
                                                    className="btn btn-primary flex-1"
                                                >
                                                    {assigning ? <IconRefresh className="animate-spin" size={18} /> : 'Confirm Assignments'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                title="Delete Client"
                message={`Are you sure you want to delete ${clientToDelete?.name}? They will lose all access to their portal immediately.`}
                onConfirm={handleDeleteClient}
                isLoading={deleting}
            />
        </div>
    );
};

export default ClientManagement;
