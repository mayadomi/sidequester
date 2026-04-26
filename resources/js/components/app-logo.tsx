import { usePage } from '@inertiajs/react';

import type { SharedData } from '@/types';

export default function AppLogo() {
    const { festivalName } = usePage<SharedData>().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center">
                <img src="/favicon.svg" alt="" className="size-8" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {festivalName} Side Quester
                </span>
            </div>
        </>
    );
}
