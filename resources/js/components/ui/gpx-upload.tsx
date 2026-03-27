import { router, useForm } from '@inertiajs/react';
import { gpx } from '@tmcw/togeojson';
import { FileX2, Loader2, RouteIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

interface GpxUploadProps {
    /** Whether the event already has a route stored */
    hasRoute: boolean;
    /** Original GPX filename (shown when a route exists) */
    routeGpxName: string | null;
    /** POST route to upload a new GPX file */
    uploadRoute: string;
    /** DELETE route to remove the current route */
    deleteRoute: string;
}

export function GpxUpload({ hasRoute, routeGpxName, uploadRoute, deleteRoute }: GpxUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const deleteForm = useForm({});

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        try {
            // Convert GPX → GeoJSON in the browser using @tmcw/togeojson
            const text = await file.text();
            const doc = new DOMParser().parseFromString(text, 'application/xml');

            // Check for XML parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                setUploadError('Invalid GPX file — could not parse XML.');
                setUploading(false);
                return;
            }

            const geojson = gpx(doc);

            if (!geojson.features || geojson.features.length === 0) {
                setUploadError('No track data found in this GPX file.');
                setUploading(false);
                return;
            }

            const data = new FormData();
            data.append('gpx', file);
            data.append('route_geojson', JSON.stringify(geojson));

            router.post(uploadRoute, data, {
                preserveScroll: true,
                onSuccess: () => {
                    if (inputRef.current) inputRef.current.value = '';
                },
                onError: (errors) => {
                    setUploadError(errors.gpx ?? errors.route_geojson ?? 'Upload failed.');
                },
                onFinish: () => setUploading(false),
            });
        } catch {
            setUploadError('Failed to read the GPX file.');
            setUploading(false);
        }
    };

    const handleDelete = () => {
        deleteForm.delete(deleteRoute, { preserveScroll: true });
    };

    const isBusy = uploading || deleteForm.processing;

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {hasRoute ? (
                        <>
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                <RouteIcon className="size-4 text-green-700 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                    Route uploaded
                                </p>
                                {routeGpxName && (
                                    <p className="text-xs text-muted-foreground">{routeGpxName}</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <FileX2 className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">No route file</p>
                                <p className="text-xs text-muted-foreground">
                                    Upload a GPX file to show the route on the map
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {hasRoute && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={handleDelete}
                        disabled={isBusy}
                    >
                        {deleteForm.processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Trash2 className="size-4" />
                        )}
                        <span className="ml-1.5">Remove</span>
                    </Button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".gpx,application/gpx+xml,text/xml,application/xml"
                className="hidden"
                onChange={handleFileChange}
                disabled={isBusy}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
            >
                {uploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 size-4" />
                )}
                {uploading
                    ? 'Converting & uploading…'
                    : hasRoute
                      ? 'Replace GPX file'
                      : 'Upload GPX file'}
            </Button>

            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
    );
}
