import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconFolder, IconFile, IconChevronLeft, IconSearch, IconX, IconCheck } from "@tabler/icons-react";
import api from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MediaLibrarySkeleton from "@/components/Skeletons/MediaLibrarySkeleton";

interface MediaFolder {
    id: number;
    name: string;
    color: string;
    parent_id: number | null;
    children_recursive?: MediaFolder[];
}

interface MediaFile {
    id: number;
    name: string;
    url: string;
    file_type: string;
    extension: string;
    size_human: string;
}

interface MediaSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (file: MediaFile) => void;
    allowedExtensions?: string[];
}

const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    allowedExtensions = ['csv', 'xlsx', 'xls', 'txt']
}) => {
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, activeFolderId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [foldersRes, filesRes] = await Promise.all([
                api.get('/media/folders'),
                api.get('/media/files', {
                    params: {
                        folder_id: activeFolderId,
                        search: search,
                        per_page: 100 // Load more for selection
                    }
                })
            ]);

            // For folders, we only show current level if not searching
            if (activeFolderId === null && !search) {
                setFolders(foldersRes.data);
            } else if (activeFolderId !== null) {
                // Find subfolders of active folder
                const findSubfolders = (list: MediaFolder[]): MediaFolder[] => {
                    for (const f of list) {
                        if (f.id === activeFolderId) return f.children_recursive || [];
                        if (f.children_recursive) {
                            const found = findSubfolders(f.children_recursive);
                            if (found.length > 0 || f.children_recursive.some(c => c.id === activeFolderId)) {
                                if (f.children_recursive.some(c => c.id === activeFolderId)) {
                                    const target = f.children_recursive.find(c => c.id === activeFolderId);
                                    return target?.children_recursive || [];
                                }
                                return found;
                            }
                        }
                    }
                    return [];
                };
                setFolders(findSubfolders(foldersRes.data));
            } else {
                setFolders([]);
            }

            // Filter files by allowed extensions
            const filteredFiles = (filesRes.data.data || []).filter((f: MediaFile) =>
                allowedExtensions.includes(f.extension.toLowerCase())
            );
            setFiles(filteredFiles);
        } catch (error) {
            console.error("Failed to fetch media", error);
        }
        setLoading(false);
    };

    const handleFolderClick = (id: number) => {
        setActiveFolderId(id);
    };

    const handleBack = () => {
        // This is a bit complex without path tracking, but let's simplify for now
        // or just go back to root if we don't track full path
        setActiveFolderId(null);
    };

    const handleSelect = () => {
        if (selectedFile) {
            onSelect(selectedFile);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Select Source File</span>
                        <div className="relative w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Search files..."
                                className="pl-9 h-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            />
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
                        <div className="flex items-center gap-2">
                            {activeFolderId && (
                                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
                                    <IconChevronLeft size={16} /> Back
                                </Button>
                            )}
                            <Badge variant="outline">
                                {activeFolderId ? "Subfolder" : "Root Library"}
                            </Badge>
                        </div>

                        <ScrollArea className="flex-1">
                            {loading ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                                    {/* Folders */}
                                    {folders.map((folder: MediaFolder) => (
                                        <div
                                            key={folder.id}
                                            onClick={() => handleFolderClick(folder.id)}
                                            className="group cursor-pointer p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all flex flex-col items-center gap-2"
                                        >
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30">
                                                <IconFolder size={24} style={{ color: folder.color }} fill={folder.color + '40'} />
                                            </div>
                                            <span className="text-xs font-medium text-center truncate w-full">{folder.name}</span>
                                        </div>
                                    ))}

                                    {/* Files */}
                                    {files.map((file: MediaFile) => (
                                        <div
                                            key={file.id}
                                            onClick={() => setSelectedFile(file)}
                                            className={`group cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-2
                                                ${selectedFile?.id === file.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
                                                    : 'border-gray-100 dark:border-gray-800 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                        >
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30">
                                                <IconFile size={24} className="text-gray-400" />
                                            </div>
                                            <span className="text-xs font-medium text-center line-clamp-2 w-full" title={file.name}>{file.name}</span>
                                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">{file.extension.toUpperCase()}</Badge>
                                        </div>
                                    ))}

                                    {folders.length === 0 && files.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-gray-500">
                                            No compatible files found in this folder.
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Quick Preview / Selection Info */}
                    {selectedFile && (
                        <div className="w-64 border-l border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4 bg-gray-50/50 dark:bg-gray-900/20">
                            <h4 className="font-semibold text-sm">Selection</h4>
                            <div className="aspect-square rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                                <IconFile size={48} className="text-gray-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold truncate pr-2" title={selectedFile.name}>{selectedFile.name}</p>
                                <p className="text-[10px] text-gray-500">{selectedFile.size_human} • {selectedFile.extension.toUpperCase()}</p>
                            </div>
                            <div className="mt-auto pt-4 flex flex-col gap-2">
                                <Button size="sm" className="w-full gap-2" onClick={handleSelect}>
                                    <IconCheck size={16} /> Select File
                                </Button>
                                <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedFile(null)}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-950">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={!selectedFile} onClick={handleSelect}>Confirm Selection</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MediaSelectorModal;
