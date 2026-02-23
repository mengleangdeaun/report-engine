import { Skeleton } from '../ui/skeleton';

interface QRCodeListSkeletonProps {
    viewMode: 'grid' | 'list';
}

const QRCodeListSkeleton = ({ viewMode }: QRCodeListSkeletonProps) => {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
                        <div className="aspect-square bg-muted/20 relative p-6 flex items-center justify-center">
                            <Skeleton className="w-44 h-44 rounded-lg" />
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="w-24 h-5 rounded-md" />
                                <Skeleton className="w-16 h-5 rounded-md" />
                            </div>
                            <Skeleton className="w-full h-4 rounded-md" />
                            <div className="flex items-center justify-between pt-2">
                                <Skeleton className="w-20 h-4 rounded-md" />
                                <div className="flex gap-2">
                                    <Skeleton className="w-8 h-8 rounded-md" />
                                    <Skeleton className="w-8 h-8 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="px-5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                <Skeleton className="w-32 h-6" />
                <Skeleton className="w-24 h-6" />
            </div>
            <div className="p-0">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-border/40 last:border-0">
                        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="w-48 h-5 rounded-md" />
                            <Skeleton className="w-32 h-4 rounded-md" />
                        </div>
                        <Skeleton className="w-24 h-8 rounded-md shrink-0 hidden sm:block" />
                        <Skeleton className="w-24 h-8 rounded-md shrink-0 hidden md:block" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QRCodeListSkeleton;
