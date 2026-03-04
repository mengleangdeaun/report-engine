import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { IconTrash, IconMail } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import DeleteModal from '../../components/DeleteModal';

interface Submission {
    id: number;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    status: 'unread' | 'read' | 'replied';
    created_at: string;
}

const ContactSubmissions = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(setPageTitle('Contact Submissions'));
    }, [dispatch]);

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingMessage, setViewingMessage] = useState<Submission | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/landing-page/contacts');
            const data = res.data;
            // Handle various response shapes: { data: [...] }, plain array, or other
            if (Array.isArray(data)) {
                setSubmissions(data);
            } else if (data?.data && Array.isArray(data.data)) {
                setSubmissions(data.data);
            } else {
                setSubmissions([]);
            }
        } catch (error) {
            console.error('Failed to fetch contact submissions', error);
            toast.error('Failed to load submissions.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const updateStatus = async (id: number, status: string) => {
        try {
            await api.put(`/admin/landing-page/contacts/${id}/status`, { status });
            toast.success('Status updated');
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: status as any } : s));
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteClick = (id: number) => {
        setSubmissionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!submissionToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/admin/landing-page/contacts/${submissionToDelete}`);
            toast.success('Submission deleted');
            setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete));
            if (viewingMessage?.id === submissionToDelete) setViewingMessage(null);
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete submission');
        } finally {
            setIsDeleting(false);
            setSubmissionToDelete(null);
        }
    };

    const handleViewMessage = (sub: Submission) => {
        setViewingMessage(sub);
        if (sub.status === 'unread') {
            updateStatus(sub.id, 'read');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Contact Submissions</h2>
                    <p className="text-gray-500 dark:text-gray-400">Manage incoming messages from the public landing page.</p>
                </div>
                <Button onClick={fetchSubmissions} variant="outline" disabled={isLoading}>
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <span className="animate-spin border-4 border-primary border-t-transparent rounded-full w-8 h-8"></span>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                            <IconMail className="mx-auto h-10 w-10 mb-3 opacity-20" />
                            <p>No contact submissions found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Sender</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.map(sub => (
                                    <TableRow key={sub.id} className={sub.status === 'unread' ? 'bg-primary/5 font-semibold' : ''}>
                                        <TableCell>{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div>{sub.name}</div>
                                            <div className="text-xs text-muted-foreground font-normal">{sub.email}</div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {sub.subject || 'No Subject'}
                                        </TableCell>
                                        <TableCell>
                                            <Select value={sub.status} onValueChange={(val) => updateStatus(sub.id, val)}>
                                                <SelectTrigger className="w-28 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unread">Unread</SelectItem>
                                                    <SelectItem value="read">Read</SelectItem>
                                                    <SelectItem value="replied">Replied</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="secondary" size="sm" onClick={() => handleViewMessage(sub)}>View</Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => handleDeleteClick(sub.id)}>
                                                    <IconTrash size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!viewingMessage} onOpenChange={(open: boolean) => !open && setViewingMessage(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{viewingMessage?.subject || 'No Subject'}</DialogTitle>
                        <DialogDescription>
                            From: {viewingMessage?.name} ({viewingMessage?.email}) <br />
                            Date: {viewingMessage && new Date(viewingMessage.created_at).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 bg-gray-50 dark:bg-gray-900 border p-4 rounded-md whitespace-pre-wrap text-sm min-h-[150px]">
                        {viewingMessage?.message}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setViewingMessage(null)}>Close</Button>
                        <Button onClick={() => {
                            window.location.href = `mailto:${viewingMessage?.email}?subject=Re: ${viewingMessage?.subject || 'Your Message'}`;
                        }}>
                            Reply via Email
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                title="Delete Submission"
                message="Are you sure you want to delete this contact submission? This action cannot be undone."
            />
        </div>
    );
};

export default ContactSubmissions;
