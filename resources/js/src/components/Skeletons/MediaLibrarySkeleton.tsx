import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';

interface MediaLibrarySkeletonProps {
    viewMode: 'grid' | 'list';
}

const MediaLibrarySkeleton = ({ viewMode }: MediaLibrarySkeletonProps) => {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {/* Preview Skeleton */}
                        <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                        </div>
                        {/* Info Skeleton */}
                        <div className="p-3 space-y-2">
                            <Skeleton className="h-3 w-3/4 rounded-full" />
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-2 w-12 rounded-full" />
                                <Skeleton className="h-2 w-10 rounded-full" />
                            </div>
                            <div className="mt-2">
                                <Skeleton className="h-4 w-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm">
                <thead className="bg-gray-50/50 dark:bg-gray-800/30">
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-4 py-3"><Skeleton className="h-3 w-16 rounded-full" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-3 w-12 rounded-full" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-3 w-10 rounded-full" /></th>
                        <th className="px-4 py-3"><Skeleton className="h-3 w-12 rounded-full" /></th>
                        <th className="px-4 py-3 text-right"><Skeleton className="h-3 w-10 ml-auto rounded-full" /></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[...Array(8)].map((_, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-5 w-5 rounded-md" />
                                    <Skeleton className="h-3 w-40 rounded-full" />
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </td>
                            <td className="px-4 py-3">
                                <Skeleton className="h-3 w-12 rounded-full" />
                            </td>
                            <td className="px-4 py-3">
                                <Skeleton className="h-3 w-20 rounded-full" />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
};

export default MediaLibrarySkeleton;
